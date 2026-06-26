"use client";

import Logo from "@/components/ui/Logo";

const links = [
  { label: "Servicios", href: "#servicios" },
  { label: "Proceso", href: "#proceso" },
  { label: "Sobre AGZAI", href: "#sobre" },
  { label: "Contacto", href: "#contacto" },
];

export default function Footer() {
  return (
    <footer
      style={{ position: "relative", zIndex: 1, background: "var(--navy-deep)", padding: "50px 32px 40px", borderTop: "1px solid rgba(255,255,255,.08)" }}
      aria-label="Pie de página"
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexWrap: "wrap" as const, alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo size={28} light />
          <span style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: 24, letterSpacing: ".14em", color: "#fff" }}>AGZAI</span>
        </div>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" as const }}>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{ textDecoration: "none", color: "rgba(255,255,255,.6)", fontSize: 14.5, transition: "color .2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.6)")}
            >
              {l.label}
            </a>
          ))}
        </div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.4)" }}>© 2026 AGZAI · Consultoría de IA</div>
      </div>
    </footer>
  );
}
