"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export default function Contact() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameRef.current?.value,
        email: emailRef.current?.value,
        message: messageRef.current?.value,
      }),
    });
    setLoading(false);
    if (res.ok) setSent(true);
    else setError("No se pudo enviar. Inténtalo de nuevo.");
  };

  return (
    <section
      id="contacto"
      style={{ position: "relative", zIndex: 1, background: "linear-gradient(160deg, rgba(10,28,102,.9) 0%, rgba(7,15,51,.92) 100%)", padding: "120px 32px", overflow: "hidden" }}
      aria-labelledby="contacto-heading"
    >
      <div style={{ position: "absolute", right: -120, top: -80, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(57,211,156,.18), transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: -120, bottom: -120, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,207,224,.15), transparent 65%)", pointerEvents: "none" }} />

      <div ref={ref} style={{ position: "relative", maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 60, alignItems: "start" }}>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "var(--font-space)", fontSize: 12.5, letterSpacing: ".22em", fontWeight: 600, color: "var(--accent)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", animation: "blink 2s ease-in-out infinite" }} />HABLEMOS
          </div>
          <h2 id="contacto-heading" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, color: "#fff", fontSize: "clamp(34px,4.6vw,60px)", lineHeight: 1.04, letterSpacing: "-.01em", margin: "16px 0 0", textWrap: "balance" as React.CSSProperties["textWrap"] }}>
            ¿Listo para construir con IA?
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "rgba(255,255,255,.7)", margin: "20px 0 0", maxWidth: 430 }}>
            Cuéntame qué necesitas y te respondo en menos de 24 horas. Sin compromiso.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 34 }}>
            <a href="mailto:adrian.gomez@agzaiconsulting.com" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#fff" }}>
              <span style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="var(--accent)" strokeWidth="1.8"/><path d="m4 7 8 6 8-6" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </span>
              <span>
                <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,.55)" }}>Escríbeme</span>
                <span style={{ fontFamily: "var(--font-space)", fontWeight: 600, fontSize: 17 }}>adrian.gomez@agzaiconsulting.com</span>
              </span>
            </a>
            <a href="tel:+34638332989" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#fff" }}>
              <span style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <span>
                <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,.55)" }}>Llámame</span>
                <span style={{ fontFamily: "var(--font-space)", fontWeight: 600, fontSize: 17 }}>+34 638 332 989</span>
              </span>
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {sent ? (
            <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(57,211,156,.4)", borderRadius: 22, padding: "48px 34px", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(57,211,156,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="var(--emerald)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 style={{ fontFamily: "var(--font-space)", fontSize: 22, color: "#fff", margin: 0 }}>¡Mensaje enviado!</h3>
              <p style={{ color: "rgba(255,255,255,.65)", margin: "12px 0 0", fontSize: 15.5 }}>Gracias. Te respondo en menos de 24 horas.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 22, padding: "30px 28px", display: "flex", flexDirection: "column", gap: 16, backdropFilter: "blur(8px)" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <span style={{ fontFamily: "var(--font-space)", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.7)" }}>Nombre</span>
                <input
                  ref={nameRef}
                  required type="text" placeholder="Tu nombre"
                  style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 11, padding: "13px 15px", color: "#fff", fontSize: 15, outline: "none", transition: "border-color .2s" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,.15)")}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <span style={{ fontFamily: "var(--font-space)", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.7)" }}>Email</span>
                <input
                  ref={emailRef}
                  required type="email" placeholder="tu@email.com"
                  style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 11, padding: "13px 15px", color: "#fff", fontSize: 15, outline: "none", transition: "border-color .2s" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,.15)")}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <span style={{ fontFamily: "var(--font-space)", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.7)" }}>¿Qué necesitas?</span>
                <textarea
                  ref={messageRef}
                  rows={4} placeholder="Cuéntame brevemente tu proyecto..."
                  style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 11, padding: "13px 15px", color: "#fff", fontSize: 15, outline: "none", resize: "vertical", transition: "border-color .2s" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,.15)")}
                />
              </label>
              {error && (
                <p style={{ color: "#ff6b6b", fontSize: 13.5, margin: 0 }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{ marginTop: 6, background: "var(--accent)", color: "var(--navy-deep)", fontWeight: 700, fontSize: 16, border: "none", padding: 15, borderRadius: 11, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, transition: "transform .2s ease, box-shadow .2s ease" }}
                onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 30px rgba(57,211,156,.45)"; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {loading ? "Enviando…" : "Enviar mensaje"}
                {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            </form>
          )}
        </motion.div>

      </div>
    </section>
  );
}
