import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendStepEmail, sentTodayCount } from "@/lib/email/send";
import type { CampaignLead, CampaignStep, Lead, Settings, Template } from "@/lib/types";

export const maxDuration = 300;

/* Cron process-sequences (PRD §6.3, cada hora):
   envía el siguiente paso a los campaign_leads vencidos, saltando
   respondidos, bajas, rebotes y supresión; respeta el daily_send_cap. */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: dueData, error } = await supabase
    .from("campaign_leads")
    .select()
    .eq("status", "in_progress")
    .lte("next_step_due_at", now)
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const due = (dueData as CampaignLead[]) ?? [];
  if (due.length === 0) return NextResponse.json({ processed: 0, sent: 0, skipped: 0, completed: 0 });

  // cachés por campaña/plantilla/usuario para no repetir consultas
  const stepsByCampaign = new Map<string, CampaignStep[]>();
  const templateById = new Map<string, Template>();
  const settingsByUser = new Map<string, Settings | null>();
  const suppressionByUser = new Map<string, Set<string>>();
  const budgetByUser = new Map<string, number>();

  async function getSteps(campaignId: string): Promise<CampaignStep[]> {
    if (!stepsByCampaign.has(campaignId)) {
      const { data } = await supabase.from("campaign_steps").select().eq("campaign_id", campaignId).order("step_order");
      stepsByCampaign.set(campaignId, (data as CampaignStep[]) ?? []);
    }
    return stepsByCampaign.get(campaignId)!;
  }

  async function getTemplate(id: string): Promise<Template | null> {
    if (!templateById.has(id)) {
      const { data } = await supabase.from("templates").select().eq("id", id).maybeSingle();
      if (data) templateById.set(id, data as Template);
      else return null;
    }
    return templateById.get(id) ?? null;
  }

  async function getUserContext(userId: string) {
    if (!settingsByUser.has(userId)) {
      const { data: s } = await supabase.from("settings").select().eq("user_id", userId).maybeSingle();
      settingsByUser.set(userId, (s as Settings) ?? null);
      const { data: supp } = await supabase.from("suppression_list").select("email").eq("user_id", userId);
      suppressionByUser.set(userId, new Set(((supp as { email: string }[]) ?? []).map((r) => r.email.toLowerCase())));
      const cap = (s as Settings | null)?.daily_send_cap ?? 50;
      budgetByUser.set(userId, Math.max(0, cap - (await sentTodayCount(supabase, userId))));
    }
    return {
      settings: settingsByUser.get(userId)!,
      suppressed: suppressionByUser.get(userId)!,
    };
  }

  let sent = 0;
  let skipped = 0;
  let completedCount = 0;
  let failed = 0;

  for (const member of due) {
    const { data: leadData } = await supabase.from("leads").select().eq("id", member.lead_id).maybeSingle();
    const lead = leadData as Lead | null;
    if (!lead) {
      skipped++;
      continue;
    }

    const { settings, suppressed } = await getUserContext(lead.user_id);

    // saltos definitivos (PRD §6.3.2): respondido, baja, rebote o supresión → stopped
    if (
      lead.status === "replied" ||
      lead.unsubscribed ||
      lead.bounced ||
      !lead.email ||
      suppressed.has(lead.email.toLowerCase())
    ) {
      await supabase
        .from("campaign_leads")
        .update({ status: lead.status === "replied" ? "replied" : "stopped", next_step_due_at: null })
        .eq("id", member.id);
      skipped++;
      continue;
    }

    if (!settings?.sender_email || !settings.company_legal_name || !settings.company_address) {
      skipped++;
      continue;
    }

    const budget = budgetByUser.get(lead.user_id) ?? 0;
    if (budget <= 0) {
      skipped++;
      continue; // se reintenta en la próxima ejecución/día
    }

    const steps = await getSteps(member.campaign_id);
    const nextStep = steps.find((s) => s.step_order === member.current_step + 1);
    if (!nextStep?.template_id) {
      await supabase
        .from("campaign_leads")
        .update({ status: "completed", next_step_due_at: null })
        .eq("id", member.id);
      completedCount++;
      continue;
    }
    const template = await getTemplate(nextStep.template_id);
    if (!template) {
      skipped++;
      continue;
    }

    const result = await sendStepEmail({
      supabase,
      lead,
      template,
      settings,
      campaignId: member.campaign_id,
      stepOrder: nextStep.step_order,
    });
    if (!result.ok) {
      failed++;
      continue;
    }
    budgetByUser.set(lead.user_id, budget - 1);
    sent++;

    const following = steps.find((s) => s.step_order === nextStep.step_order + 1);
    if (following) {
      await supabase
        .from("campaign_leads")
        .update({
          current_step: nextStep.step_order,
          next_step_due_at: new Date(Date.now() + following.delay_days * 86400000).toISOString(),
        })
        .eq("id", member.id);
    } else {
      await supabase
        .from("campaign_leads")
        .update({ current_step: nextStep.step_order, status: "completed", next_step_due_at: null })
        .eq("id", member.id);
      completedCount++;
    }
  }

  return NextResponse.json({ processed: due.length, sent, skipped, completed: completedCount, failed });
}
