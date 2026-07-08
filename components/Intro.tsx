"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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
          end: () => (window.innerWidth < 768 ? "+=1046" : "+=756"),
          scrub: 0.6,
        },
      });

      // Phase 1 — the text rises and fades IN as it scrolls up into view.
      tl.to(texts, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, 0);
      // Hold — readable for a stretch of scroll.
      tl.to({}, { duration: 1.2 }, 1);
      // Phase 2 — the SAME upward drift continues, now fading the text back
      // OUT, so it visibly leaves rather than just scrolling out of frame.
      tl.to(texts, { opacity: 0, y: -40, duration: 1, ease: "power2.in" }, 2.2);
      // Phase 3 — only once the text is fully gone do the cards rise in, one
      // after another. Kept short (vs. the text phases above) so they finish
      // shortly after the text disappears rather than continuing to consume
      // scroll — the longer this tween+stagger runs, the further the cards
      // have already drifted up the screen by the time they're fully visible.
      tl.to(cards, { opacity: 1, y: 0, duration: 0.2, stagger: 0.1, ease: "power2.out" }, 3.2);
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
