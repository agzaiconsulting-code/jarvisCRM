import type { CampaignStatus } from "@/lib/types";

export const CAMPAIGN_STATUS_CHIP: Record<CampaignStatus, { label: string; cls: "ok" | "gold" | "blue" | "dim" }> = {
  draft: { label: "Borrador", cls: "dim" },
  active: { label: "Activa", cls: "ok" },
  paused: { label: "Pausada", cls: "gold" },
  completed: { label: "Completada", cls: "blue" },
};

export const TEMPLATE_VARS = ["{{name}}", "{{category}}", "{{zone}}", "{{sender}}"] as const;

/** Convierte el cuerpo en texto plano a un HTML simple (párrafos). */
export function textToHtml(text: string): string {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}
