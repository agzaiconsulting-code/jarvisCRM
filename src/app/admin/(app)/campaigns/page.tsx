"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HUDPanel, ScreenHead, Btn, Chip, Field, EmptyState, BootLoader } from "@/components/hud";
import { CAMPAIGN_STATUS_CHIP, TEMPLATE_VARS, textToHtml } from "@/lib/campaigns";
import { STAGE_LABEL } from "@/lib/leads";
import type { Campaign, CampaignLead, CampaignStep, Lead, Template } from "@/lib/types";

export default function CampaignsPage() {
  const [loaded, setLoaded] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [suppressed, setSuppressed] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [steps, setSteps] = useState<CampaignStep[]>([]);
  const [members, setMembers] = useState<CampaignLead[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchMsg, setLaunchMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function loadAll() {
    const supabase = createClient();
    const [c, t, l, s] = await Promise.all([
      supabase.from("campaigns").select().order("created_at", { ascending: false }),
      supabase.from("templates").select().order("created_at"),
      supabase.from("leads").select().order("name"),
      supabase.from("suppression_list").select("email"),
    ]);
    setCampaigns((c.data as Campaign[]) ?? []);
    setTemplates((t.data as Template[]) ?? []);
    setLeads((l.data as Lead[]) ?? []);
    setSuppressed(new Set(((s.data as { email: string }[]) ?? []).map((r) => r.email.toLowerCase())));
    setLoaded(true);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSteps([]);
      setMembers([]);
      return;
    }
    const supabase = createClient();
    supabase
      .from("campaign_steps")
      .select()
      .eq("campaign_id", selectedId)
      .order("step_order")
      .then(({ data }) => setSteps((data as CampaignStep[]) ?? []));
    supabase
      .from("campaign_leads")
      .select()
      .eq("campaign_id", selectedId)
      .then(({ data }) => setMembers((data as CampaignLead[]) ?? []));
  }, [selectedId]);

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;

  async function launchCampaign() {
    if (!selected) return;
    setLaunching(true);
    setLaunchMsg(null);
    try {
      const res = await fetch(`/api/campaigns/${selected.id}/launch`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setLaunchMsg({ ok: false, text: data.error ?? "Error en el lanzamiento" });
      } else {
        setLaunchMsg({
          ok: true,
          text: `Lanzada · ${data.sent} enviados${data.skipped ? ` · ${data.skipped} excluidos` : ""}${
            data.failed ? ` · ${data.failed} fallidos` : ""
          }${data.pending ? ` · ${data.pending} pendientes (límite diario)` : ""}`,
        });
        setCampaigns((cs) => cs.map((c) => (c.id === selected.id ? { ...c, status: "active" } : c)));
        const supabase = createClient();
        const { data: m } = await supabase.from("campaign_leads").select().eq("campaign_id", selected.id);
        setMembers((m as CampaignLead[]) ?? []);
      }
    } catch {
      setLaunchMsg({ ok: false, text: "Error de red en el lanzamiento" });
    }
    setLaunching(false);
  }

  async function createCampaign() {
    const name = newName.trim();
    if (!name) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("campaigns")
      .insert({ user_id: user.id, name, status: "draft" })
      .select()
      .single();
    if (data) {
      setCampaigns((cs) => [data as Campaign, ...cs]);
      setSelectedId((data as Campaign).id);
      setNewName("");
      setCreating(false);
    }
  }

  if (!loaded) {
    return (
      <div>
        <ScreenHead title="Campañas" sub="SECUENCIAS DE PROSPECCIÓN · ENVÍO AUTOMÁTICO" />
        <HUDPanel>
          <BootLoader label="Cargando campañas" />
        </HUDPanel>
      </div>
    );
  }

  return (
    <div>
      <ScreenHead
        title="Campañas"
        sub="SECUENCIAS DE PROSPECCIÓN · ENVÍO AUTOMÁTICO"
        right={
          creating ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                placeholder="Nombre de la campaña…"
                value={newName}
                autoFocus
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createCampaign()}
                style={{ width: 240 }}
              />
              <Btn variant="gold" sm onClick={createCampaign} disabled={!newName.trim()}>
                Crear
              </Btn>
              <Btn variant="ghost" sm onClick={() => setCreating(false)}>
                ✕
              </Btn>
            </div>
          ) : (
            <Btn variant="gold" sm onClick={() => setCreating(true)}>
              + Nueva campaña
            </Btn>
          )
        }
      />

      {campaigns.length === 0 ? (
        <HUDPanel style={{ marginBottom: 20 }}>
          <EmptyState
            title="Sin campañas"
            sub="Crea tu primera campaña para definir una secuencia de emails con recordatorios automáticos."
          />
        </HUDPanel>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          {campaigns.map((c, i) => {
            const st = CAMPAIGN_STATUS_CHIP[c.status];
            const sel = c.id === selectedId;
            return (
              <HUDPanel
                key={c.id}
                delay={i * 60}
                hoverable
                style={{
                  cursor: "pointer",
                  borderColor: sel ? "var(--border)" : undefined,
                  boxShadow: sel ? "0 0 calc(22px * var(--glow)) rgba(14,165,233,0.2)" : undefined,
                }}
              >
                <div onClick={() => setSelectedId(sel ? null : c.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, letterSpacing: ".04em" }}>
                      {c.name}
                    </div>
                    <Chip color={st.cls}>{st.label}</Chip>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dim)" }}>
                    {new Date(c.created_at).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </HUDPanel>
            );
          })}
        </div>
      )}

      {selected ? (
        <>
          <SequenceEditor
            campaign={selected}
            steps={steps}
            setSteps={setSteps}
            templates={templates}
            membersCount={members.filter((m) => m.status === "pending").length}
            launching={launching}
            launchMsg={launchMsg}
            onLaunch={launchCampaign}
          />
          <div style={{ height: 16 }} />
          <CampaignLeadsPanel
            campaign={selected}
            members={members}
            setMembers={setMembers}
            leads={leads}
            suppressed={suppressed}
          />
          <div style={{ height: 16 }} />
        </>
      ) : null}

      <TemplatesPanel templates={templates} setTemplates={setTemplates} />
    </div>
  );
}

