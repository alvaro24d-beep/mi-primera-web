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

// Cierre de la historia: la gráfica estilo Search Console (la misma
// iconografía que la card de SEO del reel de la home) se DIBUJA al entrar en
// pantalla, con los contadores subiendo en tiempo real. Se rebobina al salir
// por arriba para poder reproducirse otra vez. El panel es cristal
// volumétrico de la escena global (id nxr-seo-resultados en alwaysIds).

const CHIPS = [
  { val: 180, sufijo: "%", prefijo: "+", label: "más clics desde Google" },
  { val: 12, sufijo: " sem", prefijo: "", label: "de media hasta el top 3" },
  { val: 40, sufijo: "+", prefijo: "", label: "búsquedas en el top 10" },
];

export default function SeoResultados() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const reducedMotion = useReducedMotion();

  useGlassPanels(sectionRef, ".nxr-seo-res-glass", "#12141c", [reducedMotion]);
  // "left": el bloque va alineado a la izquierda — con "right" se veía "al
  // revés" (la parte derecha distorsionada). tiltDesktop 7 como el bloque
  // de Contacto (la misma anchura de párrafo): con el 12° por defecto la
  // proyección se escapaba del contenedor hasta el borde del viewport.
  useCurvedWords(sectionRef, ".nxr-seo-res-intro", "left", [], { tiltDesktop: 7 });

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      if (!section) return;
      const q = gsap.utils.selector(section);
      const lines = q(".nxr-seo-gsc-line") as unknown as SVGPathElement[];
      const areas = q(".nxr-seo-gsc-area") as unknown as SVGPathElement[];
      const chipVals = q(".nxr-seo-chip-val") as HTMLElement[];

      const draw = () => {
        lines.forEach((l, i) => {
          const len = l.getTotalLength();
          gsap.fromTo(
            l,
            { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: 1.5, delay: i * 0.15, ease: "power2.out", overwrite: "auto" }
          );
        });
        gsap.fromTo(areas, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 1.0, ease: "none", overwrite: "auto" });
        chipVals.forEach((el, i) => {
          const chip = CHIPS[i];
          if (!chip) return;
          const proxy = { v: 0 };
          gsap.to(proxy, {
            v: chip.val,
            duration: 1.4,
            delay: 0.3 + i * 0.15,
            ease: "power1.out",
            overwrite: "auto",
            onUpdate: () => {
              el.textContent = `${chip.prefijo}${Math.round(proxy.v)}${chip.sufijo}`;
            },
          });
        });
      };
      const reset = () => {
        gsap.killTweensOf([...lines, ...areas]);
        lines.forEach((l) => {
          const len = l.getTotalLength();
          gsap.set(l, { strokeDasharray: len, strokeDashoffset: len });
        });
        gsap.set(areas, { opacity: 0 });
        chipVals.forEach((el, i) => {
          const chip = CHIPS[i];
          if (chip) el.textContent = `${chip.prefijo}0${chip.sufijo}`;
        });
      };

      reset();
      ScrollTrigger.create({
        trigger: q(".nxr-seo-res-panel")[0] as HTMLElement,
        start: "top 78%",
        onEnter: draw,
        onLeaveBack: reset,
      });
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-seo-resultados" ref={sectionRef}>
      <div className="nxr-seo-res-inner">
        <div className="nxr-seo-res-header">
          <h2 className="nxr-section-h2" ref={titleRef}>
            Visibilidad que se <span className="nxr-gradient-text-salmon">mide en clientes.</span>
          </h2>
          <p className="nxr-seo-res-intro nxr-reveal">
            No perseguimos rankings por vanidad: cada posición ganada se traduce en visitas que llaman, escriben y
            compran. Esto es lo que ve un cliente nuestro en su Search Console.
          </p>
        </div>

        <div className="nxr-seo-res-panel nxr-seo-res-glass nxr-reveal">
          <div className="nxr-seo-gsc-head">
            <span className="nxr-seo-gsc-dot" style={{ background: "var(--c-lime)" }} />
            <span className="nxr-seo-gsc-leg">Clics</span>
            <span className="nxr-seo-gsc-dot" style={{ background: "var(--c-salmon)" }} />
            <span className="nxr-seo-gsc-leg">Impresiones</span>
            <span className="nxr-seo-gsc-rango">Últimos 12 meses</span>
          </div>
          <svg className="nxr-seo-gsc" viewBox="0 0 640 220" preserveAspectRatio="none" aria-hidden="true">
            <g className="nxr-seo-gsc-grid">
              <line x1="0" y1="55" x2="640" y2="55" />
              <line x1="0" y1="110" x2="640" y2="110" />
              <line x1="0" y1="165" x2="640" y2="165" />
            </g>
            <path
              className="nxr-seo-gsc-area is-impr"
              d="M0,196 C90,188 150,172 220,150 C300,124 360,104 430,84 C500,66 570,44 640,30 L640,220 L0,220 Z"
            />
            <path
              className="nxr-seo-gsc-area is-clics"
              d="M0,208 C90,204 160,196 230,180 C310,162 380,138 460,112 C530,90 590,72 640,58 L640,220 L0,220 Z"
            />
            <path
              className="nxr-seo-gsc-line is-impr"
              d="M0,196 C90,188 150,172 220,150 C300,124 360,104 430,84 C500,66 570,44 640,30"
              fill="none"
            />
            <path
              className="nxr-seo-gsc-line is-clics"
              d="M0,208 C90,204 160,196 230,180 C310,162 380,138 460,112 C530,90 590,72 640,58"
              fill="none"
            />
          </svg>
        </div>

        <div className="nxr-seo-chips">
          {CHIPS.map((c) => (
            <div key={c.label} className="nxr-seo-chip nxr-seo-res-glass nxr-reveal">
              <span className="nxr-seo-chip-val">{`${c.prefijo}${reducedMotion ? c.val : 0}${c.sufijo}`}</span>
              <span className="nxr-seo-chip-label">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
