"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrambleElement, cancelScramble as cancelScrambleEl } from "@/hooks/useTextScramble";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// (V17.50) La sección vuelve a tener movimiento scrubbed, esta vez pedido al
// detalle: el titular ENTRA POR ARRIBA emergiendo de un difuminado (primero se
// ve su parte inferior y luego la superior), se RALENTIZA a media pantalla y
// sigue saliendo por abajo con el mismo difuminado y el mismo margen que dejó
// arriba. El párrafo hace lo mismo en espejo (entra por abajo, sale por
// arriba). En móvil el eje es horizontal: titular de derecha a izquierda y
// párrafo al revés.
//
// Ojo al historial: en V16.31 la sección se rehízo "en plano y simple" tras
// varias iteraciones con sticky/amortiguación que quedaron mal. Lo que se
// reintroduce aquí NO es aquello: no hay pin, ni sticky, ni el plano de
// perspectiva que se retiró en V16.91 (los textos siguen PLANOS). Es solo un
// desplazamiento sobre un eje + una máscara de difuminado en el contenedor.
//
// Cómo se consigue el "difuminado": la máscara (mask-image con un degradado)
// vive en el WRAPPER y es estática; lo que se mueve es el texto por debajo.
// Al cruzar la banda transparente del borde, el texto se desvanece por partes
// — de ahí que primero asome su parte de abajo.

// Recorrido a cada lado del centro, en fracción del viewport. Sale de la nada
// (borde de la máscara) y vuelve a la nada por el lado opuesto.
const TRAVEL_VH = 0.17;
const TRAVEL_VW = 0.4;
// Cuánto se frena en el centro. La curva es p + k·sin(2πp)/2π, cuya derivada
// es 1 + k·cos(2πp): en p=0.5 vale 1-k, así que con 0.72 el texto cruza el
// centro al 28% de su velocidad — el "se ralentiza a media pantalla" pedido —
// y recupera hacia los extremos. Con k=1 se pararía del todo y se sentiría
// enganchado.
const SLOW_K = 0.72;

const HEADLINE = (
  <>
    Hacemos que
    <br />
    la tecnología
    <br />
    <span className="nxr-gradient-text-lime">trabaje por ti.</span>
  </>
);

const PARRAFOS = (
  <>
    <p className="nxr-intro-text">
      Somos una agencia de <strong>software e inteligencia artificial</strong> especializada en construir sistemas
      digitales que automatizan tareas, captan clientes y hacen crecer negocios — sin que tengas que entender de
      tecnología.
    </p>
    <p className="nxr-intro-text">
      Trabajamos con <strong>empresas de cualquier sector</strong> que saben que pueden ir más rápido pero no tienen el
      equipo técnico para hacerlo. Nosotros somos ese equipo.
    </p>
  </>
);

export default function Intro() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      // Misma red de seguridad que useTitleReveal: en el primer render del
      // cliente `reducedMotion` aún puede leer false para un usuario que sí la
      // prefiere (getServerSnapshot devuelve false por diseño).
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
        // Todo el cruce de la sección por la pantalla: entra por un borde y
        // sale por el contrario.
        start: "top bottom",
        end: "bottom top",
        // El scrub temporal es lo que da el tacto amortiguado; la frenada del
        // centro la pone la curva de abajo, no esto.
        scrub: 0.7,
        onUpdate: (self) => {
          const p = self.progress;
          // Reparametrización que frena en el centro (ver SLOW_K).
          const eased = p + (SLOW_K * Math.sin(2 * Math.PI * p)) / (2 * Math.PI);
          // -1 en el borde de entrada, 0 en el centro, +1 en el de salida.
          const d = (eased - 0.5) * 2;
          if (horizontal) {
            const travel = window.innerWidth * TRAVEL_VW;
            // Titular: entra por la DERECHA (+) y sale por la izquierda (−).
            gsap.set(title, { x: -d * travel, y: 0 });
            // Párrafo en espejo.
            gsap.set(texts, { x: d * travel, y: 0 });
          } else {
            const travel = window.innerHeight * TRAVEL_VH;
            // Titular: arranca por ENCIMA de su sitio y baja cruzando la banda
            // nítida, así lo primero que se lee es su parte inferior.
            gsap.set(title, { y: d * travel, x: 0 });
            // Párrafo: entra desde abajo y se va por arriba.
            gsap.set(texts, { y: -d * travel, x: 0 });
          }
        },
      });

      // El scramble sigue siendo la firma de los párrafos del sitio; se dispara
      // una vez al entrar y no compite con el desplazamiento (uno cambia los
      // glifos, el otro la posición).
      const stScramble = ScrollTrigger.create({
        trigger: texts,
        start: "top 90%",
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
          {/* El wrapper es quien lleva la máscara de difuminado; el h2 se mueve
              dentro de ella. */}
          <div className="nxr-intro-mask">
            <h2 className="nxr-intro-headline" ref={titleRef}>
              {HEADLINE}
            </h2>
          </div>
        </div>

        <div className="nxr-intro-cards">
          <div className="nxr-intro-mask nxr-intro-mask-texts">
            <div className="nxr-intro-texts" ref={textsRef}>
              <div className="nxr-intro-textblock">{PARRAFOS}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
