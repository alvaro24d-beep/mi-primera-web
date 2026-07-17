"use client";

import { useEffect } from "react";

// Global cursor drift ("que todo el contenido de la web se mueva un poco con
// el cursor — así da más sensación de 3D"): ONE mousemove listener easing two
// CSS variables on :root; globals.css applies them as a translate3d to a
// CURATED list of per-section content containers, in two depth tiers (the
// backdrop already counter-moves via SceneBackground's parallax, so content
// drifting toward the cursor over it completes the depth read).
//
// Why curated instead of one page wrapper: a transformed ancestor becomes the
// containing block of every position:fixed descendant — that would break ALL
// GSAP ScrollTrigger pins (pin = fixed) plus the fixed overlays (Servicios'
// phrase, nav, GradualBlur). The chosen containers all live BELOW their
// section's pin target, have no transform owner of their own (GSAP tweens /
// reveal transitions), and contain no fixed descendants. WebGL glass meshes
// need no wiring: they dock to live DOM rects every frame, so they ride the
// drift automatically.
//
// Desktop-only (pointer: fine — phones have no cursor and their GPUs are
// spared the extra compositing) and off under reduced motion. The rAF loop
// only runs while easing toward a fresh target — at rest it costs nothing
// (same philosophy as SceneBackground's cursor parallax).
const AX = 9; // px horizontal reach at the viewport edge
const AY = 6; // px vertical reach

export default function CursorDrift() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const root = document.documentElement;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    let running = false;

    const tick = () => {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      root.style.setProperty("--drift-x", cx.toFixed(2) + "px");
      root.style.setProperty("--drift-y", cy.toFixed(2) + "px");
      if (Math.abs(tx - cx) > 0.04 || Math.abs(ty - cy) > 0.04) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };
    const kick = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };
    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2 * AX;
      ty = (e.clientY / window.innerHeight - 0.5) * 2 * AY;
      kick();
    };
    // Cursor leaving the window: everything settles back to centre.
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
