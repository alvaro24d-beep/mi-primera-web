"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrambleElement, cancelScramble as cancelScrambleEl } from "@/hooks/useTextScramble";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// (V17.54) ESTRUCTURA REHECHA con el patrón que este proyecto ya tenía
// resuelto para la frase de Servicios (.nxr-servicios-head): el contenido va
// en un contenedor FIJO AL VIEWPORT.
//
// Por qué hacían falta cuatro intentos: mientras el texto viva en el flujo
// normal, VIAJA CON LA PÁGINA — entra por abajo y sale por arriba, porque eso
// es literalmente lo que hace el scroll. Daba igual el tipo de animación
// (scrub en V17.50/52, sticky en V17.51, por tiempo en V17.53): el
// desplazamiento propio de ~70px siempre quedaba enterrado bajo los ~500px que
// la página movía el bloque. El comentario de .nxr-servicios-head en
// globals.css cuenta exactamente esta misma historia y termina igual: fijarlo
// al viewport, donde "no viaja ni un píxel, ni antes, ni durante, ni después".
//
// Con el contenedor fijo, el ÚNICO movimiento posible es el que se le dé aquí:
//   Escritorio → titular entra desde ARRIBA y sale por ABAJO (eje Y),
//                párrafo entra desde ABAJO y sale por ARRIBA.
//   Móvil      → SOLO eje X, y clavada a 0: titular entra por la DERECHA y
//                sale por la IZQUIERDA; párrafo entra por la IZQUIERDA y sale
//                por la DERECHA. Nunca hay componente vertical.

const TRAVEL_Y = 90; // px, escritorio
const TRAVEL_X = 150; // px, móvil
const MAX_BLUR = 10;
// Tramos: entrada, meseta legible, salida.
const ENTER_END = 0.28;
const EXIT_START = 0.72;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function Intro() {
  const sectionRef = useRef<HTMLElement>(null);
  const fixedRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const section = sectionRef.current;
      const fixed = fixedRef.current;
      const title = titleRef.current;
      const texts = textsRef.current;
      if (!section || !fixed || !title || !texts) return;

      if (prefersReduced) {
        // Sin fijado ni movimiento: el contenido se lee como un bloque normal.
        fixed.classList.add("nxr-intro-fixed-static");
        gsap.set([title, texts], { clearProps: "transform,filter", opacity: 1 });
        return;
      }

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
        // Todo el paso de la sección por la pantalla. Al estar el contenido
        // FIJO, este rango no arrastra el texto: solo dice en qué punto del
        // recorrido va su entrada/meseta/salida.
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
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
            // SOLO horizontal. y a 0 explícito: no puede haber ni un píxel de
            // componente vertical.
            gsap.set(title, { x: -k * TRAVEL_X, y: 0, ...vis });
            gsap.set(texts, { x: k * TRAVEL_X, y: 0, ...vis });
          } else {
            // Titular: k=−1 (entrando) lo pone ARRIBA; k=+1 (saliendo), abajo.
            gsap.set(title, { y: k * TRAVEL_Y, x: 0, ...vis });
            gsap.set(texts, { y: -k * TRAVEL_Y, x: 0, ...vis });
          }
        },
      });

      const stScramble = ScrollTrigger.create({
        trigger: section,
        start: "top 60%",
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
      {/* Hijo DIRECTO de la sección: si colgara de un contenedor con transform
          (p. ej. el translate3d que CursorDrift aplica a .nxr-intro-inner), ese
          ancestro se convertiría en su bloque contenedor y el `fixed` pasaría
          a comportarse como `absolute` — la misma trampa que documenta
          .nxr-servicios-head. El inner va DENTRO, así que su deriva de cursor
          se mantiene sin romper nada. */}
      <div className="nxr-intro-fixed" ref={fixedRef}>
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
                  sistemas digitales que automatizan tareas, captan clientes y hacen crecer negocios — sin que tengas
                  que entender de tecnología.
                </p>
                <p className="nxr-intro-text">
                  Trabajamos con <strong>empresas de cualquier sector</strong> que saben que pueden ir más rápido pero
                  no tienen el equipo técnico para hacerlo. Nosotros somos ese equipo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
