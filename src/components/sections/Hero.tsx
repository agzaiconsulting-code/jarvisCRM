"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });

  const ease = [0.2, 0.7, 0.2, 1] as const;
  const item = (delay: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay: delay / 1000, ease },
  });

  return (
    <header
      id="top"
      ref={ref}
      style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "radial-gradient(120% 120% at 80% 0%, rgba(255,255,255,.55) 0%, rgba(245,245,243,0) 58%)",
      }}
    >
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1240, margin: "0 auto", padding: "120px 32px 90px", width: "100%" }}>
        <div style={{ maxWidth: 880 }}>
          <motion.div {...item(0)} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 16px", border: "1px solid var(--line)", borderRadius: 999, background: "rgba(255,255,255,.6)", backdropFilter: "blur(6px)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
            <span style={{ fontFamily: "var(--font-space)", fontSize: 12.5, letterSpacing: ".22em", fontWeight: 600, color: "var(--navy)" }}>
              PRODUCTO A MEDIDA · CONSTRUIDO CON IA
            </span>
          </motion.div>

          <motion.h1
            {...item(80)}
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 600,
              color: "var(--navy)",
              fontSize: "clamp(44px,6.8vw,96px)",
              lineHeight: 1.02,
              letterSpacing: "-.01em",
              margin: "26px 0 0",
              textWrap: "balance" as React.CSSProperties["textWrap"],
            }}
          >
            Construyo tu producto<br />
            con ayuda de la{" "}
            <span style={{ fontStyle: "italic", position: "relative" }}>
              IA
              <span style={{ position: "absolute", left: 0, right: 0, bottom: 6, height: 10, background: "var(--accent)", opacity: .32, zIndex: -1, borderRadius: 2 }} />
            </span>
            .
          </motion.h1>

          <motion.p
            {...item(160)}
            style={{ fontFamily: "var(--font-hanken)", fontSize: "clamp(17px,1.6vw,21px)", lineHeight: 1.55, color: "var(--muted)", maxWidth: 580, margin: "28px 0 0" }}
          >
            Automatizaciones, bots, webs y CRMs a medida, desarrollados con IA para entregarte más, en menos tiempo y mejor.
          </motion.p>

          <motion.div {...item(240)} style={{ display: "flex", flexWrap: "wrap" as const, gap: 14, marginTop: 38 }}>
            <a
              href="#contacto"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10, background: "var(--accent)", color: "var(--navy-deep)", fontWeight: 700, fontSize: 16, padding: "16px 28px", borderRadius: 999, transition: "transform .25s ease, box-shadow .25s ease", boxShadow: "0 10px 30px rgba(57,211,156,.4)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 18px 40px rgba(57,211,156,.55)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(57,211,156,.4)"; }}
            >
              Reservar llamada
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <a
              href="#servicios"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10, color: "var(--navy)", fontWeight: 600, fontSize: 16, padding: "16px 26px", borderRadius: 999, border: "1px solid var(--line)", background: "rgba(255,255,255,.5)", transition: "background .25s ease, border-color .25s ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "var(--navy)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.5)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"; }}
            >
              Ver servicios
            </a>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position: "absolute", left: "50%", bottom: 26, transform: "translateX(-50%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ width: 22, height: 36, border: "1.6px solid var(--line)", borderRadius: 14, display: "flex", justifyContent: "center", paddingTop: 7 }}>
          <span style={{ width: 4, height: 8, borderRadius: 2, background: "var(--navy)", animation: "scrollDot 1.8s ease-in-out infinite" }} />
        </div>
      </div>
    </header>
  );
}
