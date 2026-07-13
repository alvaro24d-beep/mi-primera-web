"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

/**
 * Makes paragraph blocks read as genuinely CURVED sheets — matching the
 * concave TV-wall backdrop — instead of flat rotated planes ("las
 * distorsiones son lineales, tienen que ser curvas como el fondo").
 *
 * Two composed pieces:
 *  1. BLOCK level: the familiar perspective/rotateY tangent plane (owned here
 *     inline, not in CSS), giving the depth/size ramp toward the outer edge.
 *  2. WORD level: a 2D vertical FAN — every word shifts/leans so text lines
 *     bow apart toward the near edge with a parabolic profile, exactly how
 *     horizontal lines on the concave cylinder project on screen (see the
 *     wall's own bands). 2D-ONLY per-word transforms are deliberate: the
 *     title reveal already yPercent-animates chars inside the animated
 *     gradient titles safely, whereas per-word 3D (translateZ/rotateY/scale)
 *     was tried TWICE and reverted — 3D re-rasterization scrambles
 *     background-clip gradients, and remapping word X positions to an arc
 *     stretches the inter-word gaps unevenly (layout advance widths don't
 *     follow projected sizes).
 *
 * All matched blocks are treated as ONE sheet: line offsets are measured
 * from the group's common parent, so e.g. the two Intro paragraphs curve as
 * a single continuous surface rather than "cada uno con su distorsión", and
 * the frame-overhang shift is shared so they stay column-aligned.
 */
const PERSPECTIVE = 460; // px — matches the block-level CSS planes on titles
const FRAME_MARGIN = 40; // min px between the projected outer edge and the viewport edge

// DESKTOP: the pivot sits AT the inner edge (the screen-centre side), which
// therefore stays exactly at z=0 — flat, scale 1, zero deformation — and
// depth grows toward the page edge with the perspective's naturally CONVEX
// profile (slow at first, accelerating outward): "la parte más cercana al
// centro de la pantalla casi plana... la más cercana al exterior la que se
// expande". Nothing ever recedes behind the screen plane. The tilt is
// gentler than the old mid-pivot 20° because the lever is now the FULL block
// width. MOBILE keeps the mid-pivot profile: blocks span the whole screen
// there, so there is no "inner" side to pin — and no lateral room for the
// edge-pivot's much larger projection.
const PROFILE = () =>
  window.innerWidth >= 901
    ? { edgePivot: true, tilt: 12, fan: 0.6 }
    : { edgePivot: false, tilt: 20, fan: 0.85 };

export function useCurvedWords(
  rootRef: RefObject<HTMLElement | null>,
  selector: string,
  /** Which edge of the block wraps toward the viewer (its outer, page-edge side). */
  dir: "left" | "right",
  deps: readonly unknown[] = []
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (!els.length) return;

    const sheet = (els.length > 1 && els[0].parentElement) || null;
    const items = els.map((el) => ({
      el,
      split: SplitText.create(el, { type: "words" }),
    }));

    const layout = () => {
      const { edgePivot, tilt, fan } = PROFILE();
      const pivot = edgePivot ? (dir === "left" ? 1 : 0) : dir === "left" ? 0.7 : 0.3;
      const yaw = dir === "left" ? tilt : -tilt;
      const origin = `${pivot * 100}% center`;
      // ---- Pass 1: clear everything, measure untransformed geometry.
      for (const { el, split } of items) {
        el.style.transform = "none";
        for (const w of split.words as HTMLElement[]) w.style.transform = "none";
      }
      const sheetBox = (sheet ?? els[0]).getBoundingClientRect();
      const sheetMidY = sheetBox.top + sheetBox.height / 2;

      // ---- Pass 2: per-word 2D fan + per-block tangent tilt.
      // Each block's UNTRANSFORMED layout box is kept for pass 3: once the
      // tilt is applied, el's own rect is projected too, so comparing
      // projected word rects against it would always read ~zero overhang.
      const layoutBoxes = new Map<HTMLElement, DOMRect>();
      for (const { el, split } of items) {
        const box = el.getBoundingClientRect();
        layoutBoxes.set(el, box);
        const W = box.width || 1;
        for (const w of split.words as HTMLElement[]) {
          const r = w.getBoundingClientRect();
          const s = ((r.left + r.right) / 2 - box.left) / W - pivot;
          const lineOff = (r.top + r.bottom) / 2 - sheetMidY;
          const ty = lineOff * fan * s * s;
          // Lean each word onto the local slope of its bowed line so the
          // curve is smooth instead of a per-word stair-step.
          const slope = ((lineOff * fan * 2 * s) / W) * (180 / Math.PI);
          w.style.transform = `translateY(${ty.toFixed(2)}px) rotate(${slope.toFixed(3)}deg)`;
        }
        el.style.transformOrigin = origin;
        el.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${yaw}deg)`;
      }

      // ---- Pass 3: the magnified outer edge projects past the layout box;
      // pull the whole GROUP inward just enough to stay FRAME_MARGIN off the
      // viewport edge. One shared shift keeps multi-block sheets aligned.
      let shift = 0;
      for (const { el, split } of items) {
        const box = layoutBoxes.get(el)!;
        let over = 0;
        for (const w of split.words as HTMLElement[]) {
          const r = w.getBoundingClientRect();
          over = Math.max(over, dir === "right" ? r.right - box.right : box.left - r.left);
        }
        const room = dir === "right" ? window.innerWidth - box.right : box.left;
        shift = Math.max(shift, over - Math.max(0, room - FRAME_MARGIN));
      }
      if (shift > 0.5) {
        const tx = dir === "right" ? -shift : shift;
        for (const { el } of items) {
          el.style.transform = `translateX(${tx.toFixed(1)}px) perspective(${PERSPECTIVE}px) rotateY(${yaw}deg)`;
        }
      }
    };

    layout();

    // Refit on real size changes (breakpoints, font swap-in reflowing lines).
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(layout);
    });
    items.forEach(({ el }) => ro.observe(el));

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      items.forEach(({ el, split }) => {
        split.revert();
        el.style.transform = "";
        el.style.transformOrigin = "";
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
