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
 *  1. BLOCK level (static, set at layout time): the perspective/rotateY
 *     tangent plane, giving the depth/size ramp toward the outer edge.
 *  2. WORD level (DYNAMIC, updated every ticker frame): each text line bows
 *     according to ITS OWN current height on screen — lines below the
 *     viewport's vertical centre bow DOWNWARD (seen from above), a line at
 *     mid-height runs straight, lines above bow UPWARD, each line
 *     independently, live as the page scrolls ("que sea dinámico... línea
 *     por línea independientemente"). That is exactly how horizontal rules
 *     on the inside of the concave wall project: the horizontally-outer
 *     parts of the sheet sit nearer the viewer, so a line's distance from
 *     the eye-level axis gets magnified toward the block's outer edge —
 *     bow(word) = dyLine · FAN · s², zero at the tilt pivot.
 *
 * 2D-ONLY per-word transforms are deliberate: the title reveal already
 * yPercent-animates chars inside the animated gradient titles safely,
 * whereas per-word 3D (translateZ/rotateY/scale) was tried TWICE and
 * reverted — 3D re-rasterization scrambles background-clip gradients, and
 * remapping word X positions to an arc stretches the inter-word gaps
 * unevenly (layout advance widths don't follow projected sizes).
 *
 * Per-frame cost control: an IntersectionObserver keeps a `near` flag per
 * block, so off-screen blocks cost nothing (no rect reads); a visible block
 * whose screen position hasn't moved ≥0.3px since the last frame also
 * short-circuits, so at scroll rest the ticker is ~free.
 */
const PERSPECTIVE = 460; // px — matches the block-level CSS planes on titles
// Vertical magnification-minus-one at the block's outer edge: a line 300px
// below the viewport centre bows 300·0.12 = 36px downward at the outer edge
// (and 0 at the pivot). Sign flips above centre automatically via dy.
const DYN_FAN = 0.12;
const RAD2DEG = 180 / Math.PI;

// Same edge-pivot profile on EVERY viewport ("como en ordenador pero bien
// hecho y afinado"): the pivot sits AT the inner edge, which stays exactly
// at z=0 — flat, scale 1, zero deformation — and depth grows toward the
// outer edge with the perspective's naturally CONVEX profile. Nothing ever
// recedes behind the screen plane.
//
// MOBILE overrides the caller's direction: every paragraph there is
// left-aligned, so the LEFT side is the one that distorts ("si en móvil
// está alineado a la izquierda es la parte izquierda la que tiene que
// distorsionarse") — pivot at the right edge, gentler angle for the narrow
// column (which no longer spans the full width — see the mobile
// margin-right in globals.css), and a smaller frame margin to match the
// phone's 16px page padding scale.
const PROFILE = () =>
  window.innerWidth >= 901
    ? { tilt: 12, forceDir: null as "left" | null, frameMargin: 40 }
    : { tilt: 14, forceDir: "left" as const, frameMargin: 28 };

type WordGeom = { node: HTMLElement; sRel: number; s2: number; lineMid: number };
type ItemGeom = {
  el: HTMLElement;
  words: WordGeom[];
  W: number;
  /** untransformedTop − tiltedRectTop, so per-frame reads of the TILTED rect
     can recover the layout-space top (the tilt expands the rect upward by a
     nearly constant amount). */
  topBias: number;
  near: boolean;
  lastTop: number;
};

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

    const items = els.map((el) => ({
      el,
      // wordsClass: consumers that animate the TEXT ITSELF (Intro's scramble
      // effect) need a stable selector for these word spans — mutating their
      // textContent is the only text animation that coexists with the
      // per-word transforms (re-rendering the paragraph would destroy them).
      split: SplitText.create(el, { type: "words", wordsClass: "nxr-cw-word" }),
    }));
    const geoms: ItemGeom[] = [];

    const layout = () => {
      const { tilt, forceDir, frameMargin } = PROFILE();
      const effDir = forceDir ?? dir;
      const pivot = effDir === "left" ? 1 : 0;
      const yaw = effDir === "left" ? tilt : -tilt;
      const origin = `${pivot * 100}% center`;
      geoms.length = 0;

      // ---- Pass 1: clear everything, measure untransformed geometry.
      for (const { el, split } of items) {
        el.style.transform = "none";
        for (const w of split.words as HTMLElement[]) w.style.transform = "none";
      }

      // ---- Pass 2: capture per-word geometry (for the per-frame bow) and
      // apply the static per-block tangent tilt.
      const layoutBoxes = new Map<HTMLElement, DOMRect>();
      for (const { el, split } of items) {
        const box = el.getBoundingClientRect();
        layoutBoxes.set(el, box);
        const W = box.width || 1;
        const words: WordGeom[] = [];
        for (const w of split.words as HTMLElement[]) {
          const r = w.getBoundingClientRect();
          const sRel = ((r.left + r.right) / 2 - box.left) / W - pivot;
          words.push({ node: w, sRel, s2: sRel * sRel, lineMid: (r.top + r.bottom) / 2 - box.top });
        }
        el.style.transformOrigin = origin;
        el.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${yaw}deg)`;
        const tilted = el.getBoundingClientRect();
        geoms.push({ el, words, W, topBias: box.top - tilted.top, near: false, lastTop: NaN });
      }

      // ---- Pass 3: the magnified outer edge projects past the layout box;
      // pull the whole GROUP inward just enough to stay FRAME_MARGIN off the
      // viewport edge. One shared shift keeps multi-block sheets aligned.
      // Measured with the words at neutral bow (the dynamic bow is vertical
      // and adds only a trivial horizontal footprint via the word lean).
      let shift = 0;
      for (const { el, split } of items) {
        const box = layoutBoxes.get(el)!;
        let over = 0;
        for (const w of split.words as HTMLElement[]) {
          const r = w.getBoundingClientRect();
          over = Math.max(over, effDir === "right" ? r.right - box.right : box.left - r.left);
        }
        const room = effDir === "right" ? window.innerWidth - box.right : box.left;
        // NOT clamped at the box edge: when the layout box itself sits closer
        // to the frame than frameMargin (phones: 16px page padding < 28px
        // margin), the block is pushed PAST its own edge so the distorted
        // side always keeps the full margin off the frame.
        shift = Math.max(shift, over - (room - frameMargin));
      }
      if (shift > 0.5) {
        const tx = effDir === "right" ? -shift : shift;
        // Horizontal-only shift: the vertical topBias is unaffected.
        for (const g of geoms) {
          g.el.style.transform = `translateX(${tx.toFixed(1)}px) perspective(${PERSPECTIVE}px) rotateY(${yaw}deg)`;
        }
      }
    };

    layout();

    // ---- Per-frame dynamic bow, driven by each line's LIVE screen height.
    const update = () => {
      const vhHalf = window.innerHeight / 2;
      for (const g of geoms) {
        if (!g.near) continue;
        const rect = g.el.getBoundingClientRect();
        const topNow = rect.top + g.topBias;
        if (Math.abs(topNow - g.lastTop) < 0.3) continue;
        g.lastTop = topNow;
        for (const w of g.words) {
          const dy = topNow + w.lineMid - vhHalf;
          const ty = dy * DYN_FAN * w.s2;
          // Lean each word onto the local slope of its bowed line so the
          // curve reads smooth instead of a per-word stair-step.
          const rot = ((dy * DYN_FAN * 2 * w.sRel) / g.W) * RAD2DEG;
          w.node.style.transform = `translateY(${ty.toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
        }
      }
    };
    gsap.ticker.add(update);

    // Off-screen blocks skip even the rect read.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const g = geoms.find((x) => x.el === e.target);
          if (g) {
            g.near = e.isIntersecting;
            g.lastTop = NaN; // force a write on re-entry
          }
        }
      },
      { rootMargin: "120px 0px" }
    );
    items.forEach(({ el }) => io.observe(el));

    // Refit on real size changes (breakpoints, font swap-in reflowing lines).
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(layout);
    });
    items.forEach(({ el }) => ro.observe(el));

    return () => {
      gsap.ticker.remove(update);
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      items.forEach(({ el, split }) => {
        split.revert();
        el.style.transform = "";
        el.style.transformOrigin = "";
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
