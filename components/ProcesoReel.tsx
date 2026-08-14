"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTitleReveal } from "@/hooks/useTitleReveal";

// V17.98: esto fue un REEL HORIZONTAL pineado y ya no lo es. Tenía un sticky de
// 100lvh, un track con `width: max-content` que GSAP scrubbeaba en x, un efecto
// de carrusel con profundidad (las cards lejos del centro se encogían a 0.84 y
// bajaban a 0.4 de opacidad) y su propia barra de progreso con puntos. Se quitó
// entero: para leer los cinco pasos había que hacer scroll y consumirlos de uno
// en uno, al ritmo que marcaba el pin, y en cualquier instante solo uno estaba
// a plena opacidad. Todo eso trabaja en contra de un contenido cuya única
// función es LEERSE. Ahora son cinco cards en una rejilla normal, las cinco
// legibles a la vez.
//
// El nombre del archivo se mantiene para no tocar el import de la página; lo
// que era "reel" aquí dentro ya no existe.

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

export default function ProcesoReel() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  // SIN cristal volumétrico (V17.99). Estas cards eran anclas de useGlassPanels
  // y la sección iba lageada: cada panel dibuja un MeshTransmissionMaterial, y
  // tener materiales de transmisión visibles obliga a la escena a hacer una
  // CAPTURA extra de todo lo que hay detrás en cada frame. Eso se paga en una
  // página que ya sostiene el muro de vídeo a pantalla completa, y aquí no
  // compraba nada: son cinco tarjetas de texto quietas, no las piezas de
  // Servicios que se mueven y se doblan.
  //
  // Lo que las sigue vistiendo es `.nxr-glass-edge`, el borde de gradiente por
  // mask que usa el resto del sitio: es la misma familia visual y cuesta una
  // pseudo-capa estática. Deliberadamente NO se sustituye por backdrop-filter,
  // que habría salido más caro que la propia malla — el compositor rehace cada
  // capa de blur en CADA repintado del canvas, y el canvas repinta a ~30fps en
  // toda la web (el mismo motivo por el que GradualBlur está limitado a 2
  // divs).

  useGSAP(
    () => {
      if (reducedMotion) return;
      const cards = gsap.utils.selector(sectionRef)(".nxr-dwh-step-card");
      if (!cards.length) return;
      // Entrada escalonada y UNA SOLA VEZ (`once`), sin pin y sin scrub: las
      // cards aparecen al llegar la sección y ahí se quedan. Antes la posición
      // y la opacidad de cada card dependían del scroll en todo momento, que es
      // lo que obligaba a "conducir" la sección para leerla.
      gsap.from(cards, {
        opacity: 0,
        y: 26,
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.07,
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%", once: true },
      });
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  // Una sola rama de JSX para las dos preferencias de movimiento. Antes hacían
  // falta dos (con `key` distinta) porque el pin de GSAP inserta un pin-spacer
  // fuera del árbol de React y romperle la reconciliación; sin pin, ese peligro
  // desaparece y lo único que cambia con reduced motion es que no se anima.
  return (
    <section id="nxr-dwh-proceso" className="nxr-dwh-proceso" ref={sectionRef}>
      <div className="nxr-dwh-proceso-head">
        <h2 className="nxr-section-h2" ref={titleRef}>
          De la idea al <span className="nxr-gradient-text-salmon">lanzamiento.</span>
        </h2>
      </div>

      <div className="nxr-dwh-step-grid">
        {STEPS.map((s) => (
          <div key={s.n} className="nxr-dwh-step-card nxr-glass-edge" data-step={s.n}>
            <span className="nxr-dwh-step-inner">
              <span className="nxr-dwh-step-num">{s.n}</span>
              <span className="nxr-dwh-step-title">{s.title}</span>
              <span className="nxr-dwh-step-desc">{s.desc}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
