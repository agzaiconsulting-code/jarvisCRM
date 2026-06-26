import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadStatus } from "@/lib/types";

export const STAGE_LABEL: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  opened: "Abierto",
  replied: "Respondido",
  qualified: "Cualificado",
  won: "Ganado",
  lost: "Perdido",
};

export const PIPELINE_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "opened",
  "replied",
  "qualified",
  "won",
  "lost",
];

export async function updateLeadStatus(lead: Lead, status: LeadStatus): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", lead.id);
  await supabase.from("activity_log").insert({
    user_id: lead.user_id,
    lead_id: lead.id,
    type: "status_changed",
    description: `${lead.name}: ${STAGE_LABEL[lead.status]} → ${STAGE_LABEL[status]}`,
    metadata: { from: lead.status, to: status },
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}
