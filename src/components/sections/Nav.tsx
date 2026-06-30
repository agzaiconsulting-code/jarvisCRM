"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";

const links = [
  { label: "Servicios", href: "#servicios" },
  { label: "Proceso", href: "#proceso" },
  { label: "Sobre AGZAI", href: "#sobre" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      id="agzai-nav"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        transition: "background .4s ease, box-shadow .4s ease, border-color .4s ease",
        borderBottom: `1px solid ${scrolled ? "rgba(10,28,102,.08)" : "transparent"}`,
        background: scrolled ? "rgba(245,245,243,.82)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled ? "0 1px 0 rgba(10,28,102,.06), 0 8px 30px rgba(10,28,102,.06)" : "none",
      }}
      aria-label="Navegación principal"
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <a href="#top" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image src="/logo.jpeg" alt="AGZAI logo" width={90} height={90} style={{ borderRadius: 12, objectFit: "contain" }} priority />
        </a>

        {/* Desktop */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 34 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{ textDecoration: "none", color: "var(--navy)", fontSize: 15, fontWeight: 500, opacity: .78, transition: "opacity .2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = ".78")}
              >
                {l.label}
              </a>
            ))}
          </div>
          <a
            href="#contacto"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 9, background: "var(--navy)", color: "#fff", fontWeight: 600, fontSize: 14.5, padding: "12px 20px", borderRadius: 999, transition: "transform .25s ease, box-shadow .25s ease", boxShadow: "0 6px 18px rgba(10,28,102,.18)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 28px rgba(10,28,102,.28)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(10,28,102,.18)"; }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", animation: "blink 2s ease-in-out infinite" }} />
            Reservar llamada
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden"
          style={{ padding: 8, color: "var(--navy)", background: "none", border: "none", cursor: "pointer" }}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden"
          style={{ background: "rgba(245,245,243,.95)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--line)", padding: "16px 32px 24px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{ textDecoration: "none", color: "var(--navy)", fontSize: 15, fontWeight: 500 }}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#contacto"
              onClick={() => setOpen(false)}
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 9, background: "var(--navy)", color: "#fff", fontWeight: 600, fontSize: 14.5, padding: "12px 20px", borderRadius: 999, marginTop: 8, width: "fit-content" }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", animation: "blink 2s ease-in-out infinite" }} />
              Reservar llamada
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
