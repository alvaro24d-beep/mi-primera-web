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
      const split = SplitText.create(el, { type: "words, chars", mask: "chars" });
      // Each mask is an `overflow: clip` box sized to the line's own line-height,
      // which isn't tall enough for descenders (g, j, p, q, y) — without this,
      // they get cut off at the bottom (same underlying issue documented for
      // `.nxr-gradient-text` in globals.css, here fixed at the mask level instead
      // of via line-height so it doesn't push sibling lines further apart).
      gsap.set(split.masks, { paddingBottom: "0.15em" });
      gsap.set(split.chars, { yPercent: 115 });
      gsap.to(split.chars, {
        yPercent: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.022,
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
