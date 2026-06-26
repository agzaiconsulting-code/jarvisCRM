import { CalendarDays, MessageCircle } from "lucide-react";

export default function CTAFinal() {
  return (
    <section
      id="contacto"
      className="relative bg-navy py-28 lg:py-40 overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#F7F5F0 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />

      {/* Accent circle */}
      <div
        className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ backgroundColor: "#10B981" }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto px-6 lg:px-10 text-center">
        <span
          className="inline-block text-xs tracking-widest text-emerald uppercase mb-6"
          style={{ fontFamily: "var(--font-jetbrains)" }}
        >
          07 — Hablemos
        </span>

        <h2
          id="cta-heading"
          className="text-4xl md:text-5xl lg:text-6xl text-cream tracking-tight leading-tight mb-6"
          style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700 }}
        >
          30 minutos.
          <br />
          <em className="not-italic" style={{ color: "#10B981" }}>
            Sin compromiso.
          </em>
        </h2>

        <p
          className="text-cream/50 text-lg leading-relaxed max-w-[44ch] mx-auto mb-10"
          style={{ fontFamily: "var(--font-geist)" }}
        >
          Cuéntame en qué estás trabajando esta semana. Si puedo ayudarte, te
          lo digo. Si no, también.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* TODO: AGZAI - replace with real Cal.com booking URL */}
          <a
            href="https://cal.com/agzai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-emerald text-navy font-semibold text-sm hover:bg-cyan-accent active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream"
            style={{ fontFamily: "var(--font-geist)" }}
          >
            <CalendarDays size={17} strokeWidth={2} aria-hidden="true" />
            Agenda en Cal.com
          </a>

          {/* TODO: AGZAI - replace 34600000000 with real WhatsApp number */}
          <a
            href="https://wa.me/34600000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full border border-cream/25 text-cream/80 font-medium text-sm hover:border-cream/50 hover:text-cream active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
            style={{ fontFamily: "var(--font-geist)" }}
          >
            <MessageCircle size={17} strokeWidth={2} aria-hidden="true" />
            WhatsApp directo
          </a>
        </div>
      </div>
    </section>
  );
}
