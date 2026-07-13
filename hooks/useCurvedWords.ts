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
const RAD2DEG = 180 / Math.PI;
// The bow grows with a line's distance from the viewport centre — CLAMPED:
// unclamped, lines near the screen edges bowed 50px+ and their words climbed
// clean out of their own block over neighbouring content (reported as a
// lowercase word covering a title's capital letter). 240·fan caps the worst
// case at ~29px desktop / ~17px mobile, all of which fits in normal margins.
const DY_CAP = 240;

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
    ? { tilt: 12, forceDir: null as "left" | null, frameMargin: 40, fan: 0.12 }
    : // Gentler on phones (10°, softer fan 0.07 — "reduce un poco más la
      // deformación dinámica en móvil") and a generous frame margin so the
      // distorted edge is clearly separated from the viewport sides.
      { tilt: 10, forceDir: "left" as const, frameMargin: 34, fan: 0.07 };

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
  deps: readonly unknown[] = [],
  /**
   * bowOnly: add ONLY the per-frame dynamic bow — no inline block transform
   * (CSS owns the tilt), no frame shift. Used by blocks whose tilt is styled
   * in CSS (section titles, the Servicios captions).
   *
   * useExistingWords: don't run SplitText — ride the .nxr-cw-word spans an
   * earlier split created (useTitleReveal's, which animates the CHAR spans
   * inside them; double-splitting would nest spans).
   *
   * onlyBelow: activate only under this viewport width (e.g. the Servicios
   * captions curve on phones only — their desktop look is separately tuned).
   */
  opts: { bowOnly?: boolean; useExistingWords?: boolean; onlyBelow?: number } = {}
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (opts.onlyBelow && window.innerWidth >= opts.onlyBelow) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (!els.length) return;

    const bowOnly = !!opts.bowOnly;
    const items = els
      .map((el) => ({
        el,
        // wordsClass: consumers that animate the TEXT ITSELF (Intro's scramble
        // effect) or ride on another split (useExistingWords) need a stable
        // selector — mutating these spans is the only text animation that
        // coexists with the per-word transforms.
        split: opts.useExistingWords ? null : SplitText.create(el, { type: "words", wordsClass: "nxr-cw-word" }),
      }))
      // useExistingWords with no pre-existing spans (reduced motion skips the
      // reveal's split) → nothing to do for that element.
      .filter(({ el, split }) => split || el.querySelector(".nxr-cw-word"));
    if (!items.length) return;

    const wordsOf = (it: (typeof items)[number]) =>
      it.split ? (it.split.words as HTMLElement[]) : Array.from(it.el.querySelectorAll<HTMLElement>(".nxr-cw-word"));

    const geoms: ItemGeom[] = [];

    const layout = () => {
      const { tilt, forceDir, frameMargin } = PROFILE();
      const effDir = forceDir ?? dir;
      const pivot = effDir === "left" ? 1 : 0;
      const yaw = effDir === "left" ? tilt : -tilt;
      const origin = `${pivot * 100}% center`;
      geoms.length = 0;

      // ---- Pass 1: clear everything, measure untransformed geometry. In
      // bowOnly mode the element's own (CSS) transform stays — all rects are
      // measured consistently in its projected space instead.
      for (const it of items) {
        if (!bowOnly) it.el.style.transform = "none";
        for (const w of wordsOf(it)) w.style.transform = "none";
      }

      // ---- Pass 2: capture per-word geometry (for the per-frame bow) and
      // apply the static per-block tangent tilt.
      const layoutBoxes = new Map<HTMLElement, DOMRect>();
      for (const it of items) {
        const { el } = it;
        const box = el.getBoundingClientRect();
        layoutBoxes.set(el, box);
        const W = box.width || 1;
        const words: WordGeom[] = [];
        for (const w of wordsOf(it)) {
          const r = w.getBoundingClientRect();
          const sRel = ((r.left + r.right) / 2 - box.left) / W - pivot;
          words.push({ node: w, sRel, s2: sRel * sRel, lineMid: (r.top + r.bottom) / 2 - box.top });
        }
        let topBias = 0;
        if (!bowOnly) {
          el.style.transformOrigin = origin;
          el.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${yaw}deg)`;
          topBias = box.top - el.getBoundingClientRect().top;
        }
        geoms.push({ el, words, W, topBias, near: false, lastTop: NaN });
      }

      if (!bowOnly) {
        // ---- Pass 3: the magnified outer edge projects past the layout box;
        // pull the whole GROUP inward just enough to stay frameMargin off the
        // viewport edge. One shared shift keeps multi-block sheets aligned.
        let shift = 0;
        for (const it of items) {
          const box = layoutBoxes.get(it.el)!;
          let over = 0;
          for (const w of wordsOf(it)) {
            const r = w.getBoundingClientRect();
            over = Math.max(over, effDir === "right" ? r.right - box.right : box.left - r.left);
          }
          const room = effDir === "right" ? window.innerWidth - box.right : box.left;
          // NOT clamped at the box edge: when the layout box itself sits
          // closer to the frame than frameMargin (phones: 16px page padding),
          // the block is pushed PAST its own edge so the distorted side
          // always keeps the full margin off the frame.
          shift = Math.max(shift, over - (room - frameMargin));
        }
        if (shift > 0.5) {
          const tx = effDir === "right" ? -shift : shift;
          // Horizontal-only shift: the vertical topBias is unaffected.
          for (const g of geoms) {
            g.el.style.transform = `translateX(${tx.toFixed(1)}px) perspective(${PERSPECTIVE}px) rotateY(${yaw}deg)`;
          }
        }
      }
    };

    layout();

    // ---- Per-frame dynamic bow, driven by each line's LIVE screen height.
    const update = () => {
      const vhHalf = window.innerHeight / 2;
      const { fan } = PROFILE();
      for (const g of geoms) {
        if (!g.near) continue;
        const rect = g.el.getBoundingClientRect();
        const topNow = rect.top + g.topBias;
        if (Math.abs(topNow - g.lastTop) < 0.3) continue;
        g.lastTop = topNow;
        for (const w of g.words) {
          const dyRaw = topNow + w.lineMid - vhHalf;
          const dy = Math.max(-DY_CAP, Math.min(DY_CAP, dyRaw));
          const ty = dy * fan * w.s2;
          // Lean each word onto the local slope of its bowed line so the
          // curve reads smooth instead of a per-word stair-step.
          const rot = ((dy * fan * 2 * w.sRel) / g.W) * RAD2DEG;
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
      items.forEach((it) => {
        if (it.split) {
          it.split.revert();
          it.el.style.transform = "";
          it.el.style.transformOrigin = "";
        } else {
          // bowOnly: the words belong to useTitleReveal's split — just drop
          // our transforms and leave the spans to their owner.
          for (const w of wordsOf(it)) w.style.transform = "";
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
