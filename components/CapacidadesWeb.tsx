"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCurvedWords } from "@/hooks/useCurvedWords";
import { useGlassPanels } from "@/hooks/useGlassPanels";

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
// DELIBERATELY translate/scale/opacity only — never rotation: each card is
// the anchor of a real volumetric glass mesh (useGlassPanels), whose
// rect-based tracking follows position and scale exactly but cannot rotate
// (a CSS-rotated anchor reports an inflated axis-aligned rect — the same
// reason the home's Proceso dropped its pointer tilt).
const SLOT_Y = -26; // px upward per slot (the deck recedes upward)
const SLOT_SCALE = 0.055;
const VISIBLE_DEPTH = 3; // slots visible behind the front card
const slot = (s: number) => ({
  y: s * SLOT_Y,
  scale: 1 - Math.min(s, VISIBLE_DEPTH + 1) * SLOT_SCALE,
  opacity: s <= VISIBLE_DEPTH ? 1 - s * 0.22 : 0,
});

function CapCard({ c }: { c: (typeof CAPACIDADES)[number] }) {
  return (
    // Anchor for a volumetric fluid-glass mesh — layout/content + scrim only.
    <div className="nxr-dwh-cap-card">
      <span className="nxr-dwh-cap-inner">
        <div className="nxr-dwh-cap-icon" style={{ background: c.bg, color: c.color }}>
          {c.icon}
        </div>
        <div className="nxr-dwh-cap-title">{c.title}</div>
        <div className="nxr-dwh-cap-desc">{c.desc}</div>
      </span>
    </div>
  );
}

/**
 * "Baraja" section — the page's non-linear-scroll piece, following the
 * home's directive that sections shouldn't just ride the vertical flow: the
 * six capability cards sit STACKED at screen centre inside a pinned stage,
 * and each scroll step PEELS the front card away (up and gone) while the
 * deck behind steps forward one slot. Volumetric glass on every card, the
 * dynamic per-line bow on the title, stats count-up after the pin.
 */
export default function CapacidadesWeb() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGlassPanels(sectionRef, ".nxr-dwh-cap-card", "#12141c", [reducedMotion]);
  useCurvedWords(sectionRef, ".nxr-section-h2", "left", [reducedMotion], {
    bowOnly: true,
    useExistingWords: true,
  });

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
        // Static fallback: the deck lays out as a plain grid via the
        // .nxr-dwh-cap-deck-static class (no pin, no peel).
        deck.classList.add("nxr-dwh-cap-deck-static");
        gsap.set(cards, { visibility: "visible", clearProps: "transform,opacity" });
        statVals.forEach((el, i) => {
          const { prefix, target, suffix } = parseStat(STATS[i].val);
          el.textContent = `${prefix}${target}${suffix}`;
        });
        return;
      }

      // Resting slots (front card = slot 0, deeper cards recede up/behind).
      // Only the FRONT card shows its content: the cards are translucent
      // (scrim + glass), so stacked visible texts read as an overlapping
      // soup — the back cards reduce to clean receding card edges instead.
      const innerOf = (card: HTMLElement) => card.querySelector<HTMLElement>(".nxr-dwh-cap-inner");
      cards.forEach((card, i) => {
        const s = slot(i);
        gsap.set(card, { y: s.y, scale: s.scale, opacity: s.opacity });
        gsap.set(innerOf(card) ?? {}, { opacity: i === 0 ? 1 : 0 });
      });
      // CSS keeps the cards `visibility: hidden` until the initial states are
      // in — the usual first-paint-flash guard used sitewide.
      gsap.set(cards, { visibility: "visible" });

      const steps = cards.length - 1; // the last card stays
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${steps * 60}%`,
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Step k (one timeline unit each): the front card peels up and away
      // while every card behind advances one slot — and the NEW front
      // card's content fades in as it arrives (see innerOf above).
      for (let k = 0; k < steps; k++) {
        tl.to(
          cards[k],
          { yPercent: -160, opacity: 0, scale: 1.05, duration: 0.75, ease: "power2.in" },
          k
        );
        for (let j = k + 1; j < cards.length; j++) {
          const s = slot(j - k - 1);
          tl.to(cards[j], { y: s.y, scale: s.scale, opacity: s.opacity, duration: 0.6, ease: "power2.out" }, k + 0.12);
          tl.to(innerOf(cards[j]) ?? {}, { opacity: s.y === 0 ? 1 : 0, duration: 0.4 }, k + 0.25);
        }
        // Breather between peels so each capability gets its own beat.
        tl.to({}, { duration: 0.25 }, k + 0.75);
      }

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
          {CAPACIDADES.map((c) => (
            <CapCard key={c.title} c={c} />
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
