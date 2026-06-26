"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const services = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 0 1 9-9m9 9a9 9 0 0 1-9 9" stroke="var(--navy)" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 3l2.2 2.2M12 21l-2.2-2.2" stroke="#39d39c" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="12" r="3" fill="#3bcfe0"/></svg>
    ),
    iconBg: "rgba(57,211,156,.12)",
    title: "Automatizaciones",
    desc: "Conecto tus herramientas y dejo que los procesos repetitivos se hagan solos.",
    tags: ["Make", "Zapier", "n8n", "APIs"],
    dark: false,
    dashed: false,
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="13" rx="3" stroke="var(--navy)" strokeWidth="1.8"/><circle cx="9" cy="11.5" r="1.4" fill="#3bcfe0"/><circle cx="15" cy="11.5" r="1.4" fill="#39d39c"/><path d="M12 18v3M9 21h6" stroke="var(--navy)" strokeWidth="1.8" strokeLinecap="round"/></svg>
    ),
    iconBg: "rgba(59,207,224,.14)",
    title: "Bots con IA",
    desc: "Asistentes que atienden, responden y venden por ti las 24 horas.",
    tags: ["WhatsApp", "Web", "Voz"],
    dark: false,
    dashed: false,
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="var(--navy)" strokeWidth="1.8"/><path d="M3 8h18" stroke="var(--navy)" strokeWidth="1.8"/><circle cx="6" cy="6" r=".9" fill="#39d39c"/><path d="M8 13h8M8 16h5" stroke="#3bcfe0" strokeWidth="1.8" strokeLinecap="round"/></svg>
    ),
    iconBg: "rgba(57,211,156,.12)",
    title: "Landing pages",
    desc: "Páginas que cargan rápido, se ven impecables y convierten visitas en clientes.",
    tags: ["Diseño", "Copy", "SEO"],
    dark: false,
    dashed: false,
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2.5" stroke="var(--navy)" strokeWidth="1.8"/><path d="M3 9h18M8 3v4M16 3v4" stroke="var(--navy)" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="14.5" r="2.2" fill="#39d39c"/><circle cx="17" cy="13" r="1.1" fill="#3bcfe0"/></svg>
    ),
    iconBg: "rgba(59,207,224,.14)",
    title: "Webs de reservas",
    desc: "Sistemas de citas online que llenan tu agenda sin llamadas ni fricción.",
    tags: ["Calendario", "Pagos", "Recordatorios"],
    dark: false,
    dashed: false,
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="2.2" fill="#39d39c"/><circle cx="16" cy="8" r="2.2" stroke="#fff" strokeWidth="1.6"/><circle cx="12" cy="16" r="2.2" fill="#3bcfe0"/><path d="M9.5 9.4 11 14.5M14.5 9.4 13 14.5M10 8h4" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinecap="round"/></svg>
    ),
    iconBg: "rgba(255,255,255,.1)",
    title: "CRMs a medida",
    desc: "Tu negocio organizado en un solo lugar, adaptado a cómo trabajas de verdad.",
    tags: ["Clientes", "Pipeline", "Reporting"],
    dark: true,
    dashed: false,
  },
  {
    icon: null,
    iconBg: "",
    title: "¿Algo a medida?",
    desc: "Si tu reto no encaja en una caja, lo diseñamos juntos.",
    tags: [],
    dark: false,
    dashed: true,
  },
];

export default function Services() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="servicios"
      style={{ position: "relative", zIndex: 1, background: "rgba(245,245,243,.8)", padding: "120px 32px 130px" }}
      aria-labelledby="servicios-heading"
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ maxWidth: 720 }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "var(--font-space)", fontSize: 12.5, letterSpacing: ".22em", fontWeight: 600, color: "var(--navy)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />SERVICIOS
          </div>
          <h2 id="servicios-heading" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, color: "var(--navy)", fontSize: "clamp(34px,4.4vw,58px)", lineHeight: 1.05, letterSpacing: "-.01em", margin: "16px 0 0", textWrap: "balance" as React.CSSProperties["textWrap"] }}>
            Lo que puedo construir para ti
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: "var(--muted)", margin: "18px 0 0" }}>
            Productos a medida, construidos con IA para entregarte más rápido y mejor.
          </p>
        </motion.div>

        <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, marginTop: 54 }}>
          {services.map((s, i) => (
            <ServiceCard key={s.title} service={s} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service, index, inView }: { service: (typeof services)[0]; index: number; inView: boolean }) {
  const delay = [0, 80, 160, 0, 80, 160][index] ?? 0;

  if (service.dashed) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 28 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: delay / 1000, ease: [0.2, 0.7, 0.2, 1] }}
        style={{ display: "flex", flexDirection: "column", justifyContent: "center", background: "transparent", border: "1px dashed var(--line)", borderRadius: 20, padding: "34px 30px" }}
      >
        <h3 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: 25, fontWeight: 600, color: "var(--navy)", margin: 0, lineHeight: 1.2 }}>
          ¿Algo a medida?
        </h3>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "var(--muted)", margin: "12px 0 18px" }}>
          Si tu reto no encaja en una caja, lo diseñamos juntos.
        </p>
        <a
          href="#contacto"
          style={{ textDecoration: "none", fontFamily: "var(--font-space)", fontWeight: 600, fontSize: 15, color: "var(--navy)", display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          Cuéntame tu caso
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
      </motion.article>
    );
  }

  if (service.dark) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 28 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: delay / 1000, ease: [0.2, 0.7, 0.2, 1] }}
        style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%)", border: "1px solid var(--navy)", borderRadius: 20, padding: "34px 30px", transition: "transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease", position: "relative", overflow: "hidden", cursor: "default" }}
        whileHover={{ y: -8, boxShadow: "0 24px 50px rgba(10,28,102,.32)" }}
      >
        <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(57,211,156,.35), transparent 70%)" }} />
        <div style={{ width: 52, height: 52, borderRadius: 14, background: service.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, position: "relative" }}>
          {service.icon}
        </div>
        <h3 style={{ fontFamily: "var(--font-space)", fontSize: 21, fontWeight: 600, color: "#fff", margin: 0, position: "relative" }}>{service.title}</h3>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "rgba(255,255,255,.72)", margin: "12px 0 18px", position: "relative" }}>{service.desc}</p>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 7, position: "relative" }}>
          {service.tags.map((t) => (
            <span key={t} style={{ fontFamily: "var(--font-space)", fontSize: 12, fontWeight: 500, color: "#fff", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", padding: "5px 11px", borderRadius: 999 }}>{t}</span>
          ))}
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: delay / 1000, ease: [0.2, 0.7, 0.2, 1] }}
      style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 20, padding: "34px 30px", transition: "transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease, border-color .35s ease", cursor: "default" }}
      whileHover={{ y: -8, boxShadow: "0 24px 50px rgba(10,28,102,.14)", borderColor: "rgba(57,211,156,.6)" }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 14, background: service.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        {service.icon}
      </div>
      <h3 style={{ fontFamily: "var(--font-space)", fontSize: 21, fontWeight: 600, color: "var(--navy)", margin: 0 }}>{service.title}</h3>
      <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "var(--muted)", margin: "12px 0 18px" }}>{service.desc}</p>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 7 }}>
        {service.tags.map((t) => (
          <span key={t} style={{ fontFamily: "var(--font-space)", fontSize: 12, fontWeight: 500, color: "var(--navy)", background: "var(--paper)", border: "1px solid var(--line)", padding: "5px 11px", borderRadius: 999 }}>{t}</span>
        ))}
      </div>
    </motion.article>
  );
}
