"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import IphoneMock from "./dwh/IphoneMock";
import DecryptedText from "./DecryptedText";

// Three.js + R3F + drei + postprocessing is by far the heaviest JS on this
// route. Load it as a separate chunk after hydration (`ssr: false`) so it
// doesn't block first paint / interactivity (Total Blocking Time, Speed Index).
// The canvas is `opacity:0` until the title-intro finishes scrolling anyway, so
// arriving a beat later is invisible.
const HeroScene = dynamic(() => import("./dwh/HeroScene"), { ssr: false });
import { FACETS } from "./dwh/facets";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function DesarrolloWebHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Mouse-driven 3D tilt of the iPhone rig (separate from the scroll
  // timeline): with the scene's strong perspective, even ±6° reads deep.
  useEffect(() => {
    if (reducedMotion) return;
    const tilt = sectionRef.current?.querySelector<HTMLElement>(".nxr-ip-tilt");
    if (!tilt) return;
    const rotY = gsap.quickTo(tilt, "rotationY", { duration: 0.7, ease: "power2" });
    const rotX = gsap.quickTo(tilt, "rotationX", { duration: 0.7, ease: "power2" });
    const onMove = (e: MouseEvent) => {
      rotY((e.clientX / window.innerWidth - 0.5) * 10);
      rotX(-(e.clientY / window.innerHeight - 0.5) * 7);
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
      const rig = q(".nxr-ip-rig")[0] as HTMLElement | undefined;
      const labels = q(".nxr-dwh-layer-label");
      const facetPanel = q(".nxr-dwh-layers-panel")[0] as HTMLElement | undefined;
      const mobile = window.innerWidth < 768;

      // The mobile `.nxr-dwh-stage` height is driven by this SAME window.innerHeight
      // reading (see globals.css: `calc(var(--dwh-vh) - 70px)`) rather than the
      // CSS `100lvh` unit — Safari and Chrome define/report the "large viewport"
      // (toolbar-collapsed) height differently, which visibly shifted the mockup
      // + facet cards between the two. One real JS measurement, used by both the
      // stage box AND the title geometry below, keeps every mobile browser
      // pixel-consistent.
      if (mobile) section.style.setProperty("--dwh-vh", `${window.innerHeight}px`);

      // ---- Title-intro geometry: the headline starts BIG at mid-height.
      // On scroll it exits STRAIGHT UP off-screen (total redesign: no more
      // shrinking to a resting top-left spot) while the MacBook rises in.
      const S = mobile ? 1.25 : 1.8;
      const vh = window.innerHeight;
      const restTop = head ? parseFloat(getComputedStyle(head).top) || 44 : 44;
      const hh = head ? head.offsetHeight : 120;
      const y0 = vh / 2 - restTop - (hh * S) / 2;
      if (head) gsap.set(head, { transformOrigin: "left top", scale: S, y: y0 });

      // ---- On mobile, centre the iPhone in the REAL band between the top
      // edge and the facet card's top edge, measured live — the facet card
      // height varies per phone.
      if (mobile) {
        const scene = q(".nxr-ip-scene")[0] as HTMLElement | undefined;
        if (scene && facetPanel) {
          const stageHeight = stage.offsetHeight;
          const panelBottomOffset = parseFloat(getComputedStyle(facetPanel).bottom) || 0;
          const panelTop = stageHeight - panelBottomOffset - facetPanel.offsetHeight;
          // Sin título en reposo, la banda útil va del margen superior (64px
          // de header) al borde del panel de facetas.
          const bandCenter = (64 + panelTop) / 2;
          scene.style.paddingBottom = `${Math.max(0, stageHeight - 2 * bandCenter)}px`;
        }
      }

      // ---- Hidden start states.
      gsap.set(canvasWrap ?? [], { opacity: 0 });
      gsap.set(facetPanel ?? [], { opacity: 0, y: 24 });
      // El iPhone espera abajo, tumbado y en profundidad — la entrada 3D
      // firma del CinematicHero portado (V16.76): sube enderezándose desde
      // z -500 con expo.out. transformPerspective da el escorzo real.
      gsap.set(rig ?? [], {
        y: vh * 0.42,
        z: -500,
        rotationX: 50,
        rotationY: -30,
        scale: 0.6,
        autoAlpha: 0,
        transformPerspective: 1000,
      });
      // Piezas de la web del teléfono: caen desde arriba en su franja
      // (construcción descendente, mismo lenguaje que tenía el Mac).
      gsap.set(q(".nxr-ip-w-nav, .nxr-ip-w-stats, .nxr-ip-w-footer, .nxr-ip-w-hero > *, .nxr-ip-w-card"), {
        opacity: 0,
        y: -14,
      });
      gsap.set(labels, { opacity: 0, filter: "blur(10px)" });

      // Reveal the containers CSS keeps `visibility:hidden` until here (stops
      // the finished server-rendered page flashing before this effect runs).
      gsap.set([q(".nxr-ip-scene"), facetPanel ?? []].flat(), { visibility: "visible" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // V16.20 "que la animación se pase con menos scroll": ~30% menos
          // pin en ambos dispositivos. scrub normaliza la timeline completa
          // sobre esta distancia, así que comprime proporcionalmente sin
          // tocar los offsets.
          end: () => (window.innerWidth < 768 ? "+=320%" : "+=380%"),
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // ===== PHASE A — el título sale RECTO hacia arriba =====
      tl.to(head ?? {}, { y: -(restTop + hh * S + vh * 0.08), duration: 1.15, ease: "power2.in" }, 0);

      // ===== El iPhone ENTRA desde profundidad y se endereza (mucho 3D) =====
      tl.to(canvasWrap ?? {}, { opacity: 1, duration: 0.6 }, 0.6);
      tl.to(rig ?? {}, { autoAlpha: 1, duration: 0.3 }, 0.55);
      tl.to(
        rig ?? {},
        { y: 0, z: 0, rotationX: 0, rotationY: 0, scale: mobile ? 0.98 : 1, duration: 2.0, ease: "expo.out" },
        0.6
      );
      tl.to(facetPanel ?? {}, { opacity: 1, y: 0, duration: 0.5 }, 1.15);
      if (labels[0]) tl.to(labels[0], { opacity: 1, filter: "blur(0px)", duration: 0.4 }, 1.3);
      // Deriva 3D continua durante TODO el build: crece y gira un pelín —
      // nunca se queda quieto. (Empieza tras acabar la entrada: dos tweens
      // de las mismas propiedades no deben solaparse.)
      tl.to(rig ?? {}, { scale: mobile ? 1.03 : 1.08, rotationY: 5, duration: 3.1, ease: "sine.inOut" }, 2.65);

      // ===== La web se CONSTRUYE de arriba hacia abajo en la pantalla =====
      const reveal = (sel: string, at: number, stagger = 0) =>
        tl.to(q(sel), { opacity: 1, y: 0, duration: 0.5, stagger, ease: "power2.out" }, at);

      reveal(".nxr-ip-w-nav", 1.75);
      reveal(".nxr-ip-w-hero > *", 2.05, 0.09);
      crossfadeFacet(tl, labels, 0, 1, 2.7);
      reveal(".nxr-ip-w-card", 2.95, 0.14);
      crossfadeFacet(tl, labels, 1, 2, 3.5);
      reveal(".nxr-ip-w-stats", 3.75);
      crossfadeFacet(tl, labels, 2, 3, 4.4);
      reveal(".nxr-ip-w-footer", 4.55);

      // Hold so the finished site is what's on screen at the pin end.
      tl.to({}, { duration: 0.5 }, 5.1);

      // Navegación cliente: este efecto corre ANTES que el del template que
      // resetea el scroll a 0 (los efectos de React van de hijo a padre),
      // así que el ScrollTrigger puede nacer con el scroll de la página
      // ANTERIOR (progreso ≈ 1 → renderiza el portátil abierto) y el scrub
      // de 0.6 perseguía la vuelta a 0 a la vista ("el ordenador está en
      // posición abierta y luego pliega de golpe"). Un frame después del
      // montaje, cuando el template ya ha movido el scroll, completamos el
      // catch-up del scrub al instante — sin persecución visible.
      requestAnimationFrame(() => {
        const st = tl.scrollTrigger;
        if (!st) return;
        st.update();
        const scrubTween = typeof st.getTween === "function" ? st.getTween() : null;
        if (scrubTween) scrubTween.progress(1);
      });

      // Idle breathing (independent of scroll).
      gsap.to(q(".nxr-ip-float"), { yPercent: -2, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  if (reducedMotion) {
    return (
      <section key="static" id="nxr-dwh-hero" className="nxr-dwh-hero nxr-dwh-static">
        <div className="nxr-dwh-head">
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
        <IphoneMock />
        <div className="nxr-dwh-overlay">
          <div className="nxr-dwh-head">
            {/* DecryptedText (React Bits, adapted): the headline "compiles"
                from code glyphs into words. SSR/SEO safe (real text in the
                sr-only twin). The reduced-motion branch renders a plain h1. */}
            <h1 className="nxr-dwh-h1">
              <DecryptedText
                text="Construimos tu web,"
                animateOn="view"
                sequential
                speed={40}
                characters={"</>{}[]()=#;$_"}
                encryptedClassName="nxr-decrypt-char"
              />
              <br />
              <span className="nxr-gradient-text-lime">
                <DecryptedText
                  text="pieza a pieza."
                  animateOn="view"
                  sequential
                  speed={55}
                  characters={"</>{}[]()=#;$_"}
                  encryptedClassName="nxr-decrypt-char"
                />
              </span>
            </h1>
          </div>
          <div className="nxr-dwh-layers-panel">
            <div className="nxr-dwh-layers-inner">
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
