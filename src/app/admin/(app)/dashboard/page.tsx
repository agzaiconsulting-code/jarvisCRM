"use client";

/* Dashboard con métricas reales (PRD §6.6), filtrables por campaña, sector y zona. */

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HUDPanel, CountUp, ScreenHead, Funnel, Donut, EmptyState, BootLoader } from "@/components/hud";
import { relativeTime } from "@/lib/leads";
import type { ActivityLogEntry, Campaign, Lead, ReplyClassification } from "@/lib/types";

interface SendRow {
  id: string;
  lead_id: string | null;
}
interface EventRow {
  email_send_id: string | null;
  type: string;
}
interface ReplyRow {
  lead_id: string | null;
  ai_classification: ReplyClassification | null;
}
interface MemberRow {
  campaign_id: string;
  lead_id: string;
}
interface JobRow {
  id: string;
  zone: string;
}

const REPLY_COLORS: Record<string, { label: string; color: string }> = {
  interested: { label: "Interesado", color: "#f5c451" },
  question: { label: "Pregunta", color: "#38bdf8" },
  auto_reply: { label: "Autorespuesta", color: "#7e93b8" },
  not_interested: { label: "No interesado", color: "#f87171" },
  unsubscribe: { label: "Baja", color: "#b8902f" },
  other: { label: "Otro", color: "#34d399" },
  none: { label: "Sin clasificar", color: "#46597e" },
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

export default function DashboardPage() {
  const [loaded, setLoaded] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [sends, setSends] = useState<SendRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);

  const [fCampaign, setFCampaign] = useState("all");
  const [fCategory, setFCategory] = useState("all");
  const [fZone, setFZone] = useState("all");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [l, c, m, j, s, e, r, a] = await Promise.all([
        supabase.from("leads").select("id, status, category, scrape_job_id, name"),
        supabase.from("campaigns").select(),
        supabase.from("campaign_leads").select("campaign_id, lead_id"),
        supabase.from("scrape_jobs").select("id, zone"),
        supabase.from("email_sends").select("id, lead_id"),
        supabase.from("email_events").select("email_send_id, type"),
        supabase.from("replies").select("lead_id, ai_classification"),
        supabase.from("activity_log").select().order("created_at", { ascending: false }).limit(40),
      ]);
      setLeads((l.data as Lead[]) ?? []);
      setCampaigns((c.data as Campaign[]) ?? []);
      setMembers((m.data as MemberRow[]) ?? []);
      setJobs((j.data as JobRow[]) ?? []);
      setSends((s.data as SendRow[]) ?? []);
      setEvents((e.data as EventRow[]) ?? []);
      setReplies((r.data as ReplyRow[]) ?? []);
      setActivity((a.data as ActivityLogEntry[]) ?? []);
      setLoaded(true);
    })();
  }, []);

  const categories = useMemo(
    () => [...new Set(leads.map((l) => l.category).filter((c): c is string => !!c))].sort(),
    [leads]
  );
  const zones = useMemo(() => [...new Set(jobs.map((j) => j.zone).filter(Boolean))].sort(), [jobs]);

  const data = useMemo(() => {
    const zoneByJob = new Map(jobs.map((j) => [j.id, j.zone]));
    const campaignLeadIds =
      fCampaign === "all" ? null : new Set(members.filter((m) => m.campaign_id === fCampaign).map((m) => m.lead_id));

    const filteredLeads = leads.filter((l) => {
      if (campaignLeadIds && !campaignLeadIds.has(l.id)) return false;
      if (fCategory !== "all" && l.category !== fCategory) return false;
      if (fZone !== "all" && (l.scrape_job_id ? zoneByJob.get(l.scrape_job_id) : null) !== fZone) return false;
      return true;
    });
    const leadIds = new Set(filteredLeads.map((l) => l.id));

    const sendsF = sends.filter((s) => s.lead_id && leadIds.has(s.lead_id));
    const sendIds = new Set(sendsF.map((s) => s.id));
    const leadBySend = new Map(sendsF.map((s) => [s.id, s.lead_id!]));

    const contacted = new Set(sendsF.map((s) => s.lead_id!));
    const openedLeads = new Set(
      events
        .filter((e) => e.type === "opened" && e.email_send_id && sendIds.has(e.email_send_id))
        .map((e) => leadBySend.get(e.email_send_id!)!)
    );
    const repliesF = replies.filter((r) => r.lead_id && leadIds.has(r.lead_id));
    const repliedLeads = new Set(repliesF.map((r) => r.lead_id!));
    // los estados del pipeline también cuentan (cambios manuales o sin tracking)
    for (const l of filteredLeads) {
      if (["contacted", "opened", "replied", "qualified", "won"].includes(l.status)) contacted.add(l.id);
      if (["opened", "replied"].includes(l.status)) openedLeads.add(l.id);
      if (l.status === "replied") repliedLeads.add(l.id);
    }
    const qualified = filteredLeads.filter((l) => l.status === "qualified" || l.status === "won").length;
    const won = filteredLeads.filter((l) => l.status === "won").length;

    const byClass = new Map<string, number>();
    for (const r of repliesF) {
      const key = r.ai_classification ?? "none";
      byClass.set(key, (byClass.get(key) ?? 0) + 1);
    }
    const replyTypes = [...byClass.entries()]
      .map(([key, value]) => ({ key, value, ...(REPLY_COLORS[key] ?? REPLY_COLORS.none) }))
      .sort((a, b) => b.value - a.value);

    const activityF =
      fCampaign === "all" && fCategory === "all" && fZone === "all"
        ? activity
        : activity.filter((a) => a.lead_id && leadIds.has(a.lead_id));

    return {
      scraped: filteredLeads.length,
      contacted: contacted.size,
      opened: openedLeads.size,
      replied: repliedLeads.size,
      qualified,
      won,
      openRate: contacted.size ? (openedLeads.size / contacted.size) * 100 : 0,
      replyRate: contacted.size ? (repliedLeads.size / contacted.size) * 100 : 0,
      replyTypes,
      totalReplies: repliesF.length,
      activity: activityF.slice(0, 14),
    };
  }, [leads, members, jobs, sends, events, replies, activity, fCampaign, fCategory, fZone]);

  if (!loaded) {
    return (
      <div>
        <ScreenHead title="Sala de control" sub="JARVIS · SISTEMA OPERATIVO" />
        <HUDPanel>
          <BootLoader label="Sincronizando métricas" />
        </HUDPanel>
      </div>
    );
  }

  return (
    <div>
      <ScreenHead
        title="Sala de control"
        sub="JARVIS · MÉTRICAS EN VIVO"
        right={
          <div style={{ display: "flex", gap: 10 }}>
            <select className="hud-select" value={fCampaign} onChange={(e) => setFCampaign(e.target.value)}>
              <option value="all">Todas las campañas</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select className="hud-select" value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
              <option value="all">Todos los sectores</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select className="hud-select" value={fZone} onChange={(e) => setFZone(e.target.value)}>
              <option value="all">Todas las zonas</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <HUDPanel title="Total scrapeados" delay={0} hoverable>
          <div className="metric-value">
            <CountUp value={data.scraped} />
          </div>
          <div className="metric-note">LEADS EN BASE</div>
        </HUDPanel>
        <HUDPanel title="Contactados" delay={60} hoverable>
          <div className="metric-value">
            <CountUp value={data.contacted} />
          </div>
          <div className="metric-note">CON AL MENOS UN ENVÍO</div>
        </HUDPanel>
        <HUDPanel title="% Apertura" delay={120} hoverable>
          <div className="metric-value">
            <CountUp value={data.openRate} decimals={1} />
            <span className="unit"> %</span>
          </div>
          <div className="metric-note">DATO ORIENTATIVO (PIXEL)</div>
        </HUDPanel>
        <HUDPanel title="% Respuesta" gold delay={180} hoverable>
          <div className="metric-value gold">
            <CountUp value={data.replyRate} decimals={1} />
            <span className="unit"> %</span>
          </div>
          <div className="metric-note">{data.replied} RESPONDIDOS</div>
        </HUDPanel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>
        <HUDPanel title="Embudo de conversión" delay={240}>
          {data.scraped === 0 ? (
            <EmptyState title="Sin datos" sub="Lanza un escaneo para empezar a llenar el embudo." />
          ) : (
            <Funnel
              data={[
                { key: "scrapeados", label: "Scrapeados", value: data.scraped },
                { key: "contactados", label: "Contactados", value: data.contacted },
                { key: "abiertos", label: "Abiertos", value: data.opened },
                { key: "respondidos", label: "Respondidos", value: data.replied },
                { key: "cualificados", label: "Cualificados", value: data.qualified },
                { key: "ganados", label: "Ganados", value: data.won },
              ]}
            />
          )}
        </HUDPanel>

        <HUDPanel title="Actividad reciente" delay={300} style={{ gridRow: "span 2" }}>
          {data.activity.length === 0 ? (
            <EmptyState title="Sin actividad" sub="Aquí aparecerán escaneos, envíos, aperturas y respuestas." />
          ) : (
            <div className="log">
              {data.activity.map((a) => {
                const ic = LOG_GLYPH[a.type] ?? LOG_GLYPH.note;
                return (
                  <div className="log-row" key={a.id}>
                    <span className="log-time">{relativeTime(a.created_at)}</span>
                    <span className="log-ico" style={{ color: ic.color }}>
                      {ic.glyph}
                    </span>
                    <span className="log-msg">{a.description ?? a.type}</span>
                  </div>
                );
              })}
            </div>
          )}
        </HUDPanel>

        <HUDPanel title="Respondidos por estado" delay={360}>
          {data.totalReplies === 0 ? (
            <EmptyState title="Sin respuestas" sub="Cuando lleguen respuestas verás aquí su clasificación IA." />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <Donut data={data.replyTypes} total={data.totalReplies} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                {data.replyTypes.map((r) => (
                  <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 8, height: 8, background: r.color, flex: "none" }} />
                    <span style={{ flex: 1, fontSize: 12.5 }}>{r.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--dim)" }}>{r.value}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dim)", width: 38, textAlign: "right" }}>
                      {Math.round((r.value / data.totalReplies) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </HUDPanel>
      </div>
    </div>
  );
}
