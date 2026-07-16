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
      // Wheel smoothing only slightly snappier than Lenis' default 0.1 —
      // desktop feel, unchanged.
      lerp: 0.16,
      // Touch feel — the PHYSICS (from lenis source, so the knobs stop
      // being guessed at): on release, coast distance = |velocity| **
      // touchInertiaExponent, and the tail converges by lerping with
      // syncTouchLerp each frame. Higher exponent = flies farther; LOWER
      // lerp = takes longer to stop. History decoded with that in hand:
      // syncTouchLerp 0.18 braked (converged in a handful of frames), and
      // the old 1.2 exponent ALSO braked because 1.2 is BELOW the 1.7
      // default — both past reverts were the same knob-direction mistake.
      // Current tuning (petición: "que vaya más ligero, como el scroll
      // predeterminado de una web normal, que tarde más en pararse"):
      // exponent 2.0 → a medium flick coasts ~2-3× farther (native-like
      // momentum reach), lerp 0.055 → the glide takes ~1s to die instead
      // of ~0.65s. Servicios' one-card-per-swipe pagination is immune to
      // longer momentum: its glideTo writes `scrollTo(..., immediate)`
      // every frame (killing Lenis' internal inertia each write) and holds
      // until verifiably converged (see the holdFrames loop), and the
      // first-arrival wall clamps regardless of inertia.
      syncTouchLerp: 0.055,
      touchInertiaExponent: 2.0,
    });
    window.__nxrLenis = lenis;

    // Per-gesture reach CAP. The 2.0 inertia exponent gives medium flicks
    // their native-like glide, but the power curve explodes on HARD flicks
    // (|v|^2: at 80px/frame that's ~6400px — "deslizo una vez y se me
    // desplaza varias secciones"). Lenis has no built-in max, so: right
    // after it computes the release-inertia target (its own touchend
    // listener runs first — registered at init), clamp how far ahead of
    // the current position that target may sit. scrollTo with the same
    // syncTouchLerp keeps the braking tail's feel identical — hard flicks
    // just run out of runway at ~1.6 screens instead of 4+. Servicios'
    // pagination glides are unaffected (their per-frame immediate writes
    // overwrite any target this sets).
    const capFlickReach = () => {
      requestAnimationFrame(() => {
        const ahead = lenis.targetScroll - lenis.animatedScroll;
        const cap = window.innerHeight * 1.6;
        if (Math.abs(ahead) > cap) {
          lenis.scrollTo(lenis.animatedScroll + Math.sign(ahead) * cap, { lerp: 0.055 });
        }
      });
    };
    window.addEventListener("touchend", capFlickReach, { passive: true });

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
      window.removeEventListener("touchend", capFlickReach);
      delete window.__nxrLenis;
      lenis.destroy();
    };
  }, []);

  return null;
}
