"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// Shared text-scramble entrance — the Intro paragraph's signature effect
// ("Somos una agencia de software…"), extracted so every section paragraph
// can use it. Same algorithm as Intro.tsx's inline version (adapted from the
// motion-primitives TextScramble reference, no framer-motion): random glyphs
// resolving left-to-right across the whole block over ~900ms.
//
// Word targets: reuses the `.nxr-cw-word` spans useCurvedWords already
// created whenever they exist (mutating them keeps the per-word curvature
// transforms alive — replacing the DOM wholesale would destroy them, the
// exact bug Intro's version documents). Where a paragraph has no curved
// words (e.g. the desktop Servicios captions), it splits the text nodes into
// its own `.nxr-scr-word` spans once, recursively, so inline children like
// <strong> keep their styling.
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SPEED = 40; // ms per step (reference component's 0.04s)
const DURATION = 900;

// One live run per element — retriggering cancels/restores the previous.
const running = new WeakMap<HTMLElement, () => void>();

function ensureWordSpans(el: HTMLElement): HTMLElement[] {
  const existing = Array.from(el.querySelectorAll<HTMLElement>(".nxr-cw-word, .nxr-scr-word"));
  if (existing.length) return existing;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if ((n.textContent ?? "").trim()) textNodes.push(n as Text);
  }
  for (const node of textNodes) {
    const frag = document.createDocumentFragment();
    for (const part of (node.textContent ?? "").split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
      } else {
        const span = document.createElement("span");
        span.className = "nxr-scr-word";
        span.textContent = part;
        frag.appendChild(span);
      }
    }
    node.parentNode?.replaceChild(frag, node);
  }
  return Array.from(el.querySelectorAll<HTMLElement>(".nxr-scr-word"));
}

/** Plays the scramble entrance on `el` now. Safe to re-call (cancels and
 * restores any run already in flight on the same element). */
export function scrambleElement(el: HTMLElement) {
  running.get(el)?.();
  const words = ensureWordSpans(el);
  if (!words.length) return;
  const originals = words.map((w) => w.textContent ?? "");
  const total = originals.reduce((n, t) => n + t.length, 0);
  // Width-lock each word for the duration so random glyphs can't reflow the
  // line wrapping mid-effect (same guard as Intro's version).
  words.forEach((w) => (w.style.width = `${w.offsetWidth}px`));
  const restore = () => {
    words.forEach((w, wi) => {
      w.textContent = originals[wi];
      w.style.width = "";
    });
  };
  const steps = DURATION / SPEED;
  let step = 0;
  const id = window.setInterval(() => {
    const progress = step / steps;
    let idx = 0;
    words.forEach((w, wi) => {
      const orig = originals[wi];
      let out = "";
      for (let c = 0; c < orig.length; c++, idx++) {
        out += progress * total > idx ? orig[c] : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }
      w.textContent = out;
    });
    step++;
    if (step > steps) {
      window.clearInterval(id);
      restore();
      running.delete(el);
    }
  }, SPEED);
  running.set(el, () => {
    window.clearInterval(id);
    restore();
    running.delete(el);
  });
}

/** Cancels (and restores) a run in flight on `el`, if any. */
export function cancelScramble(el: HTMLElement) {
  running.get(el)?.();
}

/**
 * Fires the scramble entrance on every `selector` match inside `rootRef`
 * when it scrolls into view (re-arming when it leaves back above, like
 * Intro's). Call AFTER any useCurvedWords affecting the same elements, so
 * their word spans exist and get reused. No-ops under reduced motion — the
 * paragraph just sits static, matching the sitewide pattern.
 */
export function useTextScramble(
  rootRef: RefObject<HTMLElement | null>,
  selector: string,
  deps: readonly unknown[] = []
) {
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) return;
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (!els.length) return;
    const triggers = els.map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 82%",
        onEnter: () => scrambleElement(el),
        onLeaveBack: () => cancelScramble(el),
      })
    );
    return () => {
      triggers.forEach((t) => t.kill());
      els.forEach((el) => cancelScramble(el));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, ...deps]);
}
