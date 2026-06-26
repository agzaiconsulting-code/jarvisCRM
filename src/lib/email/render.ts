import type { Lead, Settings, Template } from "@/lib/types";

/* Render de plantillas + pie legal + tracking (PRD §6.4 y §9) */

export function renderVars(text: string, lead: Lead, settings: Settings): string {
  const vars: Record<string, string> = {
    name: lead.name,
    category: lead.category ?? "",
    zone: lead.address ?? "",
    sender: settings.sender_name ?? "",
  };
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function renderSubject(template: Template, lead: Lead, settings: Settings): string {
  return renderVars(template.subject, lead, settings);
}

/** Reescribe los enlaces del cuerpo para tracking de clics. */
function rewriteLinks(html: string, baseUrl: string, sendId: string): string {
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (_, url: string) => {
    return `href="${baseUrl}/api/track/click/${sendId}?url=${encodeURIComponent(url)}"`;
  });
}

export function renderHtmlBody({
  template,
  lead,
  settings,
  baseUrl,
  sendId,
  unsubscribeToken,
}: {
  template: Template;
  lead: Lead;
  settings: Settings;
  baseUrl: string;
  sendId: string;
  unsubscribeToken: string;
}): { html: string; text: string } {
  const bodyHtml = rewriteLinks(renderVars(template.body_html, lead, settings), baseUrl, sendId);
  const bodyText = renderVars(template.body_text ?? template.body_html.replace(/<[^>]+>/g, ""), lead, settings);

  const unsubBase = settings.unsubscribe_base_url?.replace(/\/$/, "") || `${baseUrl}/unsubscribe`;
  const unsubUrl = `${unsubBase}/${unsubscribeToken}`;
  const pixelUrl = `${baseUrl}/api/track/open/${sendId}`;

  const footerHtml = `
<hr style="border:none;border-top:1px solid #ddd;margin:28px 0 12px"/>
<p style="font-size:11px;color:#888;line-height:1.6">
  ${settings.company_legal_name ?? ""}${settings.company_address ? ` · ${settings.company_address}` : ""}<br/>
  Si no quieres recibir más emails, <a href="${unsubUrl}" style="color:#888">date de baja aquí</a>.
</p>
<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block"/>`;

  const footerText = `\n\n--\n${settings.company_legal_name ?? ""}${settings.company_address ? ` · ${settings.company_address}` : ""}\nDarse de baja: ${unsubUrl}`;

  return { html: bodyHtml + footerHtml, text: bodyText + footerText };
}
