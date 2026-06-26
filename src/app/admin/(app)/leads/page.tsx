"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HUDPanel, ScreenHead, Seg, Btn, Chip, StageChip, Stars, EmptyState, BootLoader } from "@/components/hud";
import { updateLeadStatus, relativeTime } from "@/lib/leads";
import type { Lead, LeadStatus } from "@/lib/types";

/* Columnas del kanban (diseño leads.jsx): ganado+perdido se muestran en "Cerrado" */
const KANBAN_COLS: Array<{ key: string; label: string; statuses: LeadStatus[] }> = [
  { key: "new", label: "Nuevo", statuses: ["new"] },
  { key: "contacted", label: "Contactado", statuses: ["contacted"] },
  { key: "opened", label: "Abierto", statuses: ["opened"] },
  { key: "replied", label: "Respondido", statuses: ["replied"] },
  { key: "qualified", label: "Cualificado", statuses: ["qualified"] },
  { key: "closed", label: "Cerrado", statuses: ["won", "lost"] },
];

type EmailFilter = "all" | "with" | "without";

const EMPTY_FORM = { name: "", category: "", address: "", phone: "", email: "", website: "" };

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [view, setView] = useState("kanban");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [emailFilter, setEmailFilter] = useState<EmailFilter>("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("leads")
      .select()
      .order("updated_at", { ascending: false })
      .then(({ data }) => setLeads((data as Lead[]) ?? []));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads ?? []) if (l.category) set.add(l.category);
    return [...set].sort();
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (leads ?? []).filter((l) => {
      if (q && !l.name.toLowerCase().includes(q) && !(l.address ?? "").toLowerCase().includes(q)) return false;
      if (category !== "all" && l.category !== category) return false;
      if (emailFilter === "with" && !l.email) return false;
      if (emailFilter === "without" && l.email) return false;
      return true;
    });
  }, [leads, search, category, emailFilter]);

  async function addLead() {
    const name = form.name.trim();
    if (!name) return;
    setAdding(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAdding(false); return; }
    const payload = {
      user_id: user.id,
      name,
      category: form.category.trim() || null,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      email_source: form.email.trim() ? "manual" : null,
      has_website: !!form.website.trim(),
      enrichment_status: form.email.trim() ? "done" : "no_email",
      status: "new",
    };
    const { data } = await supabase.from("leads").insert(payload).select().single();
    if (data) {
      setLeads((ls) => [data as Lead, ...(ls ?? [])]);
      setForm(EMPTY_FORM);
      setAddOpen(false);
    }
    setAdding(false);
  }

  async function moveLead(leadId: string, col: string) {
    const lead = leads?.find((l) => l.id === leadId);
    if (!lead) return;
    // soltar en "Cerrado" marca ganado; perdido se marca desde la ficha (DECISIONS.md)
    const status: LeadStatus = col === "closed" ? "won" : (col as LeadStatus);
    if (lead.status === status) return;
    const prev = lead.status;
    setLeads((ls) => (ls ?? []).map((l) => (l.id === leadId ? { ...l, status } : l)));
    try {
      await updateLeadStatus(lead, status);
    } catch {
      setLeads((ls) => (ls ?? []).map((l) => (l.id === leadId ? { ...l, status: prev } : l)));
    }
  }

  if (!leads) {
    return (
      <div>
        <ScreenHead title="Leads" sub="PIPELINE DE PROSPECCIÓN" />
        <HUDPanel>
          <BootLoader label="Cargando leads" />
        </HUDPanel>
      </div>
    );
  }

  return (
    <div>
      <ScreenHead
        title="Leads"
        sub={`PIPELINE DE PROSPECCIÓN · ${leads.length} REGISTROS`}
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Btn variant="blue" sm onClick={() => setAddOpen((v) => !v)}>
              {addOpen ? "✕ Cancelar" : "+ Nuevo lead"}
            </Btn>
            <Seg options={[{ key: "kanban", label: "Kanban" }, { key: "table", label: "Tabla" }]} value={view} onChange={setView} />
          </div>
        }
      />

      {addOpen && (
        <HUDPanel title="Nuevo lead manual" delay={0} style={{ marginBottom: 16 }}>
          <div className="crm-grid-leads-filters">
            <div className="field">
              <span className="field-label">Nombre *</span>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div className="field">
              <span className="field-label">Categoría</span>
              <input type="text" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="ej. Taller mecánico" />
            </div>
            <div className="field">
              <span className="field-label">Email</span>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="field">
              <span className="field-label">Teléfono</span>
              <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="field">
              <span className="field-label">Web</span>
              <input type="text" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="field">
              <span className="field-label">Dirección</span>
              <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Btn variant="gold" sm onClick={addLead} disabled={adding || !form.name.trim()}>
              {adding ? "Guardando…" : "Añadir al pipeline"}
            </Btn>
          </div>
        </HUDPanel>
      )}

      <HUDPanel title="Filtros" delay={0} style={{ marginBottom: 16 }}>
        <div className="crm-grid-leads-search">
          <div className="field">
            <span className="field-label">Buscar</span>
            <input type="text" placeholder="Nombre o dirección…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Categoría</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">Todas</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Seg
            options={[
              { key: "all", label: "Todos" },
              { key: "with", label: "Con email" },
              { key: "without", label: "Sin email" },
            ]}
            value={emailFilter}
            onChange={(k) => setEmailFilter(k as EmailFilter)}
          />
        </div>
      </HUDPanel>

      {leads.length === 0 ? (
        <HUDPanel delay={80}>
          <EmptyState
            title="Pipeline vacío"
            sub="Aún no hay leads. Lanza un escaneo desde el módulo Buscar leads para empezar."
          />
        </HUDPanel>
      ) : view === "kanban" ? (
        <div className="kanban">
          {KANBAN_COLS.map((col) => {
            const colLeads = filtered.filter((l) => col.statuses.includes(l.status));
            return (
              <div
                key={col.key}
                className={`kcol ${overCol === col.key ? "dragover" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverCol(col.key);
                }}
                onDragLeave={() => setOverCol(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOverCol(null);
                  if (dragId) moveLead(dragId, col.key);
                  setDragId(null);
                }}
              >
                <div className="kcol-head">
                  <span>{col.label}</span>
                  <span className="kcol-count">{colLeads.length}</span>
                </div>
                {colLeads.map((l) => (
                  <div
                    key={l.id}
                    className={`kcard ${dragId === l.id ? "dragging" : ""} ${movingId === l.id ? "kcard-moving" : ""}`}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => {
                      if (movingId === l.id) return;
                      if (movingId) { setMovingId(null); return; }
                      router.push(`/admin/leads/${l.id}`);
                    }}
                  >
                    <div className="kcard-name">{l.name}</div>
                    <div className="kcard-meta">
                      {l.category ? <Chip color="dim">{l.category}</Chip> : null}
                      <Chip color={l.email ? "ok" : "danger"}>{l.email ? "✓ email" : "✗ email"}</Chip>
                    </div>
                    <div className="kcard-meta" style={{ justifyContent: "space-between" }}>
                      {l.rating != null ? <Stars rating={l.rating} /> : <span />}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="kcard-last">{relativeTime(l.updated_at)}</span>
                        <button
                          className="kcard-move-btn"
                          title="Mover a otra columna"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovingId(movingId === l.id ? null : l.id);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    {col.key === "closed" ? <StageChip stage={l.status} /> : null}

                    {movingId === l.id && (
                      <div className="kcard-mover" onClick={(e) => e.stopPropagation()}>
                        <span className="kcard-mover-label">Mover a</span>
                        <div className="kcard-mover-cols">
                          {KANBAN_COLS.filter((c) => !c.statuses.includes(l.status)).map((c) => (
                            <button
                              key={c.key}
                              className="kcard-mover-col"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLead(l.id, c.key);
                                setMovingId(null);
                              }}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                        <button
                          className="kcard-mover-cancel"
                          onClick={(e) => { e.stopPropagation(); setMovingId(null); }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <HUDPanel delay={80}>
          <table className="hud-table">
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Categoría</th>
                <th>Dirección</th>
                <th>Rating</th>
                <th>Reseñas</th>
                <th>Email</th>
                <th>Fase</th>
                <th>Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} onClick={() => router.push(`/admin/leads/${l.id}`)} style={{ cursor: "pointer" }}>
                  <td>{l.name}</td>
                  <td>{l.category ?? "—"}</td>
                  <td>{l.address ?? "—"}</td>
                  <td>{l.rating != null ? l.rating.toFixed(1) : "—"}</td>
                  <td>{l.reviews_count ?? "—"}</td>
                  <td>{l.email ?? <span style={{ color: "var(--dim)" }}>sin email</span>}</td>
                  <td>
                    <StageChip stage={l.status} />
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--dim)" }}>
                    {relativeTime(l.updated_at)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--dim)" }}>
                    Sin resultados con los filtros actuales.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </HUDPanel>
      )}
    </div>
  );
}
