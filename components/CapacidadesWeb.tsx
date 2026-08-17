"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const CAPACIDADES = [
  {
    title: "Diseño a medida",
    desc: "Nada de plantillas genéricas: cada web se diseña desde cero para tu marca.",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
      </svg>
    ),
  },
  {
    title: "Responsive & mobile-first",
    desc: "Se ve y funciona perfecto en cualquier pantalla, empezando por el móvil.",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    title: "Rendimiento real",
    desc: "Core Web Vitals aprobados y tiempos de carga que no espantan visitas.",
    color: "var(--c-salmon)",
    bg: "rgba(255,157,125,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z" />
      </svg>
    ),
  },
  {
    title: "SEO técnico de base",
    desc: "Estructura, metadatos y velocidad pensados para posicionar desde el día uno.",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5L21 21" />
      </svg>
    ),
  },
  {
    title: "CMS / panel de gestión",
    desc: "Edita textos, imágenes y contenido sin tocar código ni depender de nosotros.",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    title: "Integraciones & APIs",
    desc: "Conectamos tu web con CRM, pasarelas de pago, email y las herramientas que ya usas.",
    color: "var(--c-salmon)",
    bg: "rgba(255,157,125,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 3L3 8.5v7L12 21l9-5.5v-7L12 3z" />
        <path d="M12 12l9-3.5M12 12L3 8.5M12 12v9" />
      </svg>
    ),
  },
];

const STATS = [
  { val: "+40", label: "Proyectos web entregados", color: "var(--c-lime)" },
  { val: "100%", label: "Core Web Vitals aprobados", color: "var(--c-salmon)" },
  { val: "-40%", label: "Tiempo de carga medio", color: "var(--c-lime)" },
  { val: "30d", label: "Soporte post-lanzamiento", color: "var(--c-salmon)" },
];

// Splits "e.g. -40%" into a static sign/suffix and the number to count up —
// the count-up always animates the magnitude (0→40), keeping the sign as a
// fixed prefix, so "-40%" reads as "-0% → -40%" rather than counting through
// negative numbers.
function parseStat(val: string) {
  const m = val.match(/^([+-]?)(\d+)(.*)$/);
  if (!m) return { prefix: "", target: 0, suffix: val };
  const [, sign, num, suffix] = m;
  return { prefix: sign, target: parseInt(num, 10), suffix };
}

// Visual stack: how a card sitting `s` slots behind the front one rests.
// Cuánto encoge cada card por cada compañera que le queda por delante. Con 6
// capacidades, la primera acaba en 0.75 y la última se queda a tamaño natural:
// la pila se ve en perspectiva sin que las de abajo lleguen a desaparecer.
const MERMA = 0.05;

function CapCard({ c, i }: { c: (typeof CAPACIDADES)[number]; i: number }) {
  return (
    // Cada card va dentro de su propio envoltorio STICKY. El envoltorio es el
    // que se queda pegado; la card de dentro es la que GSAP escala, y lo hace
    // desde su borde superior (transform-origin en el CSS) para que al
    // encogerse deje ver la que llega por debajo.
    <div className="nxr-dwh-cap-sticky" style={{ ["--i" as string]: i }}>
      <div className="nxr-dwh-cap-card">
        <span className="nxr-dwh-cap-inner">
          <div className="nxr-dwh-cap-icon" style={{ background: c.bg, color: c.color }}>
            {c.icon}
          </div>
          <div className="nxr-dwh-cap-title">{c.title}</div>
          <div className="nxr-dwh-cap-desc">{c.desc}</div>
        </span>
      </div>
    </div>
  );
}

