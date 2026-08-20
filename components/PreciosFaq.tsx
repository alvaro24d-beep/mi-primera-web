"use client";

// Página /precios: las respuestas claras sobre presupuesto, plazos, alcance
// internacional y forma de pago — en el lenguaje de la casa (cards con
// desenfoque de fondo + reveals de RevealInit). Se consultó el catálogo
// (21st.dev) y sus componentes de pricing son tablas de planes por niveles —
// no encajan con una página de política de precios; las FAQ-cards propias
// mantienen la identidad.

import { useRef } from "react";
import { useTitleReveal } from "@/hooks/useTitleReveal";

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
  const titleRef = useTitleReveal<HTMLHeadingElement>();

  // Título UNIFICADO con la home (V16.41, "los títulos tienen que estar
  // unificados"): mismo reveal por palabras (useTitleReveal), mismo bow
  // dinámico y mismo tilt (el tier wide-block de globals.css) — solo
  // cambian las letras.

  // V18.44: estas cards YA NO llevan cristal volumétrico del canvas global.
  // Pasan al mismo acabado que las de "Un proceso claro, sin sorpresas"
  // (.nxr-paso-card): fondo semitransparente + backdrop-filter. Con ello se
  // retira el useGlassPanels y, como la sección se queda sin ningún mesh
  // registrado, también su id del alwaysIds de SceneCanvas — dejarlo allí
  // mantendría el frameloop en `always` para dibujar cristal que ya no
  // existe (mismo caso que nxr-dwh-proceso en V17.99).

  return (
    <section id="nxr-precios" ref={sectionRef}>
      <div className="nxr-precios-inner">
        <h1 className="nxr-section-h2" ref={titleRef}>
          Claridad antes de empezar.
        </h1>
        <p className="nxr-precios-intro nxr-reveal">
          Sin tarifas genéricas: cada sistema se presupuesta a medida. Esto es lo que siempre puedes esperar de
          trabajar con nosotros.
        </p>
        <div className="nxr-precios-grid">
          {FAQS.map((f, i) => (
            // El `nxr-reveal` va en el CONTENIDO, no en la card. Es el mismo
            // patrón que .nxr-paso-card y por el mismo motivo: el reveal anima
            // opacity y transform, y cualquiera de los dos sobre el elemento
            // que lleva el backdrop-filter le rompe el desenfoque. La card se
            // queda quieta y lo que entra es lo de dentro.
            <div key={f.q} className="nxr-precios-card">
              <div className="nxr-precios-card-inner nxr-reveal">
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
