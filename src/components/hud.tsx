"use client";

/* JARVIS CRM — librería de componentes HUD (Fase 1) */

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import type { LeadStatus } from "@/lib/types";

/* ── Panel de cristal con corchetes HUD y animación boot ── */
export function HUDPanel({
  title,
  gold,
  right,
  children,
  className = "",
  style,
  delay = 0,
  hoverable,
}: {
  title?: string;
  gold?: boolean;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  hoverable?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      className={`hud-panel ${hoverable ? "hoverable" : ""} ${className}`}
      style={style}
      initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(7px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, delay: delay / 1000, ease: [0.22, 0.8, 0.3, 1] }}
    >
      <span className="hud-c tl" />
      <span className="hud-c tr" />
      <span className="hud-c bl" />
      <span className="hud-c br" />
      {title ? (
        <header className="hud-panel-head">
          <span className={`hud-label ${gold ? "gold" : ""}`}>
            <i className="hud-dot" />
            {title}
          </span>
          {right ?? null}
        </header>
      ) : null}
      {children}
    </motion.section>
  );
}

/* ── Contador animado ── */
export function CountUp({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const reduced = useReducedMotion();
  const [v, setV] = useState(0);

  useEffect(() => {
    if (reduced) {
      setV(value);
      return;
    }
    let start: number | null = null;
    let raf: number;
    const dur = 1100;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(value * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);

  const txt = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString("es-ES");
  return (
    <span>
      {txt}
      {suffix}
    </span>
  );
}

/* ── Segmented control ── */
export function Seg({
  options,
  value,
  onChange,
}: {
  options: Array<string | { key: string; label: string }>;
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => {
        const key = typeof o === "string" ? o : o.key;
        const label = typeof o === "string" ? o : o.label;
        return (
          <button key={key} type="button" className={value === key ? "on" : ""} onClick={() => onChange(key)}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Botón ── */
export function Btn({
  variant = "blue",
  sm,
  children,
  ...rest
}: {
  variant?: "blue" | "gold" | "ghost" | "danger";
  sm?: boolean;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`btn btn-${variant} ${sm ? "btn-sm" : ""}`} {...rest}>
      {children}
    </button>
  );
}

/* ── Chip de estado del pipeline (estados §5 del PRD) ── */
export const STAGE_CHIP: Record<LeadStatus, { label: string; cls: string }> = {
  new: { label: "Nuevo", cls: "c-dim" },
  contacted: { label: "Contactado", cls: "c-blue" },
  opened: { label: "Abierto", cls: "c-blue" },
  replied: { label: "Respondido", cls: "c-gold" },
  qualified: { label: "Cualificado", cls: "c-gold" },
  won: { label: "Ganado", cls: "c-ok" },
  lost: { label: "Perdido", cls: "c-danger" },
};

export function StageChip({ stage }: { stage: LeadStatus }) {
  const s = STAGE_CHIP[stage] ?? STAGE_CHIP.new;
  return (
    <span className={`chip ${s.cls}`}>
      <i className="chip-dot" />
      {s.label}
    </span>
  );
}

/* ── Chip genérico ── */
export function Chip({
  color = "dim",
  children,
}: {
  color?: "blue" | "gold" | "ok" | "danger" | "dim";
  children: ReactNode;
}) {
  return (
    <span className={`chip c-${color}`}>
      <i className="chip-dot" />
      {children}
    </span>
  );
}

/* ── Estrellas de rating ── */
export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="kcard-meta" style={{ gap: 6 }}>
      <span className="stars">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= full ? "" : "off"}>
            ★
          </span>
        ))}
      </span>
      <span className="rating-num">{rating.toFixed(1)}</span>
    </span>
  );
}

/* ── Estado vacío ── */
export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-ring" />
      <div className="empty-title">{title}</div>
      {sub ? <div className="empty-sub">{sub}</div> : null}
      {action ?? null}
    </div>
  );
}

/* ── Carga estilo arranque de sistema ── */
export function BootLoader({ label = "Inicializando" }: { label?: string }) {
  return (
    <div className="empty scanline-wrap">
      <div className="empty-ring" style={{ animation: "radarSpin 2.4s linear infinite" }} />
      <div className="empty-title" style={{ animation: "blink 1.4s ease-in-out infinite" }}>
        {label}…
      </div>
    </div>
  );
}

/* ── Sparkline ── */
export function Sparkline({
  data,
  width = 110,
  height = 28,
  color = "var(--blue)",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!data || data.length < 2) return <span className="metric-note">—</span>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * (width - 4) + 2;
      const y = height - 3 - ((d - min) / (max - min || 1)) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" opacity="0.9" />
    </svg>
  );
}

