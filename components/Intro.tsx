"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGlassPanels } from "@/hooks/useGlassPanels";

// Compact looping graphic per card, each representing its service (same idea
// as the home Servicios animations): a website building for "Construimos", an
// automation flow with a travelling pulse for "Automatizamos", growth bars for
// "Hacemos crecer". Pure CSS keyframes (see globals.css) so they keep looping.
function WebAnim() {
  return (
    <div className="nxr-intro-anim nxr-ianim-web" aria-hidden="true">
      <div className="nxr-ianim-web-bar">
        <i />
        <i />
        <i />
      </div>
      <div className="nxr-ianim-web-body">
        <span className="nxr-ianim-web-line" />
        <span className="nxr-ianim-web-line" />
        <span className="nxr-ianim-web-line" />
      </div>
    </div>
  );
}

function AutoAnim() {
  return (
    <div className="nxr-intro-anim nxr-ianim-auto" aria-hidden="true">
      <span className="nxr-ianim-auto-track" />
      <span className="nxr-ianim-auto-node n1" />
      <span className="nxr-ianim-auto-node n2" />
      <span className="nxr-ianim-auto-node n3" />
      <span className="nxr-ianim-auto-pulse" />
    </div>
  );
}

function GrowAnim() {
  return (
    <div className="nxr-intro-anim nxr-ianim-grow" aria-hidden="true">
      <span className="nxr-ianim-grow-bar" />
      <span className="nxr-ianim-grow-bar" />
      <span className="nxr-ianim-grow-bar" />
      <span className="nxr-ianim-grow-bar" />
      <svg className="nxr-ianim-grow-arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18L14 8M14 8H7M14 8v7" />
      </svg>
    </div>
  );
}

export default function Intro() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const textsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Real volumetric fluid-glass behind each intro card (same identity as the
  // Servicios cards, flat variant) — the DOM card keeps only layout/content;
  // see the .nxr-intro-card CSS, which no longer paints its own glass.
  useGlassPanels(sectionRef, ".nxr-intro-card", "#12141c", [reducedMotion]);

  useGSAP(
    () => {
      // Same direct-media-query safety net as useTitleReveal: avoids running
      // the animated setup for one tick before a reduced-motion re-render
      // corrects it.
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const section = sectionRef.current;
      const texts = textsRef.current;
      if (!section || !texts) return;

      const q = gsap.utils.selector(section);
      const cards = q(".nxr-intro-card");

      if (prefersReduced) {
        gsap.set([texts, ...cards], { visibility: "visible" });
        return;
      }

      gsap.set(texts, { opacity: 0, y: 40 });
      gsap.set(cards, { opacity: 0, y: 40 });
      // CSS keeps these `visibility: hidden` until here (see globals.css) —
      // without this, they'd flash fully visible for a frame on first paint,
      // before this layout effect has a chance to run.
      gsap.set([texts, ...cards], { visibility: "visible" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: texts,
          start: "top bottom",
          // Mobile gets noticeably more runway than desktop so the text isn't
          // gone after just a small swipe — same phase timeline, just spread
          // over more scroll.
          // Nothing here is pinned, so the cards (which sit only a few px
          // below the text in normal document flow) physically scroll up the
          // screen by the SAME amount as whatever this range spends on the
          // text phase — a bigger range buys the text more reading time but
          // also drags the cards further up-screen before their own tween
          // finishes. These values are tuned together with the cards' tween
          // below (duration/stagger) so the text keeps the same ~930px/~670px
          // (mobile/desktop) reading budget as before, while the cards' own
          // fade-in now burns much less EXTRA scroll after the text is gone
          // — see check via scratchpad/measure-intro.mjs if retuning this.
          // Desktop got noticeably more runway back (620→860) after the text
          // phase read as rushing by — that first shortening overshot. The
          // card phases keep their overlap-with-text-out timing, so the cards
          // still show up early; only the per-phase scroll budget grew.
          end: () => (window.innerWidth < 768 ? "+=840" : "+=860"),
          scrub: 0.6,
        },
      });

      // Phase 1 — the text rises and fades IN as it scrolls up into view.
      tl.to(texts, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, 0);
      // Hold — readable, but short: the old 1.2 hold (plus a text-out that
      // didn't start until 2.2 and cards that waited for it to FULLY finish
      // at 3.2 of 3.4) meant the cards only appeared in the last ~6% of a
      // long range — reported as "the cards show up way too late".
      tl.to({}, { duration: 0.7 }, 1);
      // Phase 2 — the SAME upward drift continues, now fading the text back
      // OUT, so it visibly leaves rather than just scrolling out of frame.
      tl.to(texts, { opacity: 0, y: -40, duration: 1, ease: "power2.in" }, 1.7);
      // Phase 3 — the cards rise in WHILE the text is still dissolving
      // (starts at 2.3, text-out ends 2.7): a crossfade hand-off reads as one
      // continuous composition instead of "text gone → dead scroll → cards".
      tl.to(cards, { opacity: 1, y: 0, duration: 0.25, stagger: 0.08, ease: "power2.out" }, 2.3);
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-intro" ref={sectionRef}>
      <div className="nxr-intro-inner">
        <div className="nxr-intro-left">
          <h2 className="nxr-intro-headline nxr-reveal" ref={titleRef}>
            Hacemos que
            <br />
            la tecnología
            <br />
            <span className="nxr-gradient-text-lime">trabaje por ti.</span>
          </h2>
        </div>

        <div className="nxr-intro-cards">
          <div className="nxr-intro-texts" ref={textsRef}>
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

          <div className="nxr-intro-card" id="nxr-intro-card-1">
            <WebAnim />
            <div className="nxr-intro-card-text">
              <span className="nxr-intro-col-num">01 — Construimos</span>
              <div className="nxr-intro-col-title">Tu presencia digital, hecha para vender.</div>
              <p className="nxr-intro-col-desc">
                Webs, aplicaciones y plataformas diseñadas desde cero para que tus clientes lleguen, entiendan lo que
                ofreces y contacten contigo.
              </p>
            </div>
          </div>

          <div className="nxr-intro-card" id="nxr-intro-card-2">
            <AutoAnim />
            <div className="nxr-intro-card-text">
              <span className="nxr-intro-col-num">02 — Automatizamos</span>
              <div className="nxr-intro-col-title">Tu negocio funcionando solo, 24/7.</div>
              <p className="nxr-intro-col-desc">
                Conectamos tus herramientas y creamos agentes de IA que eliminan el trabajo manual para que tu equipo se
                enfoque en lo importante.
              </p>
            </div>
          </div>

          <div className="nxr-intro-card" id="nxr-intro-card-3">
            <GrowAnim />
            <div className="nxr-intro-card-text">
              <span className="nxr-intro-col-num">03 — Hacemos crecer</span>
              <div className="nxr-intro-col-title">Más clientes encontrándote cada día.</div>
              <p className="nxr-intro-col-desc">
                Posicionamos tu negocio en Google para que los clientes te encuentren a ti, no a tu competencia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
