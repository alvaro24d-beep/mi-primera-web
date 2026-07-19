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

    // EXPERIMENTO V16.17 ("prueba a volver a los ajustes predeterminados
    // de Lenis"): SOLO quedan los dos ajustes ESTRUCTURALES — autoRaf
    // false (el rAF lo llevamos nosotros junto a ScrollTrigger.update) y
    // syncTouch true (sin él, el scroll táctil es nativo/asíncrono y las
    // cards de cristal WebGL, posicionadas por frame desde rects DOM, van
    // un frame por detrás del contenido en móvil — no es tuning, es
    // requisito de la arquitectura). Todo lo demás, de serie: lerp 0.1,
    // syncTouchLerp 0.075, touchInertiaExponent 1.7, touchMultiplier 1.
    // También se retiró el TOPE de alcance por flick (1.35 pantallas, el
    // listener capFlickReach) — sin él, un flick fuerte puede volar varias
    // secciones (|v|^1.7 sin límite; fue el motivo original del tope).
    // Afinado anterior por si se revierte: lerp 0.1, syncTouchLerp 0.04,
    // touchInertiaExponent 1.85, touchMultiplier 0.8, cap 1.35·vh.
    const lenis = new Lenis({
      autoRaf: false,
      syncTouch: true,
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
