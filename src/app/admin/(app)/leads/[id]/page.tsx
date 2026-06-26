"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HUDPanel, ScreenHead, Btn, Chip, StageChip, Stars, EmptyState, BootLoader } from "@/components/hud";
import { STAGE_LABEL, updateLeadStatus, relativeTime } from "@/lib/leads";
import type { ActivityLogEntry, Campaign, Lead, LeadStatus, ReplyClassification } from "@/lib/types";

interface Reply {
  id: string;
  snippet: string | null;
  body_text: string | null;
  ai_classification: ReplyClassification | null;
  ai_summary: string | null;
  received_at: string | null;
}

const CLASSIFICATION_LABEL: Record<ReplyClassification, string> = {
  interested: "Interesado",
  not_interested: "No interesado",
  auto_reply: "Auto-respuesta",
  unsubscribe: "Baja",
  question: "Pregunta",
  other: "Otro",
};

const LOG_GLYPH: Record<string, { glyph: string; color: string }> = {
  scraped: { glyph: "◎", color: "var(--blue)" },
  enriched: { glyph: "◈", color: "var(--blue)" },
  email_sent: { glyph: "▸", color: "var(--blue)" },
  opened: { glyph: "◉", color: "var(--dim)" },
  replied: { glyph: "◆", color: "var(--gold)" },
  status_changed: { glyph: "✦", color: "var(--gold)" },
  note: { glyph: "✎", color: "var(--dim)" },
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null | undefined>(undefined);
  const [log, setLog] = useState<ActivityLogEntry[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedCampaign, setPickedCampaign] = useState("");
  const [addingCampaign, setAddingCampaign] = useState(false);
  const [campaignMsg, setCampaignMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("leads")
      .select()
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setLead((data as Lead) ?? null);
        setNotes((data as Lead | null)?.notes ?? "");
      });
    supabase
      .from("activity_log")
      .select()
      .eq("lead_id", id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setLog((data as ActivityLogEntry[]) ?? []));
    supabase
      .from("replies")
      .select("id, snippet, body_text, ai_classification, ai_summary, received_at")
      .eq("lead_id", id)
      .order("received_at", { ascending: false })
      .then(({ data }) => setReplies((data as Reply[]) ?? []));
    supabase
      .from("campaigns")
      .select()
      .in("status", ["draft", "active"])
      .order("created_at", { ascending: false })
      .then(({ data }) => setCampaigns((data as Campaign[]) ?? []));
  }, [id]);

  async function setStatus(status: LeadStatus) {
    if (!lead) return;
    await updateLeadStatus(lead, status);
    setLead({ ...lead, status });
    setLog((l) => [
      {
        id: crypto.randomUUID(),
        user_id: lead.user_id,
        lead_id: lead.id,
        type: "status_changed",
        description: `${lead.name}: ${STAGE_LABEL[lead.status]} → ${STAGE_LABEL[status]}`,
        metadata: null,
        created_at: new Date().toISOString(),
      },
      ...l,
    ]);
  }

  async function generateAnalysis() {
    if (!lead) return;
    setAnalyzing(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAiError(json.error ?? "Error generando el análisis");
        return;
      }
      setLead({ ...lead, ai_summary: json.summary });
    } catch {
      setAiError("Error de red generando el análisis");
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveNotes() {
    if (!lead) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("leads")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", lead.id);
    setSaving(false);
    setNotesSaved(true);
  }

  async function addToCampaign() {
    if (!lead || !pickedCampaign) return;
    setAddingCampaign(true);
    setCampaignMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("campaign_leads")
      .insert({ campaign_id: pickedCampaign, lead_id: lead.id, status: "pending" });
    if (error) {
      setCampaignMsg({ ok: false, text: error.code === "23505" ? "Ya está en esa campaña" : "Error al añadir" });
    } else {
      const campaign = campaigns.find((c) => c.id === pickedCampaign);
      setCampaignMsg({ ok: true, text: `Añadido a «${campaign?.name ?? "campaña"}»` });
      setPickerOpen(false);
      setPickedCampaign("");
    }
    setAddingCampaign(false);
  }

  async function deleteLead() {
    if (!lead) return;
    if (!confirm(`¿Eliminar "${lead.name}" del CRM? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("leads").delete().eq("id", lead.id);
    router.push("/leads");
  }

  if (lead === undefined) {
    return (
      <HUDPanel>
        <BootLoader label="Cargando ficha" />
      </HUDPanel>
    );
  }

  if (lead === null) {
    return (
      <HUDPanel>
        <EmptyState
          title="Lead no encontrado"
          sub="El registro no existe o fue eliminado."
          action={<Btn variant="ghost" sm onClick={() => router.push("/leads")}>← Volver al pipeline</Btn>}
        />
      </HUDPanel>
    );
  }

  return (
    <div>
      <ScreenHead
        title={lead.name}
        sub={`FICHA DE LEAD · ID ${lead.id.slice(0, 8).toUpperCase()}`}
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <StageChip stage={lead.status} />
            <Btn variant="ghost" sm onClick={() => router.push("/leads")}>
              ← Pipeline
            </Btn>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <HUDPanel title="Ficha del negocio" delay={0}>
            <dl className="dl">
              <dt>Categoría</dt>
              <dd>{lead.category ?? "—"}</dd>
              <dt>Dirección</dt>
              <dd>{lead.address ?? "—"}</dd>
              <dt>Teléfono</dt>
              <dd>{lead.phone ?? "—"}</dd>
              <dt>Web</dt>
              <dd>
                {lead.website ? (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>
                    {lead.website}
                  </a>
                ) : (
                  "Sin web"
                )}
              </dd>
              <dt>Email</dt>
              <dd>
                {lead.email ? (
                  <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                    {lead.email}
                    <Chip color="dim">{lead.email_source ?? "—"}</Chip>
                  </span>
                ) : (
                  <Chip color="danger">sin email</Chip>
                )}
              </dd>
              <dt>Rating</dt>
              <dd>
                {lead.rating != null ? (
                  <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                    <Stars rating={lead.rating} />
                    <span style={{ color: "var(--dim)" }}>({lead.reviews_count ?? 0} reseñas)</span>
                  </span>
                ) : (
                  "—"
                )}
              </dd>
              <dt>Capturado</dt>
              <dd style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{relativeTime(lead.created_at)}</dd>
            </dl>
            {(lead.unsubscribed || lead.bounced) && (
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                {lead.unsubscribed ? <Chip color="danger">Baja (no contactar)</Chip> : null}
                {lead.bounced ? <Chip color="danger">Email rebotado</Chip> : null}
              </div>
            )}
          </HUDPanel>

          <HUDPanel
            title="Análisis Jarvis"
            gold
            delay={80}
            right={<Chip color="gold">IA</Chip>}
            style={{ borderColor: "rgba(245,196,81,0.3)", background: "rgba(36,28,10,0.3)" }}
          >
            {lead.ai_summary ? (
              <p style={{ fontSize: 13.5, lineHeight: 1.65 }}>{lead.ai_summary}</p>
            ) : (
              <p style={{ fontSize: 12.5, color: "var(--dim)" }}>
                Sin análisis todavía. Pulsa «Generar análisis» para que Jarvis resuma el negocio y recomiende el siguiente paso.
              </p>
            )}
            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Btn variant="gold" sm onClick={generateAnalysis} disabled={analyzing}>
                {analyzing ? "✦ Analizando…" : lead.ai_summary ? "✦ Regenerar análisis" : "✦ Generar análisis"}
              </Btn>
              {aiError ? (
                <span style={{ fontSize: 11.5, color: "var(--danger)", fontFamily: "var(--font-mono)" }}>
                  {aiError}
                </span>
              ) : null}
            </div>
          </HUDPanel>

          <HUDPanel title="Notas" delay={160}>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesSaved(false);
              }}
              placeholder="Apuntes internos sobre este lead…"
              style={{ width: "100%" }}
            />
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <Btn variant="blue" sm onClick={saveNotes} disabled={saving || notesSaved}>
                {saving ? "Guardando…" : notesSaved ? "Guardado" : "Guardar notas"}
              </Btn>
            </div>
          </HUDPanel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <HUDPanel title="Acciones" delay={40}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {lead.email && !lead.unsubscribed && !lead.bounced ? (
                <Btn variant="gold" sm onClick={() => { setPickerOpen((v) => !v); setCampaignMsg(null); }}>
                  {pickerOpen ? "✕ Cancelar" : "+ Añadir a campaña"}
                </Btn>
              ) : (
                <Btn variant="gold" sm disabled title={!lead.email ? "Sin email" : "Lead dado de baja"}>
                  + Añadir a campaña
                </Btn>
              )}
              {lead.status !== "qualified" && lead.status !== "won" && lead.status !== "lost" && (
                <Btn variant="blue" sm onClick={() => setStatus("qualified")}>
                  Marcar cualificado
                </Btn>
              )}
              {lead.status !== "won" && (
                <Btn variant="blue" sm onClick={() => setStatus("won")}>
                  ✓ Ganado
                </Btn>
              )}
              {lead.status !== "lost" && (
                <Btn variant="danger" sm onClick={() => setStatus("lost")}>
                  ✗ Perdido
                </Btn>
              )}
              <Btn variant="danger" sm onClick={deleteLead} disabled={deleting} style={{ marginLeft: "auto" }}>
                {deleting ? "Eliminando…" : "Eliminar lead"}
              </Btn>
            </div>
            {pickerOpen && (
              <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {campaigns.length === 0 ? (
                  <span style={{ fontSize: 12, color: "var(--dim)" }}>No hay campañas activas o en borrador.</span>
                ) : (
                  <>
                    <select
                      className="hud-select"
                      value={pickedCampaign}
                      onChange={(e) => setPickedCampaign(e.target.value)}
                    >
                      <option value="">Seleccionar campaña…</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <Btn variant="gold" sm onClick={addToCampaign} disabled={!pickedCampaign || addingCampaign}>
                      {addingCampaign ? "Añadiendo…" : "Añadir"}
                    </Btn>
                  </>
                )}
                {campaignMsg && (
                  <span style={{ fontSize: 12, color: campaignMsg.ok ? "var(--success)" : "var(--danger)", fontFamily: "var(--font-mono)" }}>
                    {campaignMsg.text}
                  </span>
                )}
              </div>
            )}
          </HUDPanel>

          {replies.length > 0 ? (
            <HUDPanel title="Conversación" gold delay={100}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {replies.map((r) => (
                  <article
                    key={r.id}
                    style={{
                      border: "1px solid rgba(245,196,81,0.3)",
                      background: "rgba(36,28,10,0.25)",
                      borderRadius: 3,
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                      <Chip color="gold">
                        {r.ai_classification ? CLASSIFICATION_LABEL[r.ai_classification] : "Sin clasificar"}
                      </Chip>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--dim)" }}>
                        {r.received_at ? relativeTime(r.received_at) : ""}
                      </span>
                    </div>
                    {r.ai_summary ? (
                      <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "var(--gold)" }}>✦ {r.ai_summary}</p>
                    ) : null}
                    <p style={{ margin: 0, fontSize: 12.5, color: "var(--dim)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {(r.body_text || r.snippet || "").slice(0, 600)}
                    </p>
                  </article>
                ))}
              </div>
            </HUDPanel>
          ) : null}

          <HUDPanel title="Actividad" delay={120}>
            {log.length === 0 ? (
              <EmptyState title="Sin actividad" sub="Aquí aparecerá el historial de eventos del lead." />
            ) : (
              <div className="log">
                {log.map((e) => {
                  const ic = LOG_GLYPH[e.type] ?? LOG_GLYPH.note;
                  return (
                    <div className="log-row" key={e.id}>
                      <span className="log-time">{relativeTime(e.created_at)}</span>
                      <span className="log-ico" style={{ color: ic.color }}>
                        {ic.glyph}
                      </span>
                      <span className="log-msg">{e.description ?? e.type}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </HUDPanel>
        </div>
      </div>
    </div>
  );
}
