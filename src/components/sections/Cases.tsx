"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const cases = [
  {
    name: "Casa Cervantes",
    tag: "Plataforma de reservas",
    description:
      "Sistema de reservas familiar para una casa de vacaciones compartida entre 10 familias. Gestión de turnos anuales, auditoría de cambios y panel contable integrado.",
    metric: "80+",
    metricLabel: "usuarios activos en producción",
    stack: ["Next.js", "Supabase", "Clerk", "Resend", "Vercel"],
    accent: "#10B981",
  },
  {
    name: "Padel Club",
    tag: "Reservas + Agente IA",
    description:
      "Reserva de pistas con un agente conversacional en WhatsApp que empareja jugadores por nivel y disponibilidad. Cero intervención humana para el 90% de las consultas.",
    metric: "24/7",
    metricLabel: "agente conversacional activo",
    stack: ["Next.js", "Supabase", "Make", "WhatsApp Business API"],
    accent: "#22D3EE",
  },
];

export default function Cases() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="proyectos"
      className="bg-cream py-28 lg:py-40"
      aria-labelledby="proyectos-heading"
    >
      <div className="max-w-[1440px] mx-auto px-8 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <span
            className="text-xs tracking-widest text-emerald uppercase"
            style={{ fontFamily: "var(--font-jetbrains)" }}
          >
            03 — Proyectos
          </span>
          <h2
            id="proyectos-heading"
            className="mt-3 text-4xl lg:text-5xl text-navy tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700 }}
          >
            Proyectos reales.
            <br />
            <em
              className="not-italic text-navy/35"
              style={{ fontWeight: 300 }}
            >
              Sin demos ni capturas inventadas.
            </em>
          </h2>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
          {cases.map((c, i) => (
            <motion.article
              key={c.name}
              initial={{ opacity: 0, x: i === 0 ? -24 : 24 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: i * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative bg-beige rounded-2xl p-8 lg:p-10 border border-navy/8 hover:border-navy/20 transition-all duration-300 flex flex-col justify-between min-h-[320px]"
              aria-labelledby={`case-${i}-name`}
            >
              {/* Tag */}
              <div className="flex items-start justify-between mb-6">
                <span
                  className="text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-full border"
                  style={{
                    fontFamily: "var(--font-jetbrains)",
                    color: c.accent,
                    borderColor: `${c.accent}40`,
                    backgroundColor: `${c.accent}0d`,
                  }}
                >
                  {c.tag}
                </span>
                <ArrowUpRight
                  size={18}
                  className="text-navy/25 group-hover:text-navy/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
                  aria-hidden="true"
                />
              </div>

              {/* Name + description */}
              <div className="flex-1">
                <h3
                  id={`case-${i}-name`}
                  className="text-2xl font-bold text-navy mb-3"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {c.name}
                </h3>
                <p
                  className="text-navy/55 text-sm leading-relaxed"
                  style={{ fontFamily: "var(--font-geist)" }}
                >
                  {c.description}
                </p>
              </div>

              {/* Metric highlight */}
              <div className="mt-8 pt-6 border-t border-navy/10">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <span
                      className="text-5xl font-bold tabular-nums"
                      style={{
                        fontFamily: "var(--font-fraunces)",
                        color: c.accent,
                      }}
                    >
                      {c.metric}
                    </span>
                    <p
                      className="text-xs text-navy/45 mt-1"
                      style={{ fontFamily: "var(--font-geist)" }}
                    >
                      {c.metricLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.stack.map((tech) => (
                      <span
                        key={tech}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-navy/6 text-navy/50 border border-navy/10"
                        style={{ fontFamily: "var(--font-jetbrains)" }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
