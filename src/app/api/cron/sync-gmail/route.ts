import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAccessToken, getMessage, listMessageIds } from "@/lib/gmail";
import { classifyReply } from "@/lib/ai/classify";
import type { Lead } from "@/lib/types";

export const maxDuration = 300;

/* Cron sync-gmail (PRD §6.5, cada 15 min): lee respuestas nuevas, las empareja
   con su envío/lead, las clasifica con IA y actualiza estados/secuencias. */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: accounts } = await supabase.from("gmail_tokens").select("user_id");
  if (!accounts?.length) return NextResponse.json({ accounts: 0, processed: 0, matched: 0 });

  let processed = 0;
  let matched = 0;

  for (const account of accounts as { user_id: string }[]) {
    const userId = account.user_id;
    const token = await getAccessToken(supabase, userId);
    if (!token) continue;

    const ids = await listMessageIds(token, "in:inbox newer_than:14d", 50);
    if (!ids.length) continue;

    // descarta los ya procesados (idempotencia por gmail_message_id)
    const { data: existing } = await supabase
      .from("replies")
      .select("gmail_message_id")
      .in("gmail_message_id", ids);
    const seen = new Set(((existing as { gmail_message_id: string }[]) ?? []).map((r) => r.gmail_message_id));

    for (const id of ids) {
      if (seen.has(id)) continue;
      const msg = await getMessage(token, id);
      if (!msg?.fromEmail) continue;
      processed++;

      // 1º por cabeceras In-Reply-To/References contra rfc_message_id
      const refs = [...msg.references, ...(msg.inReplyTo ? [msg.inReplyTo] : [])];
      let send: { id: string; lead_id: string | null } | null = null;
      if (refs.length) {
        const { data } = await supabase
          .from("email_sends")
          .select("id, lead_id")
          .eq("user_id", userId)
          .in("rfc_message_id", refs)
          .limit(1)
          .maybeSingle();
        send = data;
      }

      // 2º por remitente contra leads.email
      let lead: Lead | null = null;
      if (send?.lead_id) {
        const { data } = await supabase.from("leads").select().eq("id", send.lead_id).maybeSingle();
        lead = data as Lead | null;
      }
      if (!lead) {
        const { data } = await supabase
          .from("leads")
          .select()
          .eq("user_id", userId)
          .ilike("email", msg.fromEmail)
          .limit(1)
          .maybeSingle();
        lead = data as Lead | null;
      }
      if (!lead) continue; // no es respuesta de un lead nuestro
      matched++;

      const { data: reply, error: insertError } = await supabase
        .from("replies")
        .insert({
          user_id: userId,
          lead_id: lead.id,
          email_send_id: send?.id ?? null,
          gmail_message_id: msg.id,
          from_email: msg.fromEmail,
          snippet: msg.snippet,
          body_text: msg.bodyText,
          received_at: msg.receivedAt,
        })
        .select()
        .single();
      if (insertError || !reply) continue;

      const ai = await classifyReply({ leadName: lead.name, subject: msg.subject, body: msg.bodyText || msg.snippet });
      if (ai) {
        await supabase
          .from("replies")
          .update({ ai_classification: ai.classification, ai_summary: ai.summary })
          .eq("id", reply.id);
      }
      const classification = ai?.classification ?? "other";

      if (classification === "unsubscribe") {
        await supabase
          .from("leads")
          .update({ unsubscribed: true, updated_at: new Date().toISOString() })
          .eq("id", lead.id);
        await supabase.from("suppression_list").upsert(
          { user_id: userId, email: lead.email!.toLowerCase(), reason: "unsubscribe" },
          { onConflict: "user_id,email", ignoreDuplicates: true }
        );
        await supabase.from("campaign_leads").update({ status: "stopped" }).eq("lead_id", lead.id);
      }

      if (classification !== "auto_reply") {
        // respuesta real → detiene la secuencia y asciende el lead (PRD §6.5.6)
        await supabase
          .from("leads")
          .update({ status: "replied", updated_at: new Date().toISOString() })
          .eq("id", lead.id);
        await supabase
          .from("campaign_leads")
          .update({ status: "replied", next_step_due_at: null })
          .eq("lead_id", lead.id)
          .eq("status", "in_progress");
      }

      await supabase.from("activity_log").insert({
        user_id: userId,
        lead_id: lead.id,
        type: "replied",
        description: `${lead.name} respondió${ai ? ` (${classification})` : ""}: "${msg.snippet.slice(0, 120)}"`,
        metadata: { reply_id: reply.id, classification, send_id: send?.id ?? null },
      });
    }
  }

  return NextResponse.json({ accounts: accounts.length, processed, matched });
}
