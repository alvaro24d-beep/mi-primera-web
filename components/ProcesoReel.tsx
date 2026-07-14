"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useCurvedWords } from "@/hooks/useCurvedWords";
import { useGlassPanels } from "@/hooks/useGlassPanels";

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

function StepCards() {
  return (
    <>
      {STEPS.map((s) => (
        // No CSS glass anymore (.nxr-glass-edge dropped): the card is the
        // ANCHOR for a real volumetric fluid-glass mesh (useGlassPanels in
        // ProcesoReel) — same identity as the home's cards.
        <div key={s.n} className="nxr-dwh-step-card" data-step={s.n}>
          <span className="nxr-dwh-step-inner">
            <span className="nxr-dwh-step-num">{s.n}</span>
            <span className="nxr-dwh-step-title">{s.title}</span>
            <span className="nxr-dwh-step-desc">{s.desc}</span>
          </span>
        </div>
      ))}
    </>
  );
}

export default function ProcesoReel() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Home-identity systems: real volumetric fluid-glass behind each step card
  // (the DOM card keeps layout/content + a legibility scrim only — see the
  // .nxr-dwh-step-card CSS) and the dynamic per-line bow on the title.
  useGlassPanels(sectionRef, ".nxr-dwh-step-card", "#12141c", [reducedMotion]);
  useCurvedWords(sectionRef, ".nxr-section-h2", "left", [reducedMotion], {
    bowOnly: true,
    useExistingWords: true,
  });

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      const sticky = stickyRef.current;
      const content = contentRef.current;
      const track = trackRef.current;
      const progressFill = progressFillRef.current;
      if (!section || !sticky || !content || !track) return;

      const q = gsap.utils.selector(section);
      const cards = q(".nxr-dwh-step-card") as HTMLElement[];
      const dots = q(".nxr-dwh-proceso-dot") as HTMLElement[];

      // One-shot "arrival" as the section scrolls into view, BEFORE the pin
      // engages — kept as its own ScrollTrigger (not threaded into the
      // scrubbed pin timeline below) so it can't interfere with the pin's
      // own distance math, same reasoning DesarrolloWebHero keeps its
      // title-intro and build phases in one timeline but this section's
      // entrance is logically a separate, simpler concern.
      gsap.set(content, { opacity: 0, scale: 0.92 });
      gsap.to(content, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      });

      // `width: max-content` means the track never "overflows itself" —
      // compare against the sticky container's viewport-constrained width.
      const amount = () => Math.max(0, track.scrollWidth - sticky.clientWidth);

      // Depth-of-field carousel effect: cards nearest the sticky container's
      // horizontal centre read as "in focus" (full size/opacity); cards
      // further out recede — turns the flat row into a carousel with real
      // depth, driven by the SAME scroll progress as the horizontal scrub
      // (not a separate scroll listener) so it can never drift out of sync.
      const updateDepth = () => {
        const stickyRect = sticky.getBoundingClientRect();
        const centerX = stickyRect.left + stickyRect.width / 2;
        let nearestIdx = 0;
        let nearestDist = Infinity;
        cards.forEach((card, i) => {
          const r = card.getBoundingClientRect();
          const cardCenter = r.left + r.width / 2;
          const dist = Math.abs(cardCenter - centerX);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestIdx = i;
          }
          const norm = gsap.utils.clamp(0, 1, dist / (stickyRect.width * 0.6));
          gsap.set(card, {
            scale: gsap.utils.mapRange(0, 1, 1, 0.84, norm),
            opacity: gsap.utils.mapRange(0, 1, 1, 0.4, norm),
          });
        });
        dots.forEach((dot, i) => dot.classList.toggle("nxr-active", i === nearestIdx));
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${amount()}`,
          scrub: 1,
          pin: sticky,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            updateDepth();
            if (progressFill) gsap.set(progressFill, { scaleX: self.progress });
          },
          onRefresh: updateDepth,
        },
      });

      tl.to(track, { x: () => -amount(), ease: "none" }, 0);
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  if (reducedMotion) {
    return (
      // See DesarrolloWebHero.tsx for why this needs a distinct `key`: GSAP's
      // pin-spacer, inserted outside React's tracking, corrupts reconciliation
      // if React tries to diff into it instead of fully remounting.
      <section key="static" id="nxr-dwh-proceso" className="nxr-dwh-proceso nxr-dwh-proceso-static">
        <div className="nxr-dwh-proceso-tilt">
          <div>
            <h2 className="nxr-section-h2">
              De la idea al <span className="nxr-gradient-text-salmon">lanzamiento.</span>
            </h2>
          </div>
          <div className="nxr-dwh-step-list">
            <StepCards />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="nxr-dwh-proceso" className="nxr-dwh-proceso" ref={sectionRef}>
      <div className="nxr-dwh-proceso-sticky" ref={stickyRef}>
        <div className="nxr-dwh-proceso-content" ref={contentRef}>
          {/* The flat perspective plane (left near, right far) lives on this
              wrapper — NOT on .nxr-dwh-proceso-content (GSAP owns its
              entrance transform) nor the track (GSAP scrubs its x). The
              title rides the same plane (one vanishing point per section),
              so this section's h2 is NOT in the CSS tilt groups. */}
          <div className="nxr-dwh-proceso-tilt">
            <div className="nxr-dwh-proceso-head">
              <h2 className="nxr-section-h2" ref={titleRef}>
                De la idea al <span className="nxr-gradient-text-salmon">lanzamiento.</span>
              </h2>
            </div>

            <div className="nxr-dwh-proceso-progress">
              <div className="nxr-dwh-proceso-progress-track">
                <div className="nxr-dwh-proceso-progress-fill" ref={progressFillRef} />
              </div>
              <div className="nxr-dwh-proceso-dots">
                {STEPS.map((s) => (
                  <span key={s.n} className="nxr-dwh-proceso-dot" />
                ))}
              </div>
            </div>

            <div className="nxr-dwh-proceso-track" ref={trackRef}>
              <StepCards />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
