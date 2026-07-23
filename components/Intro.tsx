"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { scrambleElement } from "@/hooks/useTextScramble";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// (V16.31) Sección REHECHA en plano y simple tras varias iteraciones que la
// dejaron "muy mal": dos columnas alineadas arriba (titular izquierda,
// párrafos derecha), SIN sticky, SIN amortiguación, SIN perspectiva (el
// rotateY del titular vivía en el CSS de .nxr-intro-left, no en los hooks
// quitados en V16.29) y SIN fundidos scrubbed — el contenido viaja a la
// velocidad predeterminada de la página, como cualquier sección normal.
// Única animación: el reveal estándar del titular (useTitleReveal, el mismo
// de toda la web) y la entrada del párrafo con fade+scramble al aparecer.

export default function Intro() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const textsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      // Same direct-media-query safety net as useTitleReveal: avoids running
      // the animated setup for one tick before a reduced-motion re-render
      // corrects it.
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const section = sectionRef.current;
      const texts = textsRef.current;
      if (!section || !texts) return;

      if (prefersReduced) {
        gsap.set(texts, { visibility: "visible" });
        return;
      }

      // blur(5px) de arranque: misma receta de entrada que las captions del
      // reel (opacity 0→1 + blur 5→0 + scramble del texto). Es una animación
      // de ENTRADA puntual — después el bloque es contenido estático normal
      // que viaja a la velocidad predeterminada de la página.
      gsap.set(texts, { opacity: 0, filter: "blur(5px)" });
      // CSS keeps `texts` `visibility: hidden` until here (see globals.css) —
      // without this, it'd flash fully visible for a frame on first paint,
      // before this layout effect has a chance to run.
      gsap.set(texts, { visibility: "visible" });

      // ---- Text scramble (adapted from the motion-primitives TextScramble
      // reference, WITHOUT framer-motion — this codebase animates with GSAP
      // and the effect is a plain interval anyway). It must mutate the
      // `.nxr-cw-word` spans created by useCurvedWords rather than re-render
      // the paragraph: replacing the DOM text wholesale would destroy the
      // per-word curvature transforms. Each word's width is locked for the
      // duration so random glyphs can't reflow the line wrapping mid-effect.
      const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let cancelScramble: (() => void) | null = null;
      const scramble = () => {
        cancelScramble?.();
        const words = Array.from(texts.querySelectorAll<HTMLElement>(".nxr-cw-word"));
        // V16.21: en móvil NO hay .nxr-cw-word — useCurvedWords hace early
        // return <901px desde "quita la perspectiva de los textos en
        // móvil", así que este scramble llevaba MUDO en teléfono desde
        // entonces ("no has cambiado la del párrafo de la intro"). Ahí se
        // usa el MISMO scrambleElement de las captions del reel, que crea
        // sus propios spans por palabra.
        if (!words.length) {
          texts.querySelectorAll<HTMLElement>(".nxr-intro-text").forEach((p) => scrambleElement(p));
          return;
        }
        const originals = words.map((w) => w.textContent ?? "");
        const total = originals.reduce((n, t) => n + t.length, 0);
        words.forEach((w) => (w.style.width = `${w.offsetWidth}px`));
        const restore = () => {
          words.forEach((w, wi) => {
            w.textContent = originals[wi];
            w.style.width = "";
          });
        };
        const SPEED = 40; // ms per step (reference component's 0.04s)
        const steps = 900 / SPEED;
        let step = 0;
        const id = window.setInterval(() => {
          const progress = step / steps;
          let idx = 0;
          words.forEach((w, wi) => {
            const orig = originals[wi];
            let out = "";
            for (let c = 0; c < orig.length; c++, idx++) {
              out += progress * total > idx ? orig[c] : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
            }
            w.textContent = out;
          });
          step++;
          if (step > steps) {
            window.clearInterval(id);
            restore();
            cancelScramble = null;
          }
        }, SPEED);
        cancelScramble = () => {
          window.clearInterval(id);
          restore();
          cancelScramble = null;
        };
      };

      // Entrada al aparecer (como el resto de reveals del sitio) — y nada
      // más: sin fundido de salida, sin scrub, sin pin. El bloque se va con
      // el scroll como cualquier contenido.
      ScrollTrigger.create({
        trigger: texts,
        // "top 90%" (antes "top 80%"): la intro aparece un poco ANTES, justo
        // cuando las frases "Construido con maestría" del hero se van.
        start: "top 90%",
        onEnter: () => {
          gsap.to(texts, { opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power1.out", overwrite: "auto" });
          scramble();
        },
        onLeaveBack: () => {
          cancelScramble?.();
          gsap.to(texts, { opacity: 0, filter: "blur(5px)", duration: 0.2, ease: "power1.in", overwrite: "auto" });
        },
      });

      return () => {
        cancelScramble?.();
      };
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-intro" ref={sectionRef}>
      <div className="nxr-intro-inner">
        <div className="nxr-intro-left">
          <h2 className="nxr-intro-headline nxr-reveal" ref={titleRef}>
            Hacemos que
            <br />
            la tecnología
            <br />
            <span className="nxr-gradient-text-lime">trabaje por ti.</span>
          </h2>
        </div>

        <div className="nxr-intro-cards">
          <div className="nxr-intro-texts" ref={textsRef}>
            <div className="nxr-intro-textblock">
              <p className="nxr-intro-text">
                Somos una agencia de <strong>software e inteligencia artificial</strong> especializada en construir
                sistemas digitales que automatizan tareas, captan clientes y hacen crecer negocios — sin que tengas que
                entender de tecnología.
              </p>
              <p className="nxr-intro-text">
                Trabajamos con <strong>empresas de cualquier sector</strong> que saben que pueden ir más rápido pero no
                tienen el equipo técnico para hacerlo. Nosotros somos ese equipo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
