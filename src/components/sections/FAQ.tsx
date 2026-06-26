"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Plus, X } from "lucide-react";

const faqs = [
  {
    q: "¿Cuánto cuesta?",
    a: "Depende de qué necesitas, pero para que tengas referencia: una landing desde 900€, una web con backend desde 2.500€, un agente IA con WhatsApp desde 1.800€. Mantenimiento mensual desde 150€/mes. Nada de precios por hora: presupuesto cerrado antes de empezar.",
  },
  {
    q: "¿Cuánto tarda?",
    a: "Una landing: 1-2 semanas. Una web compleja: 4-8 semanas. Un agente IA: 3-4 semanas. No prometo lo que no puedo cumplir, así que si el plazo no te conviene, mejor decirlo antes que a mitad de proyecto.",
  },
  {
    q: "¿Hay soporte después de la entrega?",
    a: "Sí. No soy de los que entregan y desaparecen. Tengo planes de mantenimiento mensual desde 150€/mes y también puedo ayudarte puntualmente si surge algo concreto. Lo que no va a pasar es que te quedes solo con un proyecto sin documentar.",
  },
  {
    q: "¿Por qué tú y no una agencia?",
    a: "Porque hablas conmigo, no con tres intermediarios que no saben qué hay debajo del capó. Porque vengo de QA: entrego código probado, no demos que se caen en producción. Y porque soy más ágil y más barato que una agencia, sin sacrificar calidad técnica.",
  },
  {
    q: "¿Trabajas en remoto?",
    a: "Sí, 100% remoto. Trabajo con clientes de toda España y también de LATAM y Europa. Una videollamada de 30 minutos es suficiente para arrancar. Si quieres quedar en persona y estás en Madrid, también.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="faq"
      className="bg-cream py-28 lg:py-40"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-[1440px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20">
          {/* Left: heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span
              className="text-xs tracking-widest text-emerald uppercase"
              style={{ fontFamily: "var(--font-jetbrains)" }}
            >
              06 — FAQ
            </span>
            <h2
              id="faq-heading"
              className="mt-3 text-4xl lg:text-5xl text-navy tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700 }}
            >
              Preguntas que me hacen casi siempre.
            </h2>
          </motion.div>

          {/* Right: accordion */}
          <div ref={ref} className="flex flex-col divide-y divide-navy/10">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.07 }}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-start justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald rounded-sm"
                  aria-expanded={open === i}
                  aria-controls={`faq-answer-${i}`}
                  id={`faq-question-${i}`}
                >
                  <span
                    className="text-base font-medium text-navy leading-snug"
                    style={{ fontFamily: "var(--font-geist)" }}
                  >
                    {faq.q}
                  </span>
                  <span
                    className="flex-shrink-0 mt-0.5 text-navy/40 transition-colors duration-200"
                    aria-hidden="true"
                  >
                    {open === i ? <X size={18} /> : <Plus size={18} />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      role="region"
                      aria-labelledby={`faq-question-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.2 },
                      }}
                      style={{ overflow: "hidden" }}
                    >
                      <p
                        className="pb-5 text-navy/60 text-[0.925rem] leading-relaxed max-w-[55ch]"
                        style={{ fontFamily: "var(--font-geist)" }}
                      >
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
