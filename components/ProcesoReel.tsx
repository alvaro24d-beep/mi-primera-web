"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const STEPS = [
  {
    n: "01",
    title: "Descubrimiento",
    desc: "Entendemos tu negocio, tus objetivos y a tus usuarios antes de escribir una línea de código.",
  },
  {
    n: "02",
    title: "Diseño UX/UI",
    desc: "Prototipamos la experiencia y el diseño visual alineados con tu marca.",
  },
  {
    n: "03",
    title: "Desarrollo",
    desc: "Construimos con código limpio, componentes reutilizables y buenas prácticas.",
  },
  {
    n: "04",
    title: "Testing & QA",
    desc: "Probamos en dispositivos reales y revisamos rendimiento y accesibilidad.",
  },
  {
    n: "05",
    title: "Lanzamiento",
    desc: "Publicamos, monitorizamos y te acompañamos en la primera fase en producción.",
  },
];

function StepCards() {
  return (
    <>
      {STEPS.map((s) => (
        <div key={s.n} className="nxr-dwh-step-card nxr-glass-edge">
          <span className="nxr-glass-edge-content nxr-dwh-step-inner">
            <span className="nxr-dwh-step-num">{s.n}</span>
            <span className="nxr-dwh-step-title">{s.title}</span>
            <span className="nxr-dwh-step-desc">{s.desc}</span>
          </span>
        </div>
      ))}
    </>
  );
}

export default function ProcesoReel() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      const sticky = stickyRef.current;
      const track = trackRef.current;
      if (!section || !sticky || !track) return;

      // `width: max-content` means the track never "overflows itself" —
      // compare against the sticky container's viewport-constrained width.
      const amount = () => Math.max(0, track.scrollWidth - sticky.clientWidth);

      gsap.to(track, {
        x: () => -amount(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${amount()}`,
          scrub: 1,
          pin: sticky,
          invalidateOnRefresh: true,
        },
      });
    },
    { dependencies: [reducedMotion] }
  );

  if (reducedMotion) {
    return (
      // See DesarrolloWebHero.tsx for why this needs a distinct `key`: GSAP's
      // pin-spacer, inserted outside React's tracking, corrupts reconciliation
      // if React tries to diff into it instead of fully remounting.
      <section key="static" id="nxr-dwh-proceso" className="nxr-dwh-proceso nxr-dwh-proceso-static">
        <div>
          <p className="nxr-section-label">Proceso</p>
          <h2 className="nxr-section-h2">
            De la idea al <span className="nxr-gradient-text-salmon">lanzamiento.</span>
          </h2>
        </div>
        <div className="nxr-dwh-step-list">
          <StepCards />
        </div>
      </section>
    );
  }

  return (
    <section id="nxr-dwh-proceso" className="nxr-dwh-proceso" ref={sectionRef}>
      <div className="nxr-dwh-proceso-sticky" ref={stickyRef}>
        <div className="nxr-reveal nxr-dwh-proceso-head">
          <p className="nxr-section-label">Proceso</p>
          <h2 className="nxr-section-h2">
            De la idea al <span className="nxr-gradient-text-salmon">lanzamiento.</span>
          </h2>
        </div>
        <div className="nxr-dwh-proceso-track" ref={trackRef}>
          <StepCards />
        </div>
      </div>
    </section>
  );
}
