"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Splits a heading's text into characters, each behind its own overflow-hidden
// mask (SplitText's `mask: "chars"`), and staggers them rising up from below
// into place as the heading scrolls into view — plays once, matching how
// `.nxr-reveal` elsewhere only reveals a section the first time it's seen.
// Not for the home hero or the "Construido con maestría" statement, which have
// their own bespoke animations.
//
// NOTE: keep this hook free of per-char 3D transforms. A per-char
// translateZ/rotateY "curved plane" was tried and reverted: individually
// transformed chars break apart visually (layout advance widths don't follow
// the projected sizes, so glyphs overlap/spread) and the animated
// gradient-text titles (background-clip: text, painted per element) render
// scrambled. The perspective planes are applied at BLOCK level in CSS — see
// the "Perspective text planes" section of globals.css.
export function useTitleReveal<T extends HTMLElement = HTMLHeadingElement>() {
  const ref = useRef<T>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      // `useReducedMotion`'s `getServerSnapshot` always reports `false` (by
      // design, to match SSR and avoid a hydration mismatch), so on the very
      // first client render `reducedMotion` can still read `false` for a
      // reduced-motion user for one tick, before useSyncExternalStore catches
      // up. This effect only runs on the client and never needs to match SSR
      // markup, so it checks the real media query directly too — otherwise
      // SplitText would run once and flash before a later re-run reverted it.
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const el = ref.current;
      if (prefersReduced || !el) return;

      // Splitting by "chars" alone turns every letter into its own inline-block,
      // so the browser is free to wrap a line between ANY two letters — including
      // mid-word. Also splitting by "words" groups each word's letters into a
      // single layout unit (`white-space: nowrap` internally), so line breaks can
      // only fall between words again, exactly like normal, unsplit text.
      //
      // Deliberately NOT using SplitText's `mask` option here (previous version
      // did). A mask wraps each char in its own `overflow: clip` box sized to
      // the line's line-height — not tall enough for descenders (g, j, p, q,
      // y), which get cut off at the bottom. Two rounds of padding/box-sizing
      // fixes on that mask box still weren't reliably descender-safe across
      // every heading/font-size/browser combination on this site. Since the
      // clipping is a direct consequence of the mask box existing at all, the
      // only way to make it structurally impossible — not just "tuned to not
      // happen right now" — is to not clip anything: chars fade AND rise via
      // opacity + y (translate), with no overflow box involved anywhere, so
      // there is nothing for a descender to be cut off by, regardless of font
      // metrics. Same "rises into place" read, just without a hard mask edge.
      // wordsClass: the word divs double as anchors for useCurvedWords'
      // bowOnly mode (dynamic per-line bow on titles) — the bow transforms
      // the WORD wrappers while this reveal animates the CHAR spans inside,
      // so the two compose without touching the same element.
      const split = SplitText.create(el, { type: "words, chars", wordsClass: "nxr-cw-word" });
      gsap.set(split.chars, { opacity: 0, yPercent: 40 });
      gsap.to(split.chars, {
        opacity: 1,
        yPercent: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.018,
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });

      return () => split.revert();
    },
    { scope: ref, dependencies: [reducedMotion] }
  );

  return ref;
}
