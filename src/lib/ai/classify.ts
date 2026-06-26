import Anthropic from "@anthropic-ai/sdk";
import type { ReplyClassification } from "@/lib/types";

const MODEL = "claude-sonnet-4-6";

const VALID: ReplyClassification[] = [
  "interested",
  "not_interested",
  "auto_reply",
  "unsubscribe",
  "question",
  "other",
];

/* Clasificación de respuestas (PRD §6.5.4). */
export async function classifyReply({
  leadName,
  subject,
  body,
}: {
  leadName: string;
  subject: string | null;
  body: string;
}): Promise<{ classification: ReplyClassification; summary: string } | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const anthropic = new Anthropic();
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: `Eres el clasificador de respuestas de un CRM de prospección B2B en frío. Analiza la respuesta de un negocio a un email comercial y devuelve SOLO un JSON válido con esta forma exacta:
{"classification": "<una de: interested|not_interested|auto_reply|unsubscribe|question|other>", "summary": "<resumen en español, máx 2 frases>"}
Criterios: "unsubscribe" si pide no recibir más emails; "auto_reply" si es respuesta automática (vacaciones, fuera de oficina); "interested" si muestra interés o pide más información con intención de compra; "question" si pregunta algo sin mostrar interés claro; "not_interested" si rechaza.`,
      messages: [
        {
          role: "user",
          content: `Negocio: ${leadName}\nAsunto: ${subject ?? "(sin asunto)"}\n\nRespuesta:\n${body.slice(0, 4000)}`,
        },
      ],
    });
    const text = res.content[0]?.type === "text" ? res.content[0].text : "";
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as {
      classification?: string;
      summary?: string;
    };
    const classification = VALID.includes(json.classification as ReplyClassification)
      ? (json.classification as ReplyClassification)
      : "other";
    return { classification, summary: json.summary ?? "" };
  } catch {
    return null;
  }
}
