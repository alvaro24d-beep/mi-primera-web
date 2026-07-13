"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { nearSections } from "@/store/sceneActivity";

/**
 * Viscous scroll zone: progressively REDUCES the wheel scroll speed as the
 * page approaches the point where the target element engages its sticky
 * position, holds it slow through the reading window, and releases it back
 * to full speed as the block dissolves — so the sticky engagement lands in
 * slow motion ("que la velocidad del scroll se reduzca progresivamente al
 * llegar a la sección intro").
 *
 * Implemented by modulating the live Lenis instance's `wheelMultiplier`
 * every ticker frame with a trapezoid profile over the target's natural
 * (un-stuck) top, reconstructed as parentRect.top + baseOffset — NOT via
 * offsetTop, which Chrome folds the sticky displacement into (that bug made
 * a first version hold the brake until the sticky's container-end release,
 * ~1000px too long). The parent is never sticky, so its rect tracks the
 * true scroll flow; baseOffset (measured at init) absorbs the element's
 * constant layout + transform bias. Profile edges are smoothstepped and the
 * applied value is additionally chased with a temporal lerp, so the speed
 * change is never felt as a step. Wheel only, desktop only (>=901px): the
 * stickies don't exist on mobile, and touch inertia must stay
 * native-feeling (see SmoothScroll.tsx).
 */
const DEPTH = 0.85; // brake floor = 1 − DEPTH = 15% wheel speed ("casi el máximo de despacio")
const CHASE = 0.08; // per-frame temporal smoothing of the applied multiplier

export function useScrollBrake(
  rootRef: RefObject<HTMLElement | null>,
  selector: string,
  /** id of the hosting section (skips all work while it's far away). */
  sectionId: string,
  deps: readonly unknown[] = []
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(selector);
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const baseOffset = el.getBoundingClientRect().top - parent.getBoundingClientRect().top;
    let applied = 1;
    let base: number | null = null;

    const update = () => {
      const lenis = window.__nxrLenis;
      if (!lenis) return;
      if (base === null) base = lenis.options.wheelMultiplier ?? 1;

      let target = 1;
      if (window.innerWidth >= 901 && nearSections.has(sectionId)) {
        const nt = parent.getBoundingClientRect().top + baseOffset; // un-stuck top, viewport space
        const vh = window.innerHeight;
        // Where the sticky engages, in the same measured space: the CSS top
        // is calc(50% + 70px) (the +70 compensates useDampedSticky's eased
        // resting deficit) and the -50% centering transform halves the
        // height out — stuck top = 50vh + 70 − h/2.
        const engage = 0.5 * vh + 70 - 0.5 * el.offsetHeight;
        // VALLEY profile, deepest exactly AT the engagement: the scroll
        // slows progressively over ~0.6vh of approach down to near-stop,
        // and once the title/paragraph are stuck it recovers to full speed
        // within ~260px ("al quedarse sticky... volver a ser normal").
        const d = nt - engage; // px until engagement (>0 approaching, <0 stuck)
        const rampIn = Math.min(1, Math.max(0, (0.6 * vh - d) / (0.6 * vh)));
        const rampOut = Math.min(1, Math.max(0, (d + 260) / 260));
        const t = Math.min(rampIn, rampOut);
        const eased = t * t * (3 - 2 * t); // smoothstep the valley walls
        target = 1 - DEPTH * eased;
      }

      applied += (target - applied) * CHASE;
      if (Math.abs(applied - target) < 0.002) applied = target;
      lenis.options.wheelMultiplier = base * applied;
    };
    gsap.ticker.add(update);

    return () => {
      gsap.ticker.remove(update);
      const lenis = window.__nxrLenis;
      if (lenis && base !== null) lenis.options.wheelMultiplier = base;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