/* ── Editor de secuencia ── */
function SequenceEditor({
  campaign,
  steps,
  setSteps,
  templates,
  membersCount,
  launching,
  launchMsg,
  onLaunch,
}: {
  campaign: Campaign;
  steps: CampaignStep[];
  setSteps: (s: CampaignStep[]) => void;
  templates: Template[];
  membersCount: number;
  launching: boolean;
  launchMsg: { ok: boolean; text: string } | null;
  onLaunch: () => void;
}) {
  const canLaunch =
    campaign.status === "draft" && steps.length > 0 && !!steps[0].template_id && membersCount > 0 && !launching;
  async function addStep() {
    const supabase = createClient();
    const order = steps.length;
    const { data } = await supabase
      .from("campaign_steps")
      .insert({
        campaign_id: campaign.id,
        step_order: order,
        delay_days: order === 0 ? 0 : 3,
        template_id: templates[0]?.id ?? null,
      })
      .select()
      .single();
    if (data) setSteps([...steps, data as CampaignStep]);
  }

  async function updateStep(id: string, patch: Partial<CampaignStep>) {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const supabase = createClient();
    await supabase.from("campaign_steps").update(patch).eq("id", id);
  }

  async function removeLastStep() {
    const last = steps[steps.length - 1];
    if (!last) return;
    const supabase = createClient();
    await supabase.from("campaign_steps").delete().eq("id", last.id);
    setSteps(steps.slice(0, -1));
  }

  return (
    <HUDPanel
      title={`Secuencia · ${campaign.name}`}
      delay={0}
      right={
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dim)" }}>{steps.length} PASOS</span>
          {steps.length > 0 ? (
            <Btn variant="ghost" sm onClick={removeLastStep}>
              − Quitar último
            </Btn>
          ) : null}
          {launchMsg ? <Chip color={launchMsg.ok ? "ok" : "danger"}>{launchMsg.text}</Chip> : null}
          <Btn
            variant="gold"
            sm
            onClick={onLaunch}
            disabled={!canLaunch}
            title={
              campaign.status !== "draft"
                ? "La campaña ya fue lanzada"
                : "Requiere paso 0 con plantilla y destinatarios pendientes"
            }
          >
            {launching ? "Lanzando…" : "▸ Lanzar campaña"}
          </Btn>
        </div>
      }
    >
      {steps.length === 0 ? (
        <EmptyState
          title="Secuencia vacía"
          sub="Añade el paso inicial (paso 0) y los recordatorios. Cada recordatorio se envía N días después del paso anterior si el lead no ha respondido."
          action={
            <Btn variant="blue" sm onClick={addStep}>
              + Añadir paso inicial
            </Btn>
          }
        />
      ) : (
        <div className="seq">
          {steps.map((s, i) => (
            <div key={s.id} style={{ display: "contents" }}>
              {i > 0 ? (
                <div className="seq-link">
                  <div className="seq-line" />
                  <span className="seq-wait">
                    espera{" "}
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={s.delay_days}
                      onChange={(e) => updateStep(s.id, { delay_days: parseInt(e.target.value) || 1 })}
                      style={{ width: 44, textAlign: "center", padding: "2px 4px" }}
                    />{" "}
                    días
                  </span>
                </div>
              ) : null}
              <div className="seq-step">
                <HUDPanel hoverable style={{ padding: "14px 16px", height: "100%" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: ".18em",
                      color: i === 0 ? "var(--gold)" : "var(--blue)",
                    }}
                  >
                    {i === 0 ? "PASO 0 · INICIAL" : `PASO ${i} · RECORDATORIO`}
                  </span>
                  <div className="field" style={{ marginTop: 8 }}>
                    <select
                      value={s.template_id ?? ""}
                      onChange={(e) => updateStep(s.id, { template_id: e.target.value || null })}
                    >
                      <option value="">— sin plantilla —</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </HUDPanel>
              </div>
            </div>
          ))}
          <div className="seq-link" style={{ width: 60 }}>
            <div className="seq-line" style={{ opacity: 0.4 }} />
          </div>
          <div className="seq-step" style={{ width: 150 }}>
            <button
              className="btn btn-ghost"
              onClick={addStep}
              style={{ width: "100%", height: "100%", border: "1px dashed var(--border-soft)", minHeight: 96 }}
            >
              + Añadir paso
            </button>
          </div>
        </div>
      )}
    </HUDPanel>
  );
}

