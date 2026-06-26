import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/* Webhook de Resend (PRD §6.4) — firmado con Svix.
   delivered|opened|clicked → email_events; bounced|complained → supresión + lead marcado. */

function verifySvix(payload: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return false;
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!id || !timestamp || !signatures) return false;

  // tolerancia de 5 min contra replay
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${payload}`).digest("base64");
  const expectedBuf = Buffer.from(expected);

  for (const part of signatures.split(" ")) {
    const sig = part.split(",")[1];
    if (!sig) continue;
    const sigBuf = Buffer.from(sig);
    if (sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf)) return true;
  }
  return false;
}

const EVENT_MAP: Record<string, string> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

export async function POST(request: Request) {
  const payload = await request.text();
  if (!verifySvix(payload, request.headers)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const event = JSON.parse(payload) as { type: string; data?: { email_id?: string } };
  const type = EVENT_MAP[event.type];
  const emailId = event.data?.email_id;
  if (!type || !emailId) return NextResponse.json({ received: true });

  const supabase = createAdminClient();
  const { data: send } = await supabase
    .from("email_sends")
    .select()
    .eq("resend_message_id", emailId)
    .maybeSingle();
  if (!send) return NextResponse.json({ received: true });

  await supabase.from("email_events").insert({
    email_send_id: send.id,
    type,
    metadata: event.data ?? null,
  });

  if (type === "delivered") {
    await supabase.from("email_sends").update({ status: "delivered" }).eq("id", send.id);
  }

  if (type === "bounced" || type === "complained") {
    if (type === "bounced") {
      await supabase.from("email_sends").update({ status: "bounced" }).eq("id", send.id);
    }
    if (send.lead_id) {
      const { data: lead } = await supabase.from("leads").select().eq("id", send.lead_id).maybeSingle();
      if (lead) {
        await supabase
          .from("leads")
          .update({ bounced: true, updated_at: new Date().toISOString() })
          .eq("id", lead.id);
        if (lead.email) {
          await supabase.from("suppression_list").upsert(
            {
              user_id: send.user_id,
              email: lead.email.toLowerCase(),
              reason: type === "bounced" ? "bounce" : "complaint",
            },
            { onConflict: "user_id,email", ignoreDuplicates: true }
          );
        }
        await supabase.from("campaign_leads").update({ status: "stopped" }).eq("lead_id", lead.id);
        await supabase.from("activity_log").insert({
          user_id: send.user_id,
          lead_id: lead.id,
          type: "note",
          description: `Email a ${lead.name} ${type === "bounced" ? "rebotado" : "marcado como spam"} — añadido a supresión`,
          metadata: { send_id: send.id, event: type },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
