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
const MAX_BLUR = 9; // px en los extremos
// Tramos del recorrido: entrada, meseta legible, salida.
const ENTER_END = 0.3;
const EXIT_START = 0.7;

// Suaviza los extremos para que ni la entrada ni la salida arranquen de golpe.
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

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

      const st = ScrollTrigger.create({
        trigger: section,
        // Ceñido a cuando la sección está de verdad en pantalla: la entrada
        // ocurre al asomar y la salida al marcharse, sin un scrub eterno.
        start: "top 85%",
        end: "bottom 15%",
        scrub: 0.5,
        onUpdate: (self) => {
          const p = self.progress;
          // k: −1 entrando · 0 quieto y legible · +1 saliendo.
          let k: number;
          if (p < ENTER_END) k = -(1 - easeInOut(p / ENTER_END));
          else if (p > EXIT_START) k = easeInOut((p - EXIT_START) / (1 - EXIT_START));
          else k = 0;

          const away = Math.abs(k);
          const vis = { opacity: 1 - away, filter: `blur(${(away * MAX_BLUR).toFixed(2)}px)` };

          if (horizontal) {
            // y a 0 SIEMPRE: la altura de cada texto no se mueve nunca.
            gsap.set(title, { x: -k * TRAVEL_X, y: 0, ...vis });
            gsap.set(texts, { x: k * TRAVEL_X, y: 0, ...vis });
          } else {
            gsap.set(title, { y: k * TRAVEL_Y, x: 0, ...vis });
            gsap.set(texts, { y: -k * TRAVEL_Y, x: 0, ...vis });
          }
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