/* ── Leads de la campaña ── */
function CampaignLeadsPanel({
  campaign,
  members,
  setMembers,
  leads,
  suppressed,
}: {
  campaign: Campaign;
  members: CampaignLead[];
  setMembers: (m: CampaignLead[]) => void;
  leads: Lead[];
  suppressed: Set<string>;
}) {
  const [picking, setPicking] = useState(false);
  const [category, setCategory] = useState("all");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const memberIds = useMemo(() => new Set(members.map((m) => m.lead_id)), [members]);
  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);

  // elegibles (PRD §6.3): con email, sin baja, sin rebote, no en supresión, no ya en la campaña
  const eligible = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.email &&
          !l.unsubscribed &&
          !l.bounced &&
          !suppressed.has(l.email.toLowerCase()) &&
          !memberIds.has(l.id) &&
          (category === "all" || l.category === category)
      ),
    [leads, suppressed, memberIds, category]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) if (l.category) set.add(l.category);
    return [...set].sort();
  }, [leads]);

  async function addSelected() {
    if (checked.size === 0) return;
    const supabase = createClient();
    const rows = [...checked].map((lead_id) => ({ campaign_id: campaign.id, lead_id, status: "pending" }));
    const { data } = await supabase.from("campaign_leads").insert(rows).select();
    if (data) setMembers([...members, ...(data as CampaignLead[])]);
    setChecked(new Set());
    setPicking(false);
  }

  async function removeMember(id: string) {
    const supabase = createClient();
    await supabase.from("campaign_leads").delete().eq("id", id);
    setMembers(members.filter((m) => m.id !== id));
  }

  return (
    <HUDPanel
      title={`Destinatarios · ${members.length} leads`}
      delay={0}
      right={
        <Btn variant="blue" sm onClick={() => setPicking(!picking)}>
          {picking ? "✕ Cerrar selector" : "+ Añadir leads"}
        </Btn>
      }
    >
      {picking ? (
        <div style={{ marginBottom: 16, border: "1px solid var(--border-soft)", borderRadius: 3, padding: 14 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
            <span className="field-label">Categoría</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 220 }}>
              <option value="all">Todas</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dim)" }}>
              {eligible.length} elegibles (con email, sin bajas ni rebotes)
            </span>
            <span style={{ flex: 1 }} />
            <Btn
              variant="ghost"
              sm
              onClick={() => setChecked(new Set(eligible.map((l) => l.id)))}
              disabled={eligible.length === 0}
            >
              Seleccionar todos
            </Btn>
            <Btn variant="gold" sm onClick={addSelected} disabled={checked.size === 0}>
              Añadir {checked.size > 0 ? `(${checked.size})` : ""}
            </Btn>
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {eligible.length === 0 ? (
              <p style={{ color: "var(--dim)", fontSize: 12.5 }}>No hay leads elegibles con los filtros actuales.</p>
            ) : (
              <table className="hud-table">
                <tbody>
                  {eligible.map((l) => (
                    <tr
                      key={l.id}
                      onClick={() =>
                        setChecked((prev) => {
                          const next = new Set(prev);
                          if (next.has(l.id)) next.delete(l.id);
                          else next.add(l.id);
                          return next;
                        })
                      }
                    >
                      <td style={{ width: 30 }}>
                        <input type="checkbox" checked={checked.has(l.id)} readOnly />
                      </td>
                      <td>{l.name}</td>
                      <td>{l.category ?? "—"}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{l.email}</td>
                      <td>
                        <Chip color="dim">{STAGE_LABEL[l.status]}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}

      {members.length === 0 ? (
        <EmptyState title="Sin destinatarios" sub="Añade leads elegibles a esta campaña con el selector." />
      ) : (
        <table className="hud-table">
          <thead>
            <tr>
              <th>Negocio</th>
              <th>Email</th>
              <th>Paso actual</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const l = leadById.get(m.lead_id);
              return (
                <tr key={m.id} style={{ cursor: "default" }}>
                  <td>{l?.name ?? m.lead_id.slice(0, 8)}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{l?.email ?? "—"}</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{m.current_step}</td>
                  <td>
                    <Chip color={m.status === "replied" ? "gold" : m.status === "completed" ? "blue" : "dim"}>
                      {m.status}
                    </Chip>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {campaign.status === "draft" ? (
                      <Btn variant="ghost" sm onClick={() => removeMember(m.id)}>
                        ✕
                      </Btn>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </HUDPanel>
  );
}

/* ── Panel de plantillas ── */
function TemplatesPanel({
  templates,
  setTemplates,
}: {
  templates: Template[];
  setTemplates: (t: Template[]) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null);
  const tpl = templates.find((t) => t.id === selectedId) ?? null;
  const [name, setName] = useState(tpl?.name ?? "");
  const [subject, setSubject] = useState(tpl?.subject ?? "");
  const [body, setBody] = useState(tpl?.body_text ?? "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goal, setGoal] = useState("");

  useEffect(() => {
    setName(tpl?.name ?? "");
    setSubject(tpl?.subject ?? "");
    setBody(tpl?.body_text ?? "");
    setDirty(false);
    setGoalOpen(false);
    setGoal("");
  }, [tpl?.id, tpl?.name, tpl?.subject, tpl?.body_text]);

  async function createTemplate() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("templates")
      .insert({
        user_id: user.id,
        name: `Plantilla ${templates.length + 1}`,
        subject: "Hola {{name}}",
        body_text: "Hola {{name}},\n\n…\n\nUn saludo,\n{{sender}}",
        body_html: textToHtml("Hola {{name}},\n\n…\n\nUn saludo,\n{{sender}}"),
      })
      .select()
      .single();
    if (data) {
      setTemplates([...templates, data as Template]);
      setSelectedId((data as Template).id);
    }
  }

  async function saveTemplate() {
    if (!tpl) return;
    setSaving(true);
    const supabase = createClient();
    const patch = { name, subject, body_text: body, body_html: textToHtml(body) };
    await supabase.from("templates").update(patch).eq("id", tpl.id);
    setTemplates(templates.map((t) => (t.id === tpl.id ? { ...t, ...patch } : t)));
    setSaving(false);
    setDirty(false);
  }

  async function generateWithJarvis() {
    const g = goal.trim();
    if (!g) { setGoalOpen(true); return; }
    setGenerating(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: g }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAiError(json.error ?? "Error generando el email");
        return;
      }
      setSubject(json.subject);
      setBody(json.body);
      setDirty(true);
      setGoalOpen(false);
    } catch {
      setAiError("Error de red generando el email");
    } finally {
      setGenerating(false);
    }
  }

  async function deleteTemplate() {
    if (!tpl) return;
    const supabase = createClient();
    const { error } = await supabase.from("templates").delete().eq("id", tpl.id);
    if (!error) {
      const rest = templates.filter((t) => t.id !== tpl.id);
      setTemplates(rest);
      setSelectedId(rest[0]?.id ?? null);
    }
  }

  return (
    <HUDPanel
      title="Plantillas"
      delay={80}
      right={
        <Btn variant="blue" sm onClick={createTemplate}>
          + Nueva plantilla
        </Btn>
      }
    >
      {templates.length === 0 ? (
        <EmptyState
          title="Sin plantillas"
          sub="Crea una plantilla con variables {{name}}, {{category}}, {{zone}}, {{sender}} para usarla en los pasos de las campañas."
        />
      ) : (
        <div className="crm-grid-campaign-detail">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {templates.map((t) => {
              const sel = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: 3,
                    background: sel ? "rgba(56,189,248,0.08)" : "rgba(5,8,16,0.4)",
                    border: "1px solid",
                    borderColor: sel ? "var(--border)" : "var(--border-soft)",
                    boxShadow: sel ? "0 0 calc(16px * var(--glow)) rgba(14,165,233,0.18)" : "none",
                    color: "inherit",
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    transition: "border-color .2s, background .2s, box-shadow .2s",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: 13.5,
                      letterSpacing: ".04em",
                      color: sel ? "var(--blue)" : "var(--text)",
                    }}
                  >
                    {t.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".06em", color: "var(--dim)" }}>
                    {t.subject}
                  </span>
                </button>
              );
            })}
          </div>

          {tpl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setDirty(true);
                  }}
                  style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, width: 280 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="gold" sm onClick={() => setGoalOpen((v) => !v)} disabled={generating}>
                    {generating ? "✦ Generando…" : "✦ Generar con Jarvis"}
                  </Btn>
                  <Btn variant="blue" sm onClick={saveTemplate} disabled={saving || !dirty}>
                    {saving ? "Guardando…" : dirty ? "Guardar" : "Guardado"}
                  </Btn>
                  <Btn variant="danger" sm onClick={deleteTemplate}>
                    Eliminar
                  </Btn>
                </div>
              </div>
              {goalOpen && (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && generateWithJarvis()}
                    placeholder="Objetivo (ej.: primer contacto ofreciendo web a negocios sin presencia online)…"
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <Btn variant="gold" sm onClick={generateWithJarvis} disabled={generating || !goal.trim()}>
                    {generating ? "Generando…" : "✦ Generar"}
                  </Btn>
                </div>
              )}
              {aiError ? (
                <p style={{ margin: 0, fontSize: 12, color: "var(--danger)", fontFamily: "var(--font-mono)" }}>
                  {aiError}
                </p>
              ) : null}
              <Field label="Asunto">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setDirty(true);
                  }}
                />
              </Field>
              <Field label="Cuerpo" hint="Texto plano; se convierte a HTML al guardar. Las variables se sustituyen al enviar.">
                <textarea
                  rows={10}
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setDirty(true);
                  }}
                  style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.8 }}
                />
              </Field>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="field-label" style={{ marginRight: 4 }}>
                  Variables
                </span>
                {TEMPLATE_VARS.map((v) => (
                  <span key={v} className="chip-var" style={{ padding: "4px 9px" }}>
                    {v}
                  </span>
                ))}
                <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--font-mono)" }}>
                  · se sustituyen con los datos del lead al enviar (el pie con enlace de baja se añade automáticamente)
                </span>
              </div>
            </div>
          ) : (
            <EmptyState title="Selecciona una plantilla" />
          )}
        </div>
      )}
    </HUDPanel>
  );
}