/**
 * Sección de capacidades — PILA STICKY (V18.14). Cada card se queda pegada
 * arriba mientras la siguiente sube por debajo, y va encogiendo un poco a
 * medida que se le acumulan compañeras encima: al final del recorrido se ven
 * las seis apiladas en perspectiva, no una sola.
 *
 * Fue una "baraja" pineada en la que cada paso PELABA la card de delante y
 * solo se leía una a la vez. El cambio quita el pin —una sección menos que
 * secuestra el scroll— y hace que el conjunto se lea de un vistazo.
 *
 * El efecto es CSS puro en su mayor parte: los envoltorios son `position:
 * sticky` con un `top` escalonado por índice, así que el apilado lo hace el
 * navegador. GSAP solo añade el escalado, atado al scroll con scrub.
 */
export default function CapacidadesWeb() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stage = stageRef.current;
      const deck = deckRef.current;
      const statsEl = statsRef.current;
      if (!stage || !deck || !statsEl) return;

      const cards = gsap.utils.toArray<HTMLElement>(deck.querySelectorAll(".nxr-dwh-cap-card"));
      const statVals = gsap.utils.toArray<HTMLElement>(statsEl.querySelectorAll(".nxr-dwh-stat-val"));

      if (prefersReduced) {
        // Sin movimiento: la pila se aplana en una rejilla normal (el sticky y
        // el escalado se anulan en el CSS con la clase de abajo).
        deck.classList.add("nxr-dwh-cap-deck-static");
        gsap.set(cards, { clearProps: "transform" });
        statVals.forEach((el, i) => {
          const { prefix, target, suffix } = parseStat(STATS[i].val);
          el.textContent = `${prefix}${target}${suffix}`;
        });
        return;
      }

      // El apilado lo hace el CSS con `position: sticky`; lo único que añade
      // GSAP es el ESCALADO, que es lo que da la perspectiva de pila.
      //
      // Cada card encoge hasta un tamaño que depende de cuántas van a acabar
      // encima de ella: la primera es la que más se hunde y la última se queda
      // a tamaño natural. Y cada una empieza a encoger cuando le toca —en su
      // fracción del recorrido— no todas a la vez, de modo que el gesto
      // acompaña al scroll en lugar de ocurrir de golpe.
      //
      // Un solo ScrollTrigger con scrub para las seis, con el DECK entero como
      // trigger: los envoltorios sticky ya reparten el recorrido, así que no
      // hacen falta seis triggers ni ningún pin.
      const n = cards.length;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: deck,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      cards.forEach((card, i) => {
        const destino = 1 - (n - i - 1) * MERMA;
        if (destino >= 1) return; // la última no encoge: nada que animar
        tl.fromTo(
          card,
          { scale: 1 },
          { scale: destino, ease: "none", duration: Math.max(0.001, 1 - i / n) },
          i / n
        );
      });

      // ---- Stats count-up: numbers animate from 0 once the strip (after the
      // pin) scrolls into view, keeping each stat's own sign/suffix.
      statVals.forEach((el, i) => {
        const { prefix, target, suffix } = parseStat(STATS[i].val);
        const proxy = { val: 0 };
        el.textContent = `${prefix}0${suffix}`;
        gsap.to(proxy, {
          val: target,
          duration: 1.3,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = `${prefix}${Math.round(proxy.val)}${suffix}`;
          },
          scrollTrigger: {
            trigger: statsEl,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        });
      });
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-dwh-capacidades" className="nxr-dwh-capacidades" ref={sectionRef}>
      <div className="nxr-dwh-cap-stage" ref={stageRef}>
        <div className="nxr-reveal">
          <h2 className="nxr-section-h2" ref={titleRef}>
            Todo lo que tu web necesita para{" "}
            <span className="nxr-gradient-text-lime">competir de verdad.</span>
          </h2>
        </div>

        <div className="nxr-dwh-cap-deck" ref={deckRef}>
          {CAPACIDADES.map((c, i) => (
            <CapCard key={c.title} c={c} i={i} />
          ))}
        </div>
      </div>

      <div className="nxr-dwh-stats-strip" ref={statsRef}>
        {STATS.map((s) => (
          <div key={s.label} className="nxr-dwh-stat">
            <div className="nxr-dwh-stat-val" style={{ color: s.color }}>
              {s.val}
            </div>
            <div className="nxr-dwh-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
