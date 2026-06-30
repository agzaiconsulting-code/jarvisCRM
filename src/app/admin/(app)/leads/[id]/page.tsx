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
  const [emailEdit, setEmailEdit] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved, setEmailSaved] = useState(true);

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
        setEmailEdit((data as Lead | null)?.email ?? "");
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

  async function saveEmail() {
    if (!lead) return;
    setEmailSaving(true);
    const supabase = createClient();
    const email = emailEdit.trim() || null;
    await supabase
      .from("leads")
      .update({
        email,
        email_source: email ? "manual" : null,
        enrichment_status: email ? "done" : "no_email",
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);
    setLead({ ...lead, email, email_source: email ? "manual" : null });
    setEmailSaving(false);
    setEmailSaved(true);
  }

  async function deleteLead() {
    if (!lead) return;
    if (!confirm(`¿Eliminar "${lead.name}" del CRM? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("leads").delete().eq("id", lead.id);
    router.push("/admin/leads");
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
          action={<Btn variant="ghost" sm onClick={() => router.push("/admin/leads")}>← Volver al pipeline</Btn>}
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
            <Btn variant="ghost" sm onClick={() => router.push("/admin/leads")}>
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
              <dd>
                {lead.phone ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    {lead.phone}
                    {/^(\+34|0034)?[67]/.test(lead.phone.replace(/\s/g, "")) && (
                      <a
                        href={`https://wa.me/34${lead.phone.replace(/\D/g, "").replace(/^(34|0034)/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir WhatsApp"
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#25d366", color: "#fff", borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 600, textDecoration: "none", lineHeight: 1.4 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.532 5.853L.057 23.55a.5.5 0 0 0 .614.612l5.757-1.504A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.373l-.36-.214-3.717.972.99-3.618-.235-.372A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                        WhatsApp
                      </a>
                    )}
                  </span>
                ) : "—"}
              </dd>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="email"
                      value={emailEdit}
                      onChange={(e) => { setEmailEdit(e.target.value); setEmailSaved(false); }}
                      placeholder="email@ejemplo.com"
                      style={{ flex: 1, background: "#fff", border: "1px solid var(--crm-line)", borderRadius: 6, color: "var(--crm-ink)", fontFamily: "var(--font-hanken)", fontSize: 13, padding: "5px 9px", outline: "none" }}
                      onKeyDown={(e) => e.key === "Enter" && saveEmail()}
                    />
                    <Btn variant="blue" sm onClick={saveEmail} disabled={emailSaving || emailSaved}>
                      {emailSaving ? "…" : emailSaved ? "✓" : "Guardar"}
                    </Btn>
                  </div>
                  {lead.email && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Chip color={lead.email_source === "manual" ? "blue" : "dim"}>
                        {lead.email_source ?? "—"}
                      </Chip>
                      {(lead.unsubscribed || lead.bounced) && (
                        <>
                          {lead.unsubscribed ? <Chip color="danger">baja</Chip> : null}
                          {lead.bounced ? <Chip color="danger">rebotado</Chip> : null}
                        </>
                      )}
                    </div>
                  )}
                </div>
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
