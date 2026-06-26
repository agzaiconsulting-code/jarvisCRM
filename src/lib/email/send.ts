import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderHtmlBody, renderSubject } from "@/lib/email/render";
import type { Lead, Settings, Template } from "@/lib/types";

/* Envío de un paso de campaña a un lead (PRD §6.4).
   Reutilizado por el lanzamiento manual (paso 0) y el cron de secuencias. */

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

export async function getOrCreateUnsubToken(
  supabase: SupabaseClient,
  userId: string,
  leadId: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("unsubscribe_tokens")
    .select("token")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (existing) return existing.token as string;
  const { data } = await supabase
    .from("unsubscribe_tokens")
    .insert({ user_id: userId, lead_id: leadId })
    .select("token")
    .single();
  return data!.token as string;
}

export async function sendStepEmail({
  supabase,
  lead,
  template,
  settings,
  campaignId,
  stepOrder,
}: {
  supabase: SupabaseClient;
  lead: Lead;
  template: Template;
  settings: Settings;
  campaignId: string;
  stepOrder: number;
}): Promise<{ ok: boolean; error?: string }> {
  if (!lead.email) return { ok: false, error: "Lead sin email" };
  if (!settings.sender_email) return { ok: false, error: "Remitente sin configurar" };

  const subject = renderSubject(template, lead, settings);

  const { data: send, error: insertError } = await supabase
    .from("email_sends")
    .insert({
      user_id: lead.user_id,
      campaign_id: campaignId,
      lead_id: lead.id,
      step_order: stepOrder,
      subject,
      status: "queued",
    })
    .select()
    .single();
  if (insertError || !send) return { ok: false, error: insertError?.message ?? "No se pudo crear el envío" };

  const token = await getOrCreateUnsubToken(supabase, lead.user_id, lead.id);
  const { html, text } = renderHtmlBody({
    template,
    lead,
    settings,
    baseUrl: APP_BASE_URL,
    sendId: send.id as string,
    unsubscribeToken: token,
  });

  const domain = settings.sending_domain ?? process.env.SENDING_DOMAIN ?? settings.sender_email.split("@")[1];
  const rfcMessageId = `<${send.id}@${domain}>`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: settings.sender_name ? `${settings.sender_name} <${settings.sender_email}>` : settings.sender_email,
      to: lead.email,
      subject,
      html,
      text,
      headers: { "Message-ID": rfcMessageId },
    });
    if (error) throw new Error(error.message);

    await supabase
      .from("email_sends")
      .update({
        resend_message_id: data?.id ?? null,
        rfc_message_id: rfcMessageId,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", send.id);

    await supabase.from("activity_log").insert({
      user_id: lead.user_id,
      lead_id: lead.id,
      type: "email_sent",
      description: `Email enviado a ${lead.name} (paso ${stepOrder}): "${subject}"`,
      metadata: { campaign_id: campaignId, step_order: stepOrder, send_id: send.id },
    });
    return { ok: true };
  } catch (e) {
    await supabase
      .from("email_sends")
      .update({ status: "failed" })
      .eq("id", send.id);
    return { ok: false, error: e instanceof Error ? e.message : "Error de envío" };
  }
}

/** Envíos hechos hoy por el usuario (para respetar daily_send_cap). */
export async function sentTodayCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("email_sends")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("sent_at", dayStart.toISOString());
  return count ?? 0;
}
