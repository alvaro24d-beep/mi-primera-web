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
// case at ~29px desktop / ~10px mobile (~17px for Servicios' captions, which
// keep fan 0.07 via opts.fan), all of which fits in normal margins.
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
    : // MUCH gentler on phones (6°, fan 0.04 — second reduction round,
      // sitewide except Servicios' captions, which keep their tuned strength
      // via opts.fan) and a generous frame margin so the distorted edge is
      // clearly separated from the viewport sides.
      { tilt: 6, forceDir: "left" as const, frameMargin: 34, fan: 0.04 };

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
   *
   * onlyAbove: mirror gate — activate only at/above this width. Proceso/Tech
   * use the pair to switch composition per breakpoint: desktop keeps the
   * original split (title on its CSS tier plane, paragraph on its own
   * right-edge hook plane), phones stack both inside one unified block.
   *
   * exclude: words inside a matching ancestor are split but NEVER bowed —
   * for content with its own visible box (the Servicios pills), whose text
   * must stay squared inside its rounded border.
   *
   * alsoBow: NON-text elements that must ride the same bowed lines as the
   * words around them (the Contacto item icons). One deformed block = one
   * curved screen ("todo el contenido que se deforme tiene que estar como en
   * la misma pantalla curva"): a static icon beside bowed words would break
   * its own row, so these get the identical translate/lean treatment — and
   * they join the frame-overflow measurement, since an outer-edge icon can
   * project past the outermost word.
   *
   * splitIgnore: descendants SplitText must not touch because another owner
   * already split them (a useTitleReveal heading living inside this block).
   * Their existing .nxr-cw-word spans still join THIS block's bow/overflow
   * geometry (wordsOf collects by class, not by split ownership), which is
   * the point: heading and paragraphs share one plane and one bow field
   * instead of two separately-tuned planes that "point" different ways.
   *
   * fan: per-call override of PROFILE().fan (bow strength). Servicios'
   * captions keep their tuned mobile strength while the sitewide mobile
   * profile was softened ("reduce la distorsión... excepto Servicios").
   *
   * tiltDesktop: per-call override of the DESKTOP tilt angle (mobile keeps
   * the profile's 6°). The near-edge magnification grows with tilt × block
   * width (scale ≈ P/(P − W·sinθ)): Contacto's wide block at the sitewide
   * 12° hit ~1.25× at its outer edge — text read oversized and the h2
   * rasterized blurry ("borroso como si se estuviese ampliando"). 7° caps
   * it at ~1.13×.
   */
  opts: {
    bowOnly?: boolean;
    useExistingWords?: boolean;
    onlyBelow?: number;
    onlyAbove?: number;
    exclude?: string;
    alsoBow?: string;
    splitIgnore?: string;
    fan?: number;
    tiltDesktop?: number;
    /** Symmetric parabola for CENTERED blocks (the hero h1): the bow pivots
       at the block's CENTRE (zero there, curving toward both edges) instead
       of at one edge — an edge-anchored parabola reads lopsided on centred
       text. s² and the word-lean slope are renormalized so edge magnitudes
       match the edge-pivot mode. */
    centerPivot?: boolean;
  } = {}
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (opts.onlyBelow && window.innerWidth >= opts.onlyBelow) return;
    if (opts.onlyAbove && window.innerWidth < opts.onlyAbove) return;
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
        // aria: "none" — SplitText's default ("auto") stamps aria-label onto
        // the split TARGET, but these targets are <p>/<div> (generic /
        // paragraph roles, where ARIA prohibits naming → axe: "Elements must
        // only use permitted ARIA attributes"). Word-level pieces read
        // naturally in screen readers without any ARIA help, so none is
        // needed. (useTitleReveal keeps the default: its targets are <h2>,
        // where heading naming IS permitted — and its char-level pieces DO
        // need the aria-label/aria-hidden treatment.)
        split: opts.useExistingWords
          ? null
          : SplitText.create(el, {
              type: "words",
              wordsClass: "nxr-cw-word",
              aria: "none",
              ignore: opts.splitIgnore ? Array.from(el.querySelectorAll(opts.splitIgnore)) : undefined,
            }),
        bowNodes: null as HTMLElement[] | null,
      }))
      // useExistingWords with no pre-existing spans (reduced motion skips the
      // reveal's split) → nothing to do for that element.
      .filter(({ el, split }) => split || el.querySelector(".nxr-cw-word"));
    if (!items.length) return;

    // The accent spans (.nxr-gradient-text-*) are plain SOLID color now —
    // the animated background-clip gradients were removed site-wide after
    // two rounds of ghosted/doubled letters (Chromium can't clip a gradient
    // through a subtree with persistent transforms), so their words bow
    // freely like any others. Only `opts.exclude` subtrees are left flat.
    const wordsOf = (it: (typeof items)[number]): HTMLElement[] => {
      if (!it.bowNodes) {
        // By CLASS, not by split ownership: our own split stamps the same
        // class, and any pre-split content inside the block (splitIgnore'd
        // headings) contributes its spans to this block's shared bow field.
        const all = Array.from(it.el.querySelectorAll<HTMLElement>(".nxr-cw-word"));
        it.bowNodes = opts.exclude ? all.filter((w) => !w.closest(opts.exclude!)) : all;
        if (opts.alsoBow) {
          it.bowNodes = it.bowNodes.concat(
            Array.from(it.el.querySelectorAll<HTMLElement>(opts.alsoBow))
          );
        }
      }
      return it.bowNodes;
    };

    const geoms: ItemGeom[] = [];

    const layout = () => {
      const profile = PROFILE();
      const { forceDir, frameMargin } = profile;
      const tilt =
        opts.tiltDesktop !== undefined && window.innerWidth >= 901 ? opts.tiltDesktop : profile.tilt;
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
          const sRel = ((r.left + r.right) / 2 - box.left) / W - (opts.centerPivot ? 0.5 : pivot);
          // centerPivot: sRel spans ±0.5, so ×4 renormalizes s² to reach 1
          // at the edges (same magnitude scale as the edge-pivot mode).
          const s2 = opts.centerPivot ? sRel * sRel * 4 : sRel * sRel;
          words.push({ node: w, sRel, s2, lineMid: (r.top + r.bottom) / 2 - box.top });
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
    // 30Hz on purpose (every other ticker frame): the bow is a ≤29px offset
    // whose 16ms of extra latency is imperceptible, but its per-WORD style
    // writes were a top main-thread cost while scrolling through text-heavy
    // sections (Intro measured 17fps at CPU×3 before this).
    let frameFlip = false;
    const update = () => {
      frameFlip = !frameFlip;
      if (frameFlip) return;
      const vhHalf = window.innerHeight / 2;
      const fan = opts.fan ?? PROFILE().fan;
      // READ pass first, WRITE pass after: interleaving them per block made
      // every block's rect read force a reflow against the previous block's
      // just-written word transforms (layout thrashing at ticker frequency
      // in text-heavy sections).
      const jobs: { g: ItemGeom; topNow: number }[] = [];
      for (const g of geoms) {
        if (!g.near) continue;
        const rect = g.el.getBoundingClientRect();
        const topNow = rect.top + g.topBias;
        if (Math.abs(topNow - g.lastTop) < 0.3) continue;
        g.lastTop = topNow;
        jobs.push({ g, topNow });
      }
      for (const { g, topNow } of jobs) {
        for (const w of g.words) {
          const dyRaw = topNow + w.lineMid - vhHalf;
          const dy = Math.max(-DY_CAP, Math.min(DY_CAP, dyRaw));
          const ty = dy * fan * w.s2;
          // Lean each word onto the local slope of its bowed line so the
          // curve reads smooth instead of a per-word stair-step. (The slope
          // of s² is 2s; with centerPivot's ×4 renormalization it's 8s.)
          const rot = ((dy * fan * (opts.centerPivot ? 8 : 2) * w.sRel) / g.W) * RAD2DEG;
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
          // revert() drops the word spans, but alsoBow nodes are real page
          // elements that keep our inline transform — clear it first.
          for (const w of wordsOf(it)) w.style.transform = "";
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
