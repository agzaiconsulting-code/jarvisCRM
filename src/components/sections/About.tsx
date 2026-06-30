"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const bullets = [
  { color: "var(--emerald)", text: "Trato directo, sin intermediarios ni departamentos." },
  { color: "var(--cyan)", text: "Tecnología puntera, explicada en simple." },
  { color: "var(--emerald)", text: "Resultados medibles desde la primera semana." },
];

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="sobre"
      style={{ position: "relative", zIndex: 1, background: "rgba(245,245,243,.8)", padding: "120px 32px 130px" }}
      aria-labelledby="sobre-heading"
    >
      <div ref={ref} style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 64, alignItems: "center" }}>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "var(--font-space)", fontSize: 12.5, letterSpacing: ".22em", fontWeight: 600, color: "var(--navy)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />SOBRE AGZAI
          </div>
          <h2 id="sobre-heading" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, color: "var(--navy)", fontSize: "clamp(34px,4.4vw,58px)", lineHeight: 1.05, letterSpacing: "-.01em", margin: "16px 0 0", textWrap: "balance" as React.CSSProperties["textWrap"] }}>
            Hecho con IA, sin humo
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--muted)", margin: "22px 0 0", maxWidth: 520 }}>
            Construyo software, automatizaciones y webs a medida apoyándome en la IA para entregar más rápido, mejor y a un precio que tiene sentido. Nada de proyectos eternos ni tecnicismos: soluciones que entiendes y que funcionan desde el primer día.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 32 }}>
            {bullets.map((b) => (
              <div key={b.text} style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                <span style={{ flex: "none", marginTop: 6, width: 9, height: 9, borderRadius: "50%", background: b.color }} />
                <span style={{ fontSize: 16, color: "var(--ink)", fontWeight: 500 }}>{b.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ position: "relative" }}
        >
          <div style={{ position: "relative", aspectRatio: "4/5", borderRadius: 24, overflow: "hidden", border: "1px solid var(--line)" }}>
            <Image
              src="/fotoprofesional.png"
              alt="Foto profesional AGZAI"
              fill
              style={{ objectFit: "cover", objectPosition: "center top" }}
              priority
            />
          </div>
          <div style={{ position: "absolute", bottom: -22, left: -22, background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 20px", boxShadow: "0 16px 40px rgba(10,28,102,.12)", display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: 22, color: "#fff", letterSpacing: ".04em" }}>A</span>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-space)", fontSize: 15, fontWeight: 600, color: "var(--navy)", lineHeight: 1.1 }}>AGZAI</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Consultoría de IA</div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
