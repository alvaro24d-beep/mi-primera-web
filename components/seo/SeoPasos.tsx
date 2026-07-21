"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGlassPanels } from "@/hooks/useGlassPanels";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useCurvedWords } from "@/hooks/useCurvedWords";

gsap.registerPlugin(ScrollTrigger);

// Sección pineada (no recorrido vertical): mientras el scroll avanza, TU
// POSICIÓN en Google baja de #47 a #1 en un contador gigante con anillo de
// progreso, y los tres pasos del método se relevan en el mismo sitio con
// crossfade+blur (el patrón de facetas de la hero de /desarrollo-web). Los
// dos paneles son cristal volumétrico REAL de la escena global — el id
// nxr-seo-pasos está registrado en alwaysIds (SceneCanvas.tsx).

const PASOS = [
  {
    num: "01",
    titulo: "Auditoría y estrategia",
    desc: "Analizamos tu web, tu competencia y las búsquedas reales de tus clientes para saber exactamente dónde atacar.",
    pos: "#47",
  },
  {
    num: "02",
    titulo: "Optimización técnica y contenido",
    desc: "Velocidad, estructura y contenido que Google entiende y premia — cada página afinada para su búsqueda.",
    pos: "#12",
  },
  {
    num: "03",
    titulo: "Autoridad y crecimiento",
    desc: "Enlaces, reputación y medición continua. Posiciones que se ganan y se defienden mes a mes.",
    pos: "#1",
  },
];

const RING_R = 118;
const RING_LEN = 2 * Math.PI * RING_R;

export default function SeoPasos() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const reducedMotion = useReducedMotion();

  // Cristal volumétrico de la escena global detrás del badge y de la card
  // de pasos (mismo puente de anclas que Intro/Proceso/Tech).
  useGlassPanels(sectionRef, ".nxr-seo-glass", "#12141c", [reducedMotion]);

  // Título unificado con la home (V16.41): bow dinámico sobre los spans del
  // reveal; el tilt vive en el tier wide-block de globals.css.
  useCurvedWords(sectionRef, ".nxr-section-h2", "left", [reducedMotion], {
    bowOnly: true,
    useExistingWords: true,
  });

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;

      const q = gsap.utils.selector(section);
      const pasos = q(".nxr-seo-paso") as HTMLElement[];
      const num = q(".nxr-seo-pos-num")[0] as HTMLElement | undefined;
      const ring = q(".nxr-seo-ring-fill")[0] as unknown as SVGCircleElement | undefined;
      if (!pasos.length) return;

      // Estado inicial: solo el paso 1 visible.
      gsap.set(pasos, { autoAlpha: 0, y: 14, filter: "blur(6px)" });
      gsap.set(pasos[0], { autoAlpha: 1, y: 0, filter: "blur(0px)" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => (window.innerWidth < 768 ? "+=220%" : "+=300%"),
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Contador de posición: quieto mientras un paso se lee, baja durante
      // cada relevo (los holds de ~1 unidad ≈ 88vh desktop / 65vh móvil
      // respetan la regla de legibilidad con scroll normal).
      const pos = { v: 47 };
      const renderPos = () => {
        if (num) num.textContent = `#${Math.max(1, Math.round(pos.v))}`;
      };
      renderPos();

      const swap = (from: number, to: number, at: number) => {
        tl.to(pasos[from], { autoAlpha: 0, y: -14, filter: "blur(6px)", duration: 0.28, ease: "power1.in" }, at);
        tl.fromTo(
          pasos[to],
          { autoAlpha: 0, y: 14, filter: "blur(6px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.3, ease: "power1.out" },
          at + 0.22
        );
      };

      swap(0, 1, 1.0);
      tl.to(pos, { v: 12, duration: 0.4, ease: "power1.inOut", onUpdate: renderPos }, 0.95);
      swap(1, 2, 2.15);
      tl.to(pos, { v: 1, duration: 0.4, ease: "power1.inOut", onUpdate: renderPos }, 2.1);
      // Coronación del #1: pop + lima.
      tl.to(num ?? {}, { color: "#a8f04a", scale: 1.12, duration: 0.3, ease: "back.out(2)" }, 2.55);
      tl.to(num ?? {}, { scale: 1, duration: 0.3, ease: "power2.out" }, 2.9);

      if (ring) {
        tl.fromTo(
          ring,
          { strokeDashoffset: RING_LEN },
          { strokeDashoffset: 0, duration: 3.3, ease: "none" },
          0
        );
      }

      // Hold final para que el pin suelte con el #1 en pantalla.
      tl.to({}, { duration: 0.45 }, 3.3);
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  if (reducedMotion) {
    return (
      <section key="static" id="nxr-seo-pasos" ref={sectionRef} className="nxr-seo-pasos-static">
        <div className="nxr-seo-pasos-header">
          <h2 className="nxr-section-h2" ref={titleRef}>
            De invisible <span className="nxr-gradient-text-lime">al primer puesto.</span>
          </h2>
        </div>
        <div className="nxr-seo-pasos-static-list">
          {PASOS.map((p) => (
            <div key={p.num} className="nxr-seo-glass nxr-seo-paso-static">
              <span className="nxr-seo-paso-num">{p.num}</span>
              <span className="nxr-seo-paso-pos">{p.pos}</span>
              <h3 className="nxr-seo-paso-titulo">{p.titulo}</h3>
              <p className="nxr-seo-paso-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section key="animated" id="nxr-seo-pasos" ref={sectionRef}>
      <div className="nxr-seo-pasos-stage" ref={stageRef}>
        <div className="nxr-seo-pasos-header">
          <h2 className="nxr-section-h2" ref={titleRef}>
            De invisible <span className="nxr-gradient-text-lime">al primer puesto.</span>
          </h2>
        </div>

        <div className="nxr-seo-pasos-grid">
          <div className="nxr-seo-pos nxr-seo-glass">
            <span className="nxr-seo-pos-label">Tu posición en Google</span>
            <svg className="nxr-seo-ring" viewBox="0 0 260 260" aria-hidden="true">
              <circle className="nxr-seo-ring-track" cx="130" cy="130" r={RING_R} />
              <circle
                className="nxr-seo-ring-fill"
                cx="130"
                cy="130"
                r={RING_R}
                strokeDasharray={RING_LEN}
                strokeDashoffset={RING_LEN}
              />
            </svg>
            <span className="nxr-seo-pos-num">#47</span>
          </div>

          <div className="nxr-seo-paso-card nxr-seo-glass">
            {PASOS.map((p) => (
              <div key={p.num} className="nxr-seo-paso">
                <span className="nxr-seo-paso-num">{p.num}</span>
                <h3 className="nxr-seo-paso-titulo">{p.titulo}</h3>
                <p className="nxr-seo-paso-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
