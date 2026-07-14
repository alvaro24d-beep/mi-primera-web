"use client";

import { useRef } from "react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCurvedWords } from "@/hooks/useCurvedWords";
import { useGlassPanels } from "@/hooks/useGlassPanels";

const CASOS = [
  {
    title: "Atención al cliente 24/7",
    desc: "Responde dudas al momento, de día y de noche, sin colas ni esperas.",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    title: "Reservas y citas",
    desc: "Consulta tu agenda real, reserva el hueco y envía la confirmación él solo.",
    color: "var(--c-salmon)",
    bg: "rgba(255,157,125,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M3 9h18M8 2v4M16 2v4M12 13v5M9.5 15.5h5" />
      </svg>
    ),
  },
  {
    title: "Cualificación de leads",
    desc: "Hace las preguntas clave, puntúa cada contacto y te pasa solo los que valen.",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z" />
      </svg>
    ),
  },
  {
    title: "Ventas que se escapaban",
    desc: "Retoma carritos abandonados y presupuestos sin responder, y los recupera.",
    color: "var(--c-salmon)",
    bg: "rgba(255,157,125,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="9" cy="21" r="1.5" />
        <circle cx="19" cy="21" r="1.5" />
        <path d="M2 3h3l2.6 12.5a2 2 0 002 1.5h8.8a2 2 0 002-1.6L22 8H6" />
      </svg>
    ),
  },
  {
    title: "Multicanal de verdad",
    desc: "El mismo agente en tu web, WhatsApp e Instagram, con una sola memoria.",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
      </svg>
    ),
  },
  {
    title: "Conectado a tus sistemas",
    desc: "CRM, agenda, email, base de datos: actúa sobre las herramientas que ya usas.",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 3L3 8.5v7L12 21l9-5.5v-7L12 3z" />
        <path d="M12 12l9-3.5M12 12L3 8.5M12 12v9" />
      </svg>
    ),
  },
];

/**
 * Use-case grid for /agentes-ia: every card is a volumetric fluid-glass
 * anchor (global SceneCanvas — `nxr-aia-casos` is in its alwaysIds), title
 * gets the house reveal + dynamic per-line bow. Deliberately NOT another
 * pinned deck (that's /desarrollo-web's Capacidades gesture — each service
 * page keeps its own motion identity per AGENTS.md).
 */
export default function AgentesIaCasos() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useGlassPanels(sectionRef, ".nxr-aia-caso", "#12141c", [reducedMotion]);
  useCurvedWords(sectionRef, ".nxr-section-h2", "left", [reducedMotion], {
    bowOnly: true,
    useExistingWords: true,
  });

  return (
    <section id="nxr-aia-casos" className="nxr-aia-casos" ref={sectionRef}>
      <div className="nxr-reveal">
        <h2 className="nxr-section-h2" ref={titleRef}>
          Un agente para cada parte <span className="nxr-gradient-text-lime">de tu negocio.</span>
        </h2>
      </div>

      <div className="nxr-aia-casos-grid">
        {CASOS.map((c, i) => (
          <div key={c.title} className="nxr-aia-caso nxr-reveal" style={{ transitionDelay: `${(i % 3) * 90}ms` }}>
            <span className="nxr-aia-caso-inner">
              <span className="nxr-aia-caso-icon" style={{ background: c.bg, color: c.color }}>
                {c.icon}
              </span>
              <span className="nxr-aia-caso-title">{c.title}</span>
              <span className="nxr-aia-caso-desc">{c.desc}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
