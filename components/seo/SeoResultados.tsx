"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGlassPanels } from "@/hooks/useGlassPanels";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useCurvedWords } from "@/hooks/useCurvedWords";

gsap.registerPlugin(ScrollTrigger);

// Cierre de la historia (V16.38): capturas REALES de Search Console (las
// tres gráficas de /public) en vez de la gráfica dibujada. Se integran en el
// cristal con invert+hue-rotate+blend screen: el fondo blanco desaparece y
// quedan las líneas brillando sobre el liquid glass. Los contadores de los
// chips siguen subiendo al entrar. El panel es cristal volumétrico de la
// escena global (id nxr-seo-resultados en alwaysIds).

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
      const chipVals = q(".nxr-seo-chip-val") as HTMLElement[];
      const shots = q(".nxr-seo-shot") as HTMLElement[];

      const draw = () => {
        gsap.fromTo(
          shots,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.18, ease: "power2.out", overwrite: "auto" }
        );
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
        gsap.killTweensOf(shots);
        gsap.set(shots, { autoAlpha: 0, y: 18 });
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
          <div className="nxr-seo-shots">
            <Image
              className="nxr-seo-shot -big"
              src="/gsc-1.png"
              alt="Gráfica real de Search Console: clics e impresiones creciendo mes a mes"
              width={1229}
              height={405}
            />
            <Image
              className="nxr-seo-shot"
              src="/gsc-2.png"
              alt="Gráfica real de Search Console de un segundo proyecto"
              width={1227}
              height={412}
            />
            <Image
              className="nxr-seo-shot"
              src="/gsc-3.png"
              alt="Gráfica real de Search Console de un tercer proyecto"
              width={1225}
              height={410}
            />
          </div>
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
