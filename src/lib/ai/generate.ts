import Anthropic from "@anthropic-ai/sdk";
import type { Lead } from "@/lib/types";

const MODEL = "claude-sonnet-4-6";

/* Capa IA Jarvis (PRD §6.7): redacción de emails y resumen de lead. */

export async function draftEmail({
  goal,
  category,
  zone,
  senderName,
  lead,
}: {
  goal: string;
  category?: string | null;
  zone?: string | null;
  senderName?: string | null;
  lead?: Lead | null;
}): Promise<{ subject: string; body: string } | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const context = lead
    ? `Lead concreto:\n- Negocio: ${lead.name}\n- Categoría: ${lead.category ?? "—"}\n- Dirección: ${lead.address ?? "—"}\n- Web: ${lead.website ?? "sin web"}\n- Rating: ${lead.rating ?? "—"} (${lead.reviews_count ?? 0} reseñas)`
    : `Plantilla genérica para una campaña.\n- Sector objetivo: ${category ?? "negocios locales"}\n- Zona: ${zone ?? "—"}\nUsa las variables {{name}}, {{category}}, {{zone}} y {{sender}} donde toque (se sustituyen al enviar).`;

  try {
    const anthropic = new Anthropic();
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: `Eres Jarvis, asistente de un consultor que vende servicios digitales (webs, automatización, IA) a pequeños negocios en España. Redactas emails de prospección en frío en español: cercanos, concretos, sin humo comercial, máximo ~120 palabras de cuerpo, con una sola llamada a la acción suave. Sin asuntos clickbait. Firma con ${senderName ?? "{{sender}}"}.
Devuelve SOLO un JSON válido: {"subject": "...", "body": "..."} (body en texto plano con saltos de línea \\n).`,
      messages: [{ role: "user", content: `Objetivo del email: ${goal}\n\n${context}` }],
    });
    const text = res.content[0]?.type === "text" ? res.content[0].text : "";
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as { subject?: string; body?: string };
    if (!json.subject || !json.body) return null;
    return { subject: json.subject, body: json.body };
  } catch {
    return null;
  }
}

export async function summarizeLead({
  lead,
  activity,
  replies,
}: {
  lead: Lead;
  activity: Array<{ type: string; description: string | null; created_at: string }>;
  replies: Array<{ ai_classification: string | null; snippet: string | null }>;
}): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const history = activity
    .slice(0, 20)
    .map((a) => `- [${a.created_at.slice(0, 10)}] ${a.type}: ${a.description ?? ""}`)
    .join("\n");
  const replyLines = replies
    .slice(0, 5)
    .map((r) => `- (${r.ai_classification ?? "sin clasificar"}) ${r.snippet ?? ""}`)
    .join("\n");

  try {
    const anthropic = new Anthropic();
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: `Eres Jarvis, analista de un CRM de prospección B2B. Resume el lead y recomienda el siguiente paso comercial. Español, máximo 3 frases: 1) qué es el negocio y su situación digital, 2) estado de la relación, 3) recomendación concreta. Texto plano, sin markdown.`,
      messages: [
        {
          role: "user",
          content: `Negocio: ${lead.name}
Categoría: ${lead.category ?? "—"} · Zona: ${lead.address ?? "—"}
Web: ${lead.website ?? "SIN WEB"} · Email: ${lead.email ?? "sin email"} · Rating: ${lead.rating ?? "—"} (${lead.reviews_count ?? 0} reseñas)
Fase del pipeline: ${lead.status}
Notas del usuario: ${lead.notes ?? "—"}

Historial:
${history || "(sin actividad)"}

Respuestas recibidas:
${replyLines || "(ninguna)"}`,
        },
      ],
    });
    const text = res.content[0]?.type === "text" ? res.content[0].text.trim() : "";
    return text || null;
  } catch {
    return null;
  }
}
