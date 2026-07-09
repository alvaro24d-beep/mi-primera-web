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

export default function CapacidadesWeb() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const gridRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const grid = gridRef.current;
      const statsEl = statsRef.current;
      if (!grid || !statsEl) return;

      const cards = gsap.utils.toArray<HTMLElement>(grid.querySelectorAll(".nxr-dwh-cap-card"));
      const statVals = gsap.utils.toArray<HTMLElement>(statsEl.querySelectorAll(".nxr-dwh-stat-val"));

      if (prefersReduced) {
        gsap.set(cards, { visibility: "visible", opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 });
        statVals.forEach((el, i) => {
          const { prefix, target, suffix } = parseStat(STATS[i].val);
          el.textContent = `${prefix}${target}${suffix}`;
        });
        return;
      }

      // ---- Assembling entrance: each card starts scattered (randomised
      // rotation/offset/scale) and converges into the grid, one-shot as the
      // section scrolls into view — "pieces assembling into your capability
      // grid" instead of a uniform fade-up column.
      cards.forEach((card) => {
        gsap.set(card, {
          transformPerspective: 800,
          opacity: 0,
          x: gsap.utils.random(-70, 70),
          y: gsap.utils.random(40, 90),
          rotate: gsap.utils.random(-14, 14),
          scale: 0.7,
        });
      });
      // CSS keeps `.nxr-dwh-cap-card` `visibility: hidden` until here — same
      // flash-of-unanimated-content guard used sitewide (Hero.tsx, Intro.tsx):
      // without it, the finished grid flashes fully visible for a frame on
      // first paint, before this layout effect has a chance to scatter it.
      gsap.set(cards, { visibility: "visible" });
      gsap.to(cards, {
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: grid,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      // ---- 3D tilt on hover — same gsap.quickTo(rotationY/rotationX)
      // technique as the browser-mockup tilt in DesarrolloWebHero.tsx,
      // layered on top of the existing --mx/--my spotlight glow.
      const cleanups: Array<() => void> = [];
      cards.forEach((card) => {
        const rotY = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power2" });
        const rotX = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power2" });
        const onMove = (e: MouseEvent) => {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--mx", `${e.clientX - r.left}px`);
          card.style.setProperty("--my", `${e.clientY - r.top}px`);
          rotY(((e.clientX - r.left) / r.width - 0.5) * 10);
          rotX(-((e.clientY - r.top) / r.height - 0.5) * 8);
        };
        const onLeave = () => {
          rotY(0);
          rotX(0);
        };
        card.addEventListener("mousemove", onMove);
        card.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          card.removeEventListener("mousemove", onMove);
          card.removeEventListener("mouseleave", onLeave);
        });
      });

      // ---- Stats count-up: numbers animate from 0 to their real value once
      // the strip scrolls into view, keeping each stat's own sign/suffix.
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

      return () => cleanups.forEach((fn) => fn());
    },
    { dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-dwh-capacidades" className="nxr-dwh-capacidades">
      <div className="nxr-dwh-capacidades-inner">
        <div className="nxr-reveal">
          <p className="nxr-section-label">Capacidades</p>
          <h2 className="nxr-section-h2" ref={titleRef}>
            Todo lo que tu web necesita para{" "}
            <span className="nxr-gradient-text-lime">competir de verdad.</span>
          </h2>
        </div>

        <div className="nxr-dwh-cap-grid" ref={gridRef}>
          {CAPACIDADES.map((c) => (
            <div key={c.title} className="nxr-dwh-cap-card nxr-glass-edge">
              <span className="nxr-glass-edge-content nxr-dwh-cap-inner">
                <div className="nxr-dwh-cap-icon" style={{ background: c.bg, color: c.color }}>
                  {c.icon}
                </div>
                <div className="nxr-dwh-cap-title">{c.title}</div>
                <div className="nxr-dwh-cap-desc">{c.desc}</div>
              </span>
            </div>
          ))}
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
      </div>
    </section>
  );
}
