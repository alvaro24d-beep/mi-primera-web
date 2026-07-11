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

    const lenis = new Lenis({
      autoRaf: false,
      // Touch scrolling must ALSO be Lenis-driven (by default it stays
      // native/async, moved by the browser's compositor thread): with
      // native touch scroll the DOM visibly moves BEFORE any JS can read
      // its position, so the WebGL glass cards (positioned per-frame from
      // DOM rects, see components/scene/ServiciosCardsLayer.tsx) trailed
      // their content by a frame on phones. syncTouch makes touch scroll
      // advance inside Lenis' rAF — the same frame the scene reads.
      syncTouch: true,
      // Left at Lenis' own default (1.7) deliberately: an earlier tamer
      // value (1.2) made ALL touch scrolling site-wide decay faster/shorter
      // — since this is global, it read as the whole page "braking" under
      // your finger, not just the one section it was meant to help. The
      // Servicios card-snap doesn't actually need short inertia to settle
      // correctly — its own glide already re-writes the scroll position
      // every frame until it verifiably converges (see the `holdFrames`
      // loop in Servicios.tsx), which works fine against natural-length
      // momentum, it just takes a few more frames to win out.
      // Snappier catch-up than the defaults (wheel lerp 0.1, touch 0.075):
      // the heavier smoothing read as the page "braking" the scroll.
      lerp: 0.16,
      syncTouchLerp: 0.18,
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
