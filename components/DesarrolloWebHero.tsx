"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import BrowserBuild from "./dwh/BrowserBuild";

// Three.js + R3F + drei + postprocessing is by far the heaviest JS on this
// route. Load it as a separate chunk after hydration (`ssr: false`) so it
// doesn't block first paint / interactivity (Total Blocking Time, Speed Index).
// The canvas is `opacity:0` until the title-intro finishes scrolling anyway, so
// arriving a beat later is invisible.
const HeroScene = dynamic(() => import("./dwh/HeroScene"), { ssr: false });
import { FACETS } from "./dwh/facets";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const PERF_C = 2 * Math.PI * 26;

export default function DesarrolloWebHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Mouse-driven 3D tilt of the browser rig (separate from the scroll timeline).
  useEffect(() => {
    if (reducedMotion) return;
    const tilt = sectionRef.current?.querySelector<HTMLElement>(".nxr-bw-tilt");
    if (!tilt) return;
    const rotY = gsap.quickTo(tilt, "rotationY", { duration: 0.7, ease: "power2" });
    const rotX = gsap.quickTo(tilt, "rotationX", { duration: 0.7, ease: "power2" });
    const onMove = (e: MouseEvent) => {
      rotY((e.clientX / window.innerWidth - 0.5) * 12);
      rotX(-(e.clientY / window.innerHeight - 0.5) * 8);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reducedMotion]);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;

      const q = gsap.utils.selector(section);
      const head = q(".nxr-dwh-head")[0] as HTMLElement | undefined;
      const canvasWrap = q(".nxr-dwh-canvas-wrap")[0] as HTMLElement | undefined;
      const browser = q(".nxr-bw-browser")[0] as HTMLElement | undefined;
      const statNum = q(".nxr-bw-stat-num")[0] as HTMLElement | undefined;
      const perfNum = q(".nxr-bw-perf-num")[0] as HTMLElement | undefined;
      const pctEl = q(".nxr-bw-progress-pct")[0] as HTMLElement | undefined;
      const statusEl = q(".nxr-bw-status-text")[0] as HTMLElement | undefined;
      const labels = q(".nxr-dwh-layer-label");
      const facetPanel = q(".nxr-dwh-layers-panel")[0] as HTMLElement | undefined;
      const mobile = window.innerWidth < 768;

      // ---- Title-intro geometry: the headline starts BIG at mid-height and
      // shrinks to its resting top-left spot. Left-anchored (origin left top),
      // translated up to the vertical centre; only Y + scale animate (GPU).
      const S = mobile ? 1.25 : 1.8;
      const vh = window.innerHeight;
      const restTop = head ? parseFloat(getComputedStyle(head).top) || 44 : 44;
      const hh = head ? head.offsetHeight : 120;
      const y0 = vh / 2 - restTop - (hh * S) / 2;
      if (head) gsap.set(head, { transformOrigin: "left top", scale: S, y: y0 });

      // ---- Everything except the title is hidden at load ("sin nada más").
      gsap.set(canvasWrap ?? [], { opacity: 0 });
      gsap.set(facetPanel ?? [], { opacity: 0, y: 24 });
      // Starts strongly angled + small; it turns toward you and grows across
      // the whole build (see the long tween below) so the browser visibly
      // MOVES with the scroll, not just fills in.
      gsap.set(q(".nxr-bw-browser"), { opacity: 0, rotateY: -30, rotateX: 12, scale: 0.88 });
      gsap.set(q(".nxr-bw-wire"), { opacity: 0, scale: 0.9, transformOrigin: "left center" });
      gsap.set(q(".nxr-bw-fill"), { opacity: 0 });
      gsap.set(q(".nxr-bw-url-text"), { opacity: 0 });
      gsap.set(q(".nxr-bw-perf"), { opacity: 0, scale: 0.6 });
      gsap.set(q(".nxr-bw-perf-ring"), { strokeDashoffset: PERF_C });
      gsap.set(q(".nxr-bw-data"), { opacity: 0, y: 10 });
      gsap.set(q(".nxr-bw-bar"), { scaleY: 0.08, transformOrigin: "bottom center" });
      gsap.set(q(".nxr-bw-phone"), { opacity: 0, xPercent: 45, rotateY: -45 });
      gsap.set(q(".nxr-bw-chip"), { opacity: 0, scale: 0.6 });
      gsap.set(q(".nxr-bw-livebadge"), { opacity: 0, scale: 0.6, y: -6 });
      gsap.set(q(".nxr-bw-progress-fill"), { scaleX: 0 });
      gsap.set(labels, { opacity: 0, filter: "blur(10px)" });

      // Now that every animated piece is in its hidden start state, reveal the
      // containers that CSS keeps `visibility:hidden` until here — this prevents
      // the finished, server-rendered browser from flashing on first paint
      // (before this layout effect runs) and vanishing once GSAP initialises.
      gsap.set([q(".nxr-bw-scene"), facetPanel ?? []].flat(), { visibility: "visible" });

      if (statNum) statNum.textContent = "0";
      if (perfNum) perfNum.textContent = "0";
      if (pctEl) pctEl.textContent = "0%";
      if (statusEl) statusEl.textContent = "Iniciando…";

      const statProxy = { val: 0 };
      const perfProxy = { val: 0 };
      const pctProxy = { val: 0 };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => (window.innerWidth < 768 ? "+=460%" : "+=540%"),
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // ===== PHASE A — title intro: big centred → small top-left =====
      tl.to(head ?? {}, { scale: 1, y: 0, duration: 1.4, ease: "power2.inOut" }, 0);
      // As the title reaches the top, the scene + browser appear.
      tl.to(canvasWrap ?? {}, { opacity: 1, duration: 0.6 }, 1.0);
      tl.to(q(".nxr-bw-browser"), { opacity: 1, duration: 0.6, ease: "power2.out" }, 1.15);
      tl.to(facetPanel ?? {}, { opacity: 1, y: 0, duration: 0.5 }, 1.25);

      // Continuous scroll-driven MOTION of the whole window across the build:
      // it turns from a steep 3/4 view toward face-on and grows to full size,
      // with a couple of eased waypoints so the rotation keeps changing (feels
      // alive / advancing) rather than settling early.
      tl.to(q(".nxr-bw-browser"), { rotateY: -18, rotateX: 8, scale: 0.95, duration: 1.6, ease: "sine.inOut" }, 1.4);
      tl.to(q(".nxr-bw-browser"), { rotateY: -13, rotateX: 5, duration: 1.4, ease: "sine.inOut" }, 3.0);
      tl.to(q(".nxr-bw-browser"), { rotateY: -6, rotateX: 3, scale: 1, duration: 1.4, ease: "power1.inOut" }, 4.2);
      tl.to(q(".nxr-bw-browser"), { rotateY: -9, duration: 0.6, ease: "sine.inOut" }, 5.6);
      if (labels[0]) tl.to(labels[0], { opacity: 1, filter: "blur(0px)", duration: 0.4 }, 1.3);

      // ===== Progress bar + status text (drives % and stage label from the
      // build progress, so it stays correct scrubbing in BOTH directions) =====
      tl.to(
        pctProxy,
        {
          val: 100,
          duration: 3.65,
          ease: "none",
          onUpdate: () => {
            const v = pctProxy.val;
            if (pctEl) pctEl.textContent = `${Math.round(v)}%`;
            let txt = "Maquetando…";
            if (v > 96) txt = "Publicado ✓";
            else if (v > 66) txt = "Optimizando…";
            else if (v > 42) txt = "Conectando datos…";
            else if (v > 17) txt = "Aplicando estilos…";
            if (statusEl && statusEl.textContent !== txt) statusEl.textContent = txt;
            if (browser) browser.classList.toggle("nxr-bw-live", v > 96);
          },
        },
        1.4
      );
      tl.to(q(".nxr-bw-progress-fill"), { scaleX: 1, duration: 3.65, ease: "none" }, 1.4);

      // ===== PHASE B — the build =====
      // Stage 1 — Diseño: wireframe skeleton (nav, hero, line, cards)
      tl.to(q(".nxr-bw-wire"), { opacity: 1, scale: 1, duration: 0.7, stagger: 0.05, ease: "power2.out" }, 1.45);
      crossfadeFacet(tl, labels, 0, 1, 2.3);

      // Stage 2 — Frontend: colour fills, hero image, headline, CTA, nav button
      tl.to(q(".nxr-bw-fill"), { opacity: 1, duration: 0.6, stagger: 0.045, ease: "power2.out" }, 2.35);
      tl.to(q(".nxr-bw-url-text"), { opacity: 1, duration: 0.4 }, 2.4);
      tl.to(q(".nxr-bw-chip-code"), { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, 2.7);
      crossfadeFacet(tl, labels, 1, 2, 3.3);

      // Stage 3 — Backend & Datos: data panel + chart bars grow + users count
      tl.to(q(".nxr-bw-data"), { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 3.35);
      tl.to(q(".nxr-bw-bar"), { scaleY: 1, duration: 0.55, stagger: 0.08, ease: "back.out(1.4)" }, 3.5);
      tl.to(
        statProxy,
        {
          val: 2840,
          duration: 0.9,
          ease: "power1.out",
          onUpdate: () => {
            if (statNum) statNum.textContent = Math.round(statProxy.val).toLocaleString("es-ES");
          },
        },
        3.5
      );
      crossfadeFacet(tl, labels, 2, 3, 4.2);

      // Stage 4 — Rendimiento & SEO: perf ring sweeps to 98, phone docks
      tl.to(q(".nxr-bw-perf"), { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, 4.25);
      tl.to(q(".nxr-bw-perf-ring"), { strokeDashoffset: PERF_C * 0.02, duration: 0.9, ease: "power1.out" }, 4.25);
      tl.to(
        perfProxy,
        {
          val: 98,
          duration: 0.9,
          onUpdate: () => {
            if (perfNum) perfNum.textContent = String(Math.round(perfProxy.val));
          },
        },
        4.25
      );
      tl.to(q(".nxr-bw-phone"), { opacity: 1, xPercent: 0, rotateY: -14, duration: 0.9, ease: "power3.out" }, 4.4);
      tl.to(q(".nxr-bw-chip-perf"), { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, 4.7);

      // Final — published / live
      tl.to(q(".nxr-bw-livebadge"), { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }, 5.05);

      // Hold so the finished, settled site is what's on screen at the pin end.
      tl.to({}, { duration: 0.5 }, 5.6);

      // Idle breathing (independent of scroll).
      gsap.to(q(".nxr-bw-float"), { yPercent: -2.2, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  if (reducedMotion) {
    return (
      <section key="static" id="nxr-dwh-hero" className="nxr-dwh-hero nxr-dwh-static">
        <div className="nxr-dwh-head">
          <p className="nxr-section-label">Desarrollo web</p>
          <h1 className="nxr-dwh-h1">
            Construimos tu web,
            <br />
            <span className="nxr-gradient-text-lime">pieza a pieza.</span>
          </h1>
        </div>
        <div className="nxr-dwh-static-grid">
          {FACETS.map((f, i) => (
            <div key={f.title} className="nxr-dwh-static-card nxr-glass-edge">
              <span className="nxr-glass-edge-content">
                <span className="nxr-dwh-layer-num" style={{ color: f.color }}>
                  0{i + 1}
                </span>
                <span className="nxr-dwh-layer-title">{f.title}</span>
                <span className="nxr-dwh-layer-desc">{f.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section key="animated" id="nxr-dwh-hero" className="nxr-dwh-hero" ref={sectionRef}>
      <div className="nxr-dwh-stage" ref={stageRef}>
        <div className="nxr-dwh-canvas-wrap">
          <HeroScene />
        </div>
        <BrowserBuild />
        <div className="nxr-dwh-overlay">
          <div className="nxr-dwh-head">
            <p className="nxr-section-label">Desarrollo web</p>
            <h1 className="nxr-dwh-h1">
              Construimos tu web,
              <br />
              <span className="nxr-gradient-text-lime">pieza a pieza.</span>
            </h1>
          </div>
          <div className="nxr-dwh-layers-panel nxr-glass-edge">
            <div className="nxr-glass-edge-content nxr-dwh-layers-inner">
              {FACETS.map((f, i) => (
                <div key={f.title} className="nxr-dwh-layer-label">
                  <span className="nxr-dwh-layer-num" style={{ color: f.color }}>
                    0{i + 1}
                  </span>
                  <div>
                    <div className="nxr-dwh-layer-title">{f.title}</div>
                    <div className="nxr-dwh-layer-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Progressive blur crossfade between two stacked facet labels on the scrubbed
// timeline so it eases with scroll rather than snapping.
function crossfadeFacet(tl: gsap.core.Timeline, labels: Element[], from: number, to: number, at: number) {
  if (labels[from]) tl.to(labels[from], { opacity: 0, filter: "blur(10px)", duration: 0.5, ease: "power1.inOut" }, at);
  if (labels[to]) tl.to(labels[to], { opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power1.inOut" }, at);
}
