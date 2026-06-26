import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendStepEmail, sentTodayCount } from "@/lib/email/send";
import type { CampaignLead, CampaignStep, Lead, Settings, Template } from "@/lib/types";

/* Lanzamiento manual del paso inicial (PRD §6.3):
   crea/activa campaign_leads, envía el paso 0 respetando daily_send_cap
   y programa next_step_due_at del paso 1. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: campaign } = await supabase.from("campaigns").select().eq("id", id).maybeSingle();
  if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

  const { data: settings } = await supabase.from("settings").select().eq("user_id", user.id).maybeSingle();
  if (!settings?.sender_email || !settings?.company_legal_name || !settings?.company_address) {
    return NextResponse.json(
      { error: "Configura remitente, razón social y dirección en Ajustes antes de enviar (pie legal obligatorio)." },
      { status: 400 }
    );
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Falta RESEND_API_KEY en el entorno." }, { status: 500 });
  }

  const { data: steps } = await supabase
    .from("campaign_steps")
    .select()
    .eq("campaign_id", id)
    .order("step_order");
  const step0 = (steps as CampaignStep[] | null)?.[0];
  if (!step0?.template_id) {
    return NextResponse.json({ error: "La secuencia necesita un paso 0 con plantilla." }, { status: 400 });
  }
  const { data: template } = await supabase.from("templates").select().eq("id", step0.template_id).single();
  if (!template) return NextResponse.json({ error: "Plantilla del paso 0 no encontrada." }, { status: 400 });

  const { data: members } = await supabase
    .from("campaign_leads")
    .select()
    .eq("campaign_id", id)
    .eq("status", "pending");
  if (!members?.length) {
    return NextResponse.json({ error: "No hay destinatarios pendientes en la campaña." }, { status: 400 });
  }

  const leadIds = (members as CampaignLead[]).map((m) => m.lead_id);
  const { data: leadsData } = await supabase.from("leads").select().in("id", leadIds);
  const leadById = new Map(((leadsData as Lead[]) ?? []).map((l) => [l.id, l]));

  const { data: suppData } = await supabase.from("suppression_list").select("email").eq("user_id", user.id);
  const suppressed = new Set(((suppData as { email: string }[]) ?? []).map((r) => r.email.toLowerCase()));

  const cap = settings.daily_send_cap ?? 50;
  const alreadySent = await sentTodayCount(supabase, user.id);
  let budget = Math.max(0, cap - alreadySent);

  const nextStep = (steps as CampaignStep[])[1];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const member of members as CampaignLead[]) {
    const lead = leadById.get(member.lead_id);
    // revalidación en servidor (PRD §9): supresión, bajas y rebotes nunca se contactan
    if (!lead?.email || lead.unsubscribed || lead.bounced || suppressed.has(lead.email.toLowerCase())) {
      await supabase.from("campaign_leads").update({ status: "stopped" }).eq("id", member.id);
      skipped++;
      continue;
    }
    if (budget <= 0) break;

    const result = await sendStepEmail({
      supabase,
      lead,
      template: template as Template,
      settings: settings as Settings,
      campaignId: id,
      stepOrder: 0,
    });
    if (!result.ok) {
      failed++;
      continue;
    }
    budget--;
    sent++;

    const patch = nextStep
      ? {
          status: "in_progress",
          current_step: 0,
          next_step_due_at: new Date(Date.now() + nextStep.delay_days * 86400000).toISOString(),
        }
      : { status: "completed", current_step: 0, next_step_due_at: null };
    await supabase.from("campaign_leads").update(patch).eq("id", member.id);

    if (lead.status === "new") {
      await supabase
        .from("leads")
        .update({ status: "contacted", updated_at: new Date().toISOString() })
        .eq("id", lead.id);
    }
  }

  await supabase.from("campaigns").update({ status: "active" }).eq("id", id);

  const pending = (members as CampaignLead[]).length - sent - skipped - failed;
  return NextResponse.json({ sent, skipped, failed, pending, capRemaining: budget });
}