/* ── Iconos geométricos ── */
export function Icon({ name, size = 17 }: { name: "dashboard" | "scan" | "leads" | "campaigns" | "settings"; size?: number }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "square" as const };
  const icons = {
    dashboard: (
      <g {...s}>
        <rect x="2.5" y="2.5" width="7" height="7" />
        <rect x="13.5" y="2.5" width="7" height="7" />
        <rect x="2.5" y="13.5" width="7" height="7" />
        <rect x="13.5" y="13.5" width="7" height="7" />
      </g>
    ),
    scan: (
      <g {...s}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="3.5" />
        <line x1="12" y1="0.5" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="23.5" />
      </g>
    ),
    leads: (
      <g {...s}>
        <rect x="2.5" y="3.5" width="5.5" height="14" />
        <rect x="9.5" y="3.5" width="5.5" height="10" />
        <rect x="16.5" y="3.5" width="5.5" height="17" />
      </g>
    ),
    campaigns: (
      <g {...s}>
        <line x1="3" y1="12" x2="21" y2="4" />
        <line x1="21" y1="4" x2="14" y2="20" />
        <line x1="14" y1="20" x2="10" y2="13" />
        <line x1="10" y1="13" x2="3" y2="12" />
      </g>
    ),
    settings: (
      <g {...s}>
        <line x1="4" y1="6.5" x2="20" y2="6.5" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="17.5" x2="20" y2="17.5" />
        <circle cx="9" cy="6.5" r="2" fill="var(--bg)" />
        <circle cx="15" cy="12" r="2" fill="var(--bg)" />
        <circle cx="7" cy="17.5" r="2" fill="var(--bg)" />
      </g>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {icons[name] ?? null}
    </svg>
  );
}

/* ── Campo de formulario ── */
export function Field({
  label,
  hint,
  children,
  style,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="field" style={style}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

/* ── Cabecera de pantalla ── */
export function ScreenHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="screen-head"
      initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(7px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: [0.22, 0.8, 0.3, 1] }}
    >
      <div>
        <h1 className="screen-title">{title}</h1>
        {sub ? <p className="screen-sub">{sub}</p> : null}
      </div>
      {right ?? null}
    </motion.div>
  );
}

/* ── Fila del feed de actividad ── */
export type LogItem = {
  time: string;
  type: "scan" | "sent" | "open" | "reply" | "qual" | "won";
  msg: [string, string?, string?];
};

const LOG_ICONS: Record<LogItem["type"], { glyph: string; color: string }> = {
  scan: { glyph: "◎", color: "var(--blue)" },
  sent: { glyph: "▸", color: "var(--blue)" },
  open: { glyph: "◉", color: "var(--dim)" },
  reply: { glyph: "◆", color: "var(--gold)" },
  qual: { glyph: "✦", color: "var(--gold)" },
  won: { glyph: "✓", color: "var(--ok)" },
};

export function LogRow({ item }: { item: LogItem }) {
  const ic = LOG_ICONS[item.type] ?? LOG_ICONS.sent;
  return (
    <div className="log-row">
      <span className="log-time">{item.time}</span>
      <span className="log-ico" style={{ color: ic.color }}>
        {ic.glyph}
      </span>
      <span className="log-msg">
        {item.msg[0]}
        {item.msg[1] ? <b>{item.msg[1]}</b> : null}
        {item.msg[2] ?? null}
      </span>
    </div>
  );
}

/* ── Embudo holográfico: barras con gradiente azul→dorado ── */
export function Funnel({ data }: { data: Array<{ key: string; label: string; value: number }> }) {
  const max = data[0]?.value || 1;
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
  const colorAt = (t: number) => `rgb(${lerp(56, 245, t)}, ${lerp(189, 196, t)}, ${lerp(248, 81, t)})`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((d, i) => {
        const t = data.length > 1 ? i / (data.length - 1) : 0;
        const w = Math.max(4, (d.value / max) * 100);
        const pct = i === 0 ? 100 : (d.value / max) * 100;
        const c = colorAt(t);
        return (
          <div key={d.key} className="crm-funnel-row" style={{ display: "grid", gridTemplateColumns: "104px 1fr 110px", gap: 12, alignItems: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 11.5,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "var(--dim)",
              }}
            >
              {d.label}
            </span>
            <div style={{ height: 18, position: "relative", background: "rgba(56,189,248,0.05)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${w}%` }}
                transition={{ duration: 1, ease: [0.22, 0.8, 0.3, 1] }}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  background: `linear-gradient(90deg, ${c}33, ${c}cc)`,
                  borderRight: `2px solid ${c}`,
                  boxShadow: `0 0 calc(14px * var(--glow)) ${c}55`,
                }}
              />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              <CountUp value={d.value} />
              <span style={{ color: "var(--dim)", fontSize: 10.5 }}> · {pct.toFixed(pct < 10 ? 1 : 0)}%</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Donut holográfico con conic-gradient ── */
export function Donut({
  data,
  total,
  size = 150,
  centerLabel = "Respuestas",
}: {
  data: Array<{ key: string; label: string; value: number; color: string }>;
  total: number;
  size?: number;
  centerLabel?: string;
}) {
  let acc = 0;
  const segs = data
    .map((d) => {
      const from = (acc / (total || 1)) * 360;
      acc += d.value;
      const to = (acc / (total || 1)) * 360;
      return `${d.color} ${from}deg ${to}deg`;
    })
    .join(", ");
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `conic-gradient(${segs})`,
          mask: "radial-gradient(circle, transparent 56%, black 57%)",
          WebkitMask: "radial-gradient(circle, transparent 56%, black 57%)",
          filter: "drop-shadow(0 0 calc(10px * var(--glow)) rgba(14,165,233,0.35))",
        }}
      />
      <div style={{ position: "absolute", inset: 14, borderRadius: "50%", border: "1px dashed rgba(56,189,248,0.2)" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontVariantNumeric: "tabular-nums" }}>
          <CountUp value={total} />
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 9.5,
            letterSpacing: ".24em",
            textTransform: "uppercase",
            color: "var(--dim)",
          }}
        >
          {centerLabel}
        </span>
      </div>
    </div>
  );
}
