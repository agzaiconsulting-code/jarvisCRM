"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  { num: "01", title: "Diagnóstico", desc: "Entendemos tu negocio y detectamos dónde construir con IA te da más palanca.", color: "var(--emerald)" },
  { num: "02", title: "Diseño", desc: "Te propongo una solución concreta, con alcance y plazos definidos.", color: "var(--cyan)" },
  { num: "03", title: "Construcción", desc: "Desarrollo, integro y pruebo todo hasta que funciona de verdad.", color: "var(--emerald)" },
  { num: "04", title: "Lanzamiento & soporte", desc: "Lo ponemos en marcha y me quedo para que siga rodando.", color: "var(--cyan)" },
];

export default function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="proceso"
      style={{ position: "relative", zIndex: 1, background: "rgba(7,15,51,.86)", padding: "120px 32px 130px", overflow: "hidden" }}
      aria-labelledby="proceso-heading"
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "34px 34px", opacity: .6, pointerEvents: "none" }} />
      <div style={{ position: "relative", maxWidth: 1240, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ maxWidth: 720 }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "var(--font-space)", fontSize: 12.5, letterSpacing: ".22em", fontWeight: 600, color: "var(--accent)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />CÓMO TRABAJO
          </div>
          <h2 id="proceso-heading" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, color: "#fff", fontSize: "clamp(34px,4.4vw,58px)", lineHeight: 1.05, letterSpacing: "-.01em", margin: "16px 0 0", textWrap: "balance" as React.CSSProperties["textWrap"] }}>
            Un proceso claro, sin sorpresas
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: "rgba(255,255,255,.62)", margin: "18px 0 0" }}>
            De la primera llamada al sistema funcionando. Cuatro pasos, cero humo.
          </p>
        </motion.div>

        <div ref={ref} style={{ position: "relative", marginTop: 64 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 24, height: 2, background: "linear-gradient(90deg, var(--emerald), var(--cyan), var(--emerald))", opacity: .45 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "36px 24px" }}>
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: (i * 120) / 1000, ease: [0.2, 0.7, 0.2, 1] }}
                style={{ position: "relative" }}
              >
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--navy-deep)", border: `2px solid ${step.color}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2 }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: step.color, boxShadow: `0 0 16px ${step.color}` }} />
                </div>
                <div style={{ fontFamily: "var(--font-space)", fontSize: 13, fontWeight: 700, letterSpacing: ".2em", color: "var(--accent)", margin: "22px 0 8px" }}>{step.num}</div>
                <h3 style={{ fontFamily: "var(--font-space)", fontSize: 20, fontWeight: 600, color: "#fff", margin: 0 }}>{step.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: "rgba(255,255,255,.6)", margin: "10px 0 0" }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
