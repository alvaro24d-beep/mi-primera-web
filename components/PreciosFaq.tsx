"use client";

// Página /precios: las respuestas claras sobre presupuesto, plazos, alcance
// internacional y forma de pago — en el lenguaje de la casa (cards de
// cristal volumétrico del canvas global + reveals de RevealInit). Se
// consultó el catálogo (21st.dev) y sus componentes de pricing son tablas
// de planes por niveles — no encajan con una página de política de precios;
// las FAQ-cards de cristal propias mantienen la identidad.

import { useRef } from "react";
import { useGlassPanels } from "@/hooks/useGlassPanels";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const FAQS = [
  {
    q: "¿Dais precios por adelantado?",
    a: "No — y es deliberado. Cada proyecto es único: el presupuesto se define tras entender tu negocio, el alcance y las integraciones que necesitas. Antes de empezar recibes una propuesta cerrada, sin sorpresas después.",
    color: "var(--c-red)",
  },
  {
    q: "¿Cuánto se tarda en entregar un proyecto?",
    a: "Entre 4 y 8 semanas, según el alcance. Desde el primer día sabes en qué fase está tu proyecto y qué llega en la siguiente.",
    color: "var(--c-lime)",
  },
  {
    q: "¿Trabajáis con clientes internacionales?",
    a: "Sí. Trabajamos en remoto con clientes de cualquier país — reuniones por videollamada, comunicación continua y entregas online.",
    color: "var(--c-salmon)",
  },
  {
    q: "¿Cómo se paga?",
    a: "En dos mitades: el 50% al comenzar el proyecto y el 50% restante con la entrega. Sin cuotas ocultas ni costes imprevistos.",
    color: "var(--c-lime)",
  },
];

export default function PreciosFaq() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  // Cristal volumétrico del canvas global sobre cada card (las anclas DOM
  // son cáscaras transparentes; "nxr-precios" está en alwaysIds de
  // SceneCanvas — sin eso los meshes quedarían invisibles para siempre).
  useGlassPanels(sectionRef, ".nxr-precios-card", "#10141c", [reducedMotion]);

  return (
    <section id="nxr-precios" ref={sectionRef}>
      <div className="nxr-precios-inner">
        <span className="nxr-section-label nxr-reveal">Precios</span>
        <h1 className="nxr-section-h2 nxr-reveal">Claridad antes de empezar.</h1>
        <p className="nxr-precios-intro nxr-reveal">
          Sin tarifas genéricas: cada sistema se presupuesta a medida. Esto es lo que siempre puedes esperar de
          trabajar con nosotros.
        </p>
        <div className="nxr-precios-grid">
          {FAQS.map((f, i) => (
            <div key={f.q} className="nxr-precios-card nxr-reveal">
              <div className="nxr-precios-card-inner">
                <span className="nxr-precios-num" style={{ color: f.color }}>
                  0{i + 1}
                </span>
                <h2 className="nxr-precios-q">{f.q}</h2>
                <p className="nxr-precios-a">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
