"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import HeroScene from "./dwh/HeroScene";
import BrowserBuild from "./dwh/BrowserBuild";
import { FACETS } from "./dwh/facets";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const PERF_C = 2 * Math.PI * 26;

export default function DesarrolloWebHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Mouse-driven 3D tilt of the whole browser rig (separate from the scroll
  // build timeline so the two never fight over the same transform).
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
      const statNum = q(".nxr-bw-stat-num")[0] as HTMLElement | undefined;
      const perfNum = q(".nxr-bw-perf-num")[0] as HTMLElement | undefined;
      const browser = q(".nxr-bw-browser")[0] as HTMLElement | undefined;
      const labels = q(".nxr-dwh-layer-label");
      if (statNum) statNum.textContent = "0";
      if (perfNum) perfNum.textContent = "0";

      // Empty-wireframe starting state: the browser chrome is present from the
      // start (an empty window — a clear subject at rest), scaled down so it
      // never reaches under the headline (top) or the facet panel (bottom);
      // only its *content* builds up.
      gsap.set(q(".nxr-bw-browser"), { opacity: 1, rotateY: -15, rotateX: 6 });
      gsap.set(q(".nxr-bw-wire"), { opacity: 0, scale: 0.92, transformOrigin: "center" });
      gsap.set(q(".nxr-bw-fill"), { opacity: 0 });
      gsap.set(q(".nxr-bw-url-text"), { opacity: 0 });
      gsap.set(q(".nxr-bw-perf"), { opacity: 0, scale: 0.6 });
      gsap.set(q(".nxr-bw-perf-ring"), { strokeDashoffset: PERF_C });
      gsap.set(q(".nxr-bw-data"), { opacity: 0, y: 10 });
      gsap.set(q(".nxr-bw-phone"), { opacity: 0, xPercent: 45, rotateY: -45 });
      gsap.set(q(".nxr-bw-chip"), { opacity: 0, scale: 0.6 });
      gsap.set(q(".nxr-bw-cursor"), { left: "48%", top: "30%" });

      // Facet labels: all four stacked, only the first shown; they crossfade
      // with a progressive blur driven by scroll (not a hard swap).
      gsap.set(labels, { opacity: 0, filter: "blur(10px)" });
      if (labels[0]) gsap.set(labels[0], { opacity: 1, filter: "blur(0px)" });

      const statProxy = { val: 0 };
      const perfProxy = { val: 0 };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => (window.innerWidth < 768 ? "+=260%" : "+=320%"),
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Headline rises to the top as the sticky site header hides on scroll,
      // reclaiming that space.
      tl.to(q(".nxr-dwh-head"), { top: 44, duration: 0.4, ease: "power2.out" }, 0);

      // Stage 1 — Diseño UI/UX: wireframe skeleton drops in, cursor places blocks
      tl.to(q(".nxr-bw-wire"), { opacity: 1, scale: 1, duration: 0.8, stagger: 0.06, ease: "power2.out" }, 0.1);
      tl.to(q(".nxr-bw-cursor"), { left: "28%", top: "38%", duration: 0.5, ease: "power1.inOut" }, 0.2);
      tl.to(q(".nxr-bw-cursor"), { left: "64%", top: "58%", duration: 0.6, ease: "power1.inOut" }, 0.7);

      // Facet crossfade 01 -> 02 (progressive blur)
      crossfadeFacet(tl, labels, 0, 1, 0.8);

      // Stage 2 — Frontend & Contenido: colour + content + code chip
      tl.to(q(".nxr-bw-fill"), { opacity: 1, duration: 0.7, stagger: 0.05, ease: "power2.out" }, 1.0);
      tl.to(q(".nxr-bw-url-text"), { opacity: 1, duration: 0.4 }, 1.0);
      tl.to(q(".nxr-bw-cursor"), { left: "42%", top: "46%", duration: 0.6, ease: "power1.inOut" }, 1.1);
      tl.to(q(".nxr-bw-chip-code"), { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, 1.3);

      // Facet crossfade 02 -> 03
      crossfadeFacet(tl, labels, 1, 2, 1.8);

      // Stage 3 — Backend & Datos: data feeds in, users count up
      tl.to(q(".nxr-bw-data"), { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 2.0);
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
        2.0
      );

      // Facet crossfade 03 -> 04
      crossfadeFacet(tl, labels, 2, 3, 2.8);

      // Stage 4 — Rendimiento & SEO: perf ring sweeps to 98, phone docks, glow
      tl.to(q(".nxr-bw-perf"), { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, 3.0);
      tl.to(q(".nxr-bw-perf-ring"), { strokeDashoffset: PERF_C * 0.02, duration: 0.9, ease: "power1.out" }, 3.0);
      tl.to(
        perfProxy,
        {
          val: 98,
          duration: 0.9,
          onUpdate: () => {
            if (perfNum) perfNum.textContent = String(Math.round(perfProxy.val));
          },
        },
        3.0
      );
      tl.to(q(".nxr-bw-phone"), { opacity: 1, xPercent: 0, rotateY: -16, duration: 0.9, ease: "power3.out" }, 3.1);
      tl.to(q(".nxr-bw-chip-perf"), { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, 3.4);
      tl.to(
        {},
        {
          duration: 0.4,
          onStart: () => browser?.classList.add("nxr-bw-live"),
          onReverseComplete: () => browser?.classList.remove("nxr-bw-live"),
        },
        3.5
      );

      // Hold: the last slice of scroll leaves the finished site settled, so
      // unpinning never chops a mid-motion frame.
      tl.to({}, { duration: 0.6 }, 4.0);

      // Always-on idle breathing, independent of scroll — keeps the built
      // site alive at rest so the handoff out of the pin feels organic.
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
          <div className="nxr-dwh-head nxr-reveal">
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

// Progressive blur crossfade between two stacked facet labels, placed on the
// scroll-scrubbed timeline so it eases with the scroll rather than snapping.
function crossfadeFacet(tl: gsap.core.Timeline, labels: Element[], from: number, to: number, at: number) {
  if (labels[from]) tl.to(labels[from], { opacity: 0, filter: "blur(10px)", duration: 0.5, ease: "power1.inOut" }, at);
  if (labels[to]) tl.to(labels[to], { opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power1.inOut" }, at);
}
