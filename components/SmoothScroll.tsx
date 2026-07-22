"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Components that need to animate the scroll position programmatically
// (e.g. Servicios' card snap) MUST go through this instance — a plain
// window.scrollTo fights Lenis' own rAF-driven positioning. Exposed on
// window because the consumers live in a different React tree.
declare global {
  interface Window {
    __nxrLenis?: Lenis;
  }
}

export default function SmoothScroll() {
  useEffect(() => {
    // Mobile browsers (Chrome/Safari) show/hide their address bar as you scroll,
    // firing a `resize` that only changes viewport HEIGHT. By default that makes
    // ScrollTrigger.refresh() recompute every pin/end, which reflows the pinned
    // sections and visibly shoves the whole page up/down — exactly the "the bar
    // hides and leaves an empty gap that pushes the site up" glitch. Telling
    // ScrollTrigger to ignore that height-only mobile resize keeps the layout
    // rock-steady while the toolbar animates (pros do this on any pinned site).
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Base V16.17 (defaults de Lenis) + AJUSTE DE INERCIA TÁCTIL (V16.52,
    // petición: "que en móvil el scroll tarde más en detenerse al deslizar").
    // Estos dos parámetros SOLO afectan al scroll TÁCTIL (móvil); el desktop
    // usa rueda y no cambia:
    //   - syncTouchLerp 0.05 (default 0.075, más bajo): el deslizamiento
    //     decelera MÁS DESPACIO y tarda más en pararse (la cola de inercia es
    //     más larga).
    //   - touchInertiaExponent 1.9 (default 1.7): un poco más de inercia tras
    //     soltar el dedo, para que el flick avance algo más.
    // (autoRaf false y syncTouch true son ESTRUCTURALES — ver V16.17: el rAF
    // lo llevamos nosotros junto a ScrollTrigger.update, y sin syncTouch las
    // cards de cristal WebGL, posicionadas por frame desde rects DOM, irían un
    // frame por detrás del contenido en móvil.)
    // El reel de Servicios y ZP no dependen de esto: paginan por su cuenta en
    // touchend (glideTo con escrituras immediate que anulan la inercia de
    // Lenis) y su muro de primera llegada clampa cualquier flick fuerte.
    // Afinado anterior por si se revierte: syncTouchLerp 0.04,
    // touchInertiaExponent 1.85, touchMultiplier 0.8, cap 1.35·vh.
    const lenis = new Lenis({
      autoRaf: false,
      syncTouch: true,
      syncTouchLerp: 0.05,
      touchInertiaExponent: 1.9,
    });
    window.__nxrLenis = lenis;

    // Any ScrollTrigger created anywhere in the app (this is the only place
    // that should own a Lenis instance) needs to recompute on Lenis' own
    // scroll event, since Lenis drives scroll via rAF rather than firing
    // native `scroll` events at the same cadence ScrollTrigger expects.
    lenis.on("scroll", ScrollTrigger.update);

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      delete window.__nxrLenis;
      lenis.destroy();
    };
  }, []);

  return null;
}
