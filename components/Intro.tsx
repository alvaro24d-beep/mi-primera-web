"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrambleElement, cancelScramble as cancelScrambleEl } from "@/hooks/useTextScramble";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// (V17.52) "Diapositiva difuminada": cada texto ENTRA deslizándose desde su
// lado mientras se enfoca, se queda QUIETO y legible en su sitio de siempre, y
// SALE deslizándose hacia el lado contrario mientras se desenfoca.
//
//   Escritorio → titular entra desde ARRIBA y sale por ABAJO;
//                párrafo entra desde ABAJO y sale por ARRIBA.
//   Móvil      → eje horizontal y la ALTURA NO CAMBIA NUNCA: titular entra por
//                la DERECHA y sale por la IZQUIERDA; párrafo al revés (y
//                alineado a la derecha, solo aquí).
//
// Lo que se eliminó de los dos intentos anteriores y POR QUÉ:
//  · V17.50 sumaba un desplazamiento al viaje natural de la página, así que
//    los textos seguían subiendo con el scroll en vez de entrar y salir.
//  · V17.51 lo metió en un sticky dentro de una sección de 190vh: el bloque
//    entero aparecía por abajo, hacía el movimiento y se iba por arriba, y los
//    textos cruzaban la pantalla de marco a marco.
// Aquí NO hay sección alta, ni sticky, ni máscara con pista larga. La sección
// mide lo que siempre midió y scrollea como cualquier otra; el recorrido es
// CORTO y la opacidad llega a 0 mucho antes de que el texto se acerque a
// ningún borde.

// Recorrido, corto a propósito: es un deslizamiento de apoyo al fundido, no un
// viaje. A esta distancia el texto ya es invisible.
const TRAVEL_Y = 72; // px, escritorio
const TRAVEL_X = 96; // px, móvil
const MAX_BLUR = 9; // px, fuera de pantalla

export default function Intro() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const section = sectionRef.current;
      const title = titleRef.current;
      const texts = textsRef.current;
      if (!section || !title || !texts) return;

      if (prefersReduced) {
        gsap.set([title, texts], { clearProps: "transform,filter,opacity", visibility: "visible" });
        return;
      }

      gsap.set([title, texts], { visibility: "visible" });

      const scramble = () => {
        texts.querySelectorAll<HTMLElement>(".nxr-intro-text").forEach((p) => scrambleElement(p));
      };
      const cancelScramble = () => {
        texts.querySelectorAll<HTMLElement>(".nxr-intro-text").forEach((p) => cancelScrambleEl(p));
      };

      let horizontal = window.innerWidth <= 900;
      const onResize = () => {
        horizontal = window.innerWidth <= 900;
      };
      window.addEventListener("resize", onResize, { passive: true });

      // Offset de partida/salida de cada texto, según eje y sentido.
      const off = (el: HTMLElement, k: number) =>
        horizontal
          ? { x: (el === title ? -1 : 1) * k * TRAVEL_X, y: 0 }
          : { x: 0, y: (el === title ? 1 : -1) * k * TRAVEL_Y };

      const oculto = (el: HTMLElement, k: number) => ({
        ...off(el, k),
        opacity: 0,
        filter: `blur(${MAX_BLUR}px)`,
      });
      const visible = (el: HTMLElement) => ({
        ...off(el, 0),
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.85,
        ease: "power2.out",
        overwrite: "auto" as const,
      });

      gsap.set(title, oculto(title, -1));
      gsap.set(texts, oculto(texts, -1));

      // POR TIEMPO, no atado al scroll (V17.53). Con scrub, mientras el texto
      // se desplazaba sus ~70px la página lo subía ~500: el movimiento del
      // scroll DOMINABA y por eso los dos seguían "apareciendo por abajo".
      // Disparada por tiempo, la animación dura 0.85s y en ese rato la página
      // apenas se mueve, así que lo único que se ve es el texto entrando desde
      // su lado. Se re-arma al salir para que funcione en los dos sentidos.
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top 78%",
        end: "bottom 22%",
        onEnter: () => {
          gsap.to(title, visible(title));
          gsap.to(texts, visible(texts));
        },
        onEnterBack: () => {
          gsap.to(title, visible(title));
          gsap.to(texts, visible(texts));
        },
        // Sale hacia el lado CONTRARIO al de entrada.
        onLeave: () => {
          gsap.to(title, { ...oculto(title, 1), duration: 0.6, ease: "power2.in", overwrite: "auto" });
          gsap.to(texts, { ...oculto(texts, 1), duration: 0.6, ease: "power2.in", overwrite: "auto" });
        },
        onLeaveBack: () => {
          gsap.to(title, { ...oculto(title, -1), duration: 0.6, ease: "power2.in", overwrite: "auto" });
          gsap.to(texts, { ...oculto(texts, -1), duration: 0.6, ease: "power2.in", overwrite: "auto" });
        },
      });

      const stScramble = ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        onEnter: scramble,
        onLeaveBack: cancelScramble,
      });

      return () => {
        window.removeEventListener("resize", onResize);
        cancelScramble();
        st.kill();
        stScramble.kill();
      };
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-intro" ref={sectionRef}>
      <div className="nxr-intro-inner">
        <div className="nxr-intro-left">
          <h2 className="nxr-intro-headline" ref={titleRef}>
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
