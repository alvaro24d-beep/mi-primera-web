"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGlassPanels } from "@/hooks/useGlassPanels";

const ARROW = (
  <svg
    className="nxr-hero-cta-arrow"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

function HeroCopy() {
  return (
    <div className="nxr-hero-center">
      <h1 className="nxr-hero-h1 nxr-reveal nxr-reveal-delay-2">
        Tu empresa en
        <br />
        <span className="nxr-gradient-text-lime">piloto automático.</span>
      </h1>

      <p className="nxr-hero-sub nxr-reveal nxr-reveal-delay-3">
        Webs, agentes de IA, automatizaciones y apps que trabajan por ti mientras tú te enfocas en crecer.
      </p>

      <div className="nxr-hero-actions nxr-reveal nxr-reveal-delay-4">
        <Link href="/contacto" className="nxr-btn-secondary">
          <span className="nxr-hero-cta-text">Empezar proyecto</span>
          {ARROW}
        </Link>
      </div>
    </div>
  );
}

function MasteryLines() {
  return (
    <>
      <span className="nxr-hero-mastery-line-wrap">
        <span className="nxr-hero-mastery-line">Construido con maestría.</span>
      </span>
      <span className="nxr-hero-mastery-line-wrap">
        <span className="nxr-hero-mastery-line">Entregado con precisión.</span>
      </span>
    </>
  );
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // The "Empezar proyecto" CTA is a real volumetric liquid-glass panel (same
  // identity as the site's cards) — the DOM button keeps layout/label only;
  // its CSS glass is stripped (see #nxr-hero .nxr-btn-secondary). The mesh
  // inherits the hero's scroll-out fade through the anchor-opacity walk in
  // GlassPanelsLayer, and its rect (scaled by the hero's exit `scale` tween)
  // is tracked per frame.
  useGlassPanels(sectionRef, ".nxr-btn-secondary", "#141018", [reducedMotion]);

  useEffect(() => {
    // Mobile browsers can still have their address bar shown at the exact
    // moment of mount, so `window.innerHeight` here may be shorter than the
    // real, settled viewport. Without tracking resize, `.nxr-hero-stage` stays
    // locked to that too-short height for the whole session, and its centered
    // content ends up reading as sitting too high once the toolbar hides and
    // reveals the extra space below. ScrollTrigger's own pin/scroll-distance
    // math already ignores toolbar-driven resizes (`ignoreMobileResize` in
    // SmoothScroll.tsx), so updating this CSS variable live doesn't fight it.
    const set = () => document.documentElement.style.setProperty("--vh-100", `${window.innerHeight}px`);
    set();
    window.addEventListener("resize", set, { passive: true });
    return () => window.removeEventListener("resize", set);
  }, []);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;

      const q = gsap.utils.selector(section);
      const fade = q(".nxr-hero-fade")[0] as HTMLElement | undefined;
      const mastery = q(".nxr-hero-mastery")[0] as HTMLElement | undefined;
      const lines = q(".nxr-hero-mastery-line");

      // V16.23 — ENTRADA POR ESCRITURA A MÁQUINA ("quiero que sea de
      // animación de escritura", en vez del rise enmascarado que subía
      // desde abajo). Las líneas se quedan en su sitio (yPercent 0) y lo
      // que entra son los CARACTERES, revelados en orden por un tween
      // scrubbed en la fase 2: se escriben al bajar y se des-escriben al
      // subir, deterministas como el resto del pin. El wrap con overflow
      // hidden se conserva porque la SALIDA (fase 3, yPercent -100) sigue
      // siendo el barrido hacia arriba de siempre ("la de salida se queda
      // igual"). Los spans reutilizan las clases .nxr-zp-tw del typewriter
      // de ZoomParallax (mismo mecanismo: visibility por carácter sobre
      // layout pre-renderizado, cero reflow).
      gsap.set(lines, { yPercent: 0 });
      const twChars: HTMLElement[] = [];
      (lines as HTMLElement[]).forEach((line) => {
        Array.from(line.childNodes).forEach((node) => {
          if (node.nodeType !== Node.TEXT_NODE) return;
          const text = node.textContent ?? "";
          if (!text.trim()) return;
          const frag = document.createDocumentFragment();
          for (const ch of text) {
            if (ch === " ") {
              frag.appendChild(document.createTextNode(" "));
            } else {
              const s = document.createElement("span");
              s.className = "nxr-zp-tw";
              s.textContent = ch;
              frag.appendChild(s);
              twChars.push(s);
            }
          }
          (node as ChildNode).replaceWith(frag);
        });
      });
      const caret = document.createElement("span");
      caret.className = "nxr-zp-twcaret";
      caret.setAttribute("aria-hidden", "true");
      // CSS keeps `.nxr-hero-mastery` `visibility: hidden` until here — without
      // this, the text (which has no CSS-level hiding, only the JS-driven
      // yPercent above) flashes fully visible for a frame on first paint,
      // before this layout effect has a chance to run.
      gsap.set(mastery ?? [], { visibility: "visible" });

      // One-time entrance (page load), independent of scroll: the hero starts
      // blurred and quickly resolves to sharp, rather than snapping in fully
      // crisp. Plays once on mount, well before the user typically starts
      // scrolling, so it doesn't fight the scroll-driven exit blur below (both
      // animate the same `filter` property, just at different times).
      if (fade) gsap.from(fade, { filter: "blur(20px)", duration: 0.8, ease: "power2.out" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // Mobile: 160% (was 220%) — the mastery phrases needed too many
          // swipes to get through ("que no haya que hacer tanto scroll").
          end: () => (window.innerWidth < 768 ? "+=160%" : "+=360%"),
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // ===== Phase 1 — the hero stays put but grows very slightly and blurs
      // out until it's fully gone (opacity 0). =====
      // `fromTo` (not `to`) is deliberate: the entrance blur above just set
      // `fade`'s filter inline via a synchronous `.from()` render, moments
      // before this tween is created. A plain `.to()` has no explicit start
      // value, so it silently records "whatever filter is right now" —
      // blur(20px), not the true resting `none` — as ITS start too. That
      // froze the scrubbed range to roughly [blur(20px), blur(18px)] instead
      // of [none, blur(18px)]: the hero read as blurry almost immediately on
      // any scroll, and scrolling back to the top restored blur(20px) instead
      // of sharp. Explicit `from` values sidestep the capture entirely.
      tl.fromTo(
        fade ?? {},
        { scale: 1, opacity: 1, filter: "blur(0px)" },
        { scale: 1.06, filter: "blur(18px)", opacity: 0, duration: 1, ease: "power1.in" },
        0
      );

      // ===== Phase 2 — "Construido con maestría." / "Entregado con
      // precisión." se ESCRIBEN carácter a carácter, atadas al scrub
      // (reversibles), con el caret persiguiendo al último carácter. =====
      const twProxy = { n: 0 };
      let twShown = -1;
      tl.to(
        twProxy,
        {
          n: twChars.length,
          duration: 1,
          ease: "none",
          onUpdate: () => {
            const k = Math.round(twProxy.n);
            if (k === twShown) return;
            twShown = k;
            twChars.forEach((c, i) => c.classList.toggle("nxr-zp-tw-on", i < k));
            if (k > 0 && k < twChars.length) {
              twChars[k - 1].insertAdjacentElement("afterend", caret);
            } else {
              caret.remove();
            }
          },
        },
        1.1
      );

      // Hold so it's readable.
      tl.to({}, { duration: 0.6 }, 2.1);

      // ===== Phase 3 — the SAME upward sweep continues past 0, so the text
      // exits by rising and getting cut off at the top edge of its line. =====
      tl.to(lines, { yPercent: -100, duration: 1, ease: "power1.in" }, 2.7);
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  if (reducedMotion) {
    return (
      <>
        <section key="static" id="nxr-hero" className="nxr-hero-static" ref={sectionRef}>
          <HeroCopy />
        </section>
        <div className="nxr-hero-mastery-static">
          <p className="nxr-hero-mastery-line">Construido con maestría.</p>
          <p className="nxr-hero-mastery-line">Entregado con precisión.</p>
        </div>
      </>
    );
  }

  return (
    <section key="animated" id="nxr-hero" ref={sectionRef}>
      <div className="nxr-hero-stage" ref={stageRef}>
        <div className="nxr-hero-fade">
          <HeroCopy />
        </div>
        <h2 className="nxr-hero-mastery">
          <MasteryLines />
        </h2>
      </div>
    </section>
  );
}
