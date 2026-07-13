"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";

/**
 * Rounds off CSS `position: sticky`'s velocity corners WITHOUT any spring
 * feel ("no tiene que ser como un muelle"): the element decelerates smoothly
 * into its stuck position over EASE px of scroll, then sits PERFECTLY FIXED
 * (constant offset — zero creep, "el título tiene que quedarse fijo durante
 * el scroll de la sección"), then accelerates smoothly back to page speed
 * over EASE px at release. Implemented as a deterministic PIECEWISE-SPATIAL
 * remap of the browser's own sticky shift — a pure function of scroll
 * position, fully reversible when scrolling back, with no temporal chasing
 * (a previous lerp version read as a rubber band and was rejected).
 *
 *   raw  = browser's hard shift  = elRect.top − parentRect.top − baseOffset − lastDelta
 *   A(raw) = raw²/2E (raw<E) | raw − E/2      → engage corner rounded
 *   q    = scroll progressed past the RELEASE corner (derived below)
 *   B(q) = q − q²/2E (q<E) | E/2              → release corner rounded
 *   delta = A + B − raw   →  0 → −E/2 (constant while stuck) → 0
 *
 * The −E/2 resting deficit means the element settles E/2 px ABOVE where the
 * hard sticky would hold it — the sticky `top` values in CSS are bumped by
 * +E/2 (see the calc(50% + 70px) rules) so the damped resting line lands
 * exactly at the intended spot. Net displacement after release is ZERO (the
 * two rounded corners cancel), so layout continuity is preserved.
 *
 * Deriving from the browser's real shift (NOT offsetTop, which Chrome folds
 * the sticky displacement into) inherits both sticky constraints for free.
 * The release corner is detected without modeling the container: while the
 * shift is FOLLOWING the scroll, naturalTop + raw is invariant (it IS the
 * stuck line); once the browser releases, raw freezes and that sum starts
 * falling — so q = max(0, stuckLine − raw − naturalTop).
 *
 * The delta is written to the separate CSS `translate` PROPERTY, composing
 * BEFORE `transform` — it never fights the elements' own transforms (CSS
 * centering/tilt, GSAP opacity, useCurvedWords' inline transform).
 */
export const STICKY_EASE = 140; // px of scroll over which each corner is rounded

type Item = {
  el: HTMLElement;
  parent: HTMLElement;
  /** elRect.top − parentRect.top at init (un-stuck, delta 0): the constant
     layout+transform offset. Self-corrects if init happened mid-stick. */
  baseOffset: number;
  /** Max-ever of (naturalTop + raw): constant while the shift follows the
     scroll = the stuck line, in measured space. */
  stuckLine: number;
  near: boolean;
  lastDelta: number;
};

export function useDampedSticky(
  rootRef: RefObject<HTMLElement | null>,
  selector: string,
  deps: readonly unknown[] = []
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (!els.length) return;

    const items: Item[] = els
      .filter((el) => el.parentElement)
      .map((el) => ({
        el,
        parent: el.parentElement as HTMLElement,
        baseOffset: el.getBoundingClientRect().top - (el.parentElement as HTMLElement).getBoundingClientRect().top,
        stuckLine: -Infinity,
        near: false,
        lastDelta: 0,
      }));

    const E = STICKY_EASE;
    const update = () => {
      for (const it of items) {
        if (!it.near) continue;
        const elTop = it.el.getBoundingClientRect().top;
        const naturalTop = it.parent.getBoundingClientRect().top + it.baseOffset;
        let raw = elTop - naturalTop - it.lastDelta;
        if (raw < -0.5) {
          // Top-sticky shift can't be negative → baseOffset was measured
          // while already stuck; absorb the error.
          it.baseOffset += raw;
          raw = 0;
        } else if (raw < 0.5) {
          raw = 0; // sub-px noise floor
        }
        if (raw > 0) it.stuckLine = Math.max(it.stuckLine, naturalTop + raw);
        const q = raw > 0 ? Math.max(0, it.stuckLine - raw - naturalTop) : 0;

        const A = raw < E ? (raw * raw) / (2 * E) : raw - E / 2;
        const B = q < E ? q - (q * q) / (2 * E) : E / 2;
        const delta = A + B - raw;
        if (Math.abs(delta - it.lastDelta) > 0.05) {
          it.lastDelta = delta;
          it.el.style.translate = `0 ${delta.toFixed(1)}px`;
        }
      }
    };
    gsap.ticker.add(update);

    // Layout changes move the stuck line — relearn it.
    const reset = () => {
      for (const it of items) it.stuckLine = -Infinity;
    };
    window.addEventListener("resize", reset, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const it = items.find((x) => x.el === e.target);
          if (it) it.near = e.isIntersecting;
        }
      },
      { rootMargin: "200px 0px" }
    );
    items.forEach(({ el }) => io.observe(el));

    return () => {
      gsap.ticker.remove(update);
      window.removeEventListener("resize", reset);
      io.disconnect();
      items.forEach(({ el }) => {
        el.style.translate = "";
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
