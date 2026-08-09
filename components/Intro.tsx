"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrambleElement, cancelScramble as cancelScrambleEl } from "@/hooks/useTextScramble";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// (V17.51) El bloque queda CLAVADO en pantalla (sticky) mientras los dos
// textos lo cruzan. Esto es lo que corrige el intento de V17.50: allí el
// transform era un desplazamiento pequeño SUMADO al viaje natural de la
// página, así que los dos textos seguían subiendo con el scroll (y el párrafo,
// yendo en sentido contrario, se leía "un poco más rápido") en vez de entrar
// por un lado y salir por el otro. Con el sticky, el punto de anclaje no se
// mueve y el ÚNICO movimiento es el del propio texto dentro de su máscara.
//
//   Escritorio → eje VERTICAL. El titular entra por arriba y sale por abajo;
//                el párrafo entra por abajo y sale por arriba. No desde el
//                borde de la pantalla: desde una distancia media (TRAVEL_VH).
//   Móvil      → eje HORIZONTAL puro. La ALTURA NO CAMBIA en ningún momento:
//                cada texto entra por un lado y se va por el opuesto (titular
//                de derecha a izquierda, párrafo al revés), y el párrafo se
//                alinea a la derecha (solo en móvil).
//
// El difuminado lo pone una máscara ESTÁTICA en el wrapper (mask-image con
// degradado): el texto se disuelve al acercarse a los extremos de su pista.

// Distancia media, no el borde: la máscara ya lo ha disuelto del todo antes de
// llegar al final de la pista.
const TRAVEL_VH = 0.3;
const TRAVEL_VW = 0.62;
// Frenada en el centro. La curva es p + k·sin(2πp)/2π y su derivada
// 1 + k·cos(2πp), que en p=0.5 vale 1-k: con 0.72 cruza el medio al 28% de su
// velocidad y recupera hacia los extremos.
const SLOW_K = 0.72;

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
        gsap.set([title, texts], { clearProps: "transform", visibility: "visible" });
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
        // Exactamente el tramo en que el sticky está pegado: desde que su
        // techo toca el del viewport hasta que la sección se acaba.
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          const eased = p + (SLOW_K * Math.sin(2 * Math.PI * p)) / (2 * Math.PI);
          // −1 en el lado de entrada, 0 centrado y legible, +1 en el de salida.
          const d = (eased - 0.5) * 2;
          if (horizontal) {
            const travel = window.innerWidth * TRAVEL_VW;
            // y SIEMPRE 0: "la altura a la que salen los textos no debe
            // cambiar". Titular de derecha a izquierda; párrafo al revés.
            gsap.set(title, { x: -d * travel, y: 0 });
            gsap.set(texts, { x: d * travel, y: 0 });
          } else {
            const travel = window.innerHeight * TRAVEL_VH;
            // Titular arriba → abajo; párrafo abajo → arriba. x fija.
            gsap.set(title, { y: d * travel, x: 0 });
            gsap.set(texts, { y: -d * travel, x: 0 });
          }
        },
      });

      const stScramble = ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
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
      {/* El sticky es lo que fija el punto de anclaje: sin él, el texto viaja
          con la página y "entrar por un lado y salir por el otro" es
          imposible de leer. */}
      <div className="nxr-intro-sticky">
        <div className="nxr-intro-inner">
          <div className="nxr-intro-left">
            <div className="nxr-intro-mask">
              <h2 className="nxr-intro-headline" ref={titleRef}>
                Hacemos que
                <br />
                la tecnología
                <br />
                <span className="nxr-gradient-text-lime">trabaje por ti.</span>
              </h2>
            </div>
          </div>

          <div className="nxr-intro-cards">
            <div className="nxr-intro-mask">
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
      </div>
    </section>
  );
}
