"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Right-edge scroll indicator: a compact vertical RULER of thin tick lines
// (not a full-height bar) with a red pill marking the current position —
// per the alche-style reference. Driven by the real `window.scrollY` (Lenis
// moves the real scroll position, so this stays correct). The pill glides
// with a small lerp for the soft trailing feel, and ticks near it stretch/
// brighten with a distance falloff (audio-scrubber style). All writes are
// GPU-composited transform/opacity; the rAF loop only runs while the pill
// is still converging — it stops when settled, so an idle page costs zero.
//
// Visibility: hidden until the page reaches #nxr-intro ("solo salga a
// partir de 'hacemos que la tecnología trabaje por ti'"; routes without
// that section show it after a small scroll), and it fades back out after
// ~2s without scroll/drag activity.
//
// The pill is GRABBABLE with the MOUSE only: dragging it scrubs the page
// through Lenis (never native scrollTo — that fights Lenis' rAF). Touch
// deliberately does NOT grab (first shipped version did): on a phone the
// grab zone sits exactly where thumbs swipe along the right edge, so
// normal scrolls kept landing on it and got hijacked into scrubs — and a
// ~230px track mapping the whole page turns any 2px finger jitter into a
// ~100px scroll jump ("la píldora se bugea, va mal"). Mobile keeps the
// pill as a pure indicator (pointer-events: none in the media query).
const TICKS = 25;
// Falloff radius in tick units: how many neighbours react to the pill.
const RADIUS = 2.5;

export default function ScrollProgress() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    const pill = pillRef.current;
    if (!root || !pill) return;
    const ticks = Array.from(root.querySelectorAll<HTMLSpanElement>(".nxr-scrollruler-tick"));

    let raf = 0;
    let cur = -1; // lerped position in [0..1]; -1 = first paint snaps
    let dragging = false;
    let dragP = 0;
    let grabOff = 0; // clientY offset finger↔pill-top at grab, keeps it from jumping
    let hideTimer = 0;

    const write = (p: number) => {
      const h = root.clientHeight - pill.offsetHeight;
      pill.style.transform = `translateY(${p * h}px)${dragging ? " scale(1.35)" : ""}`;
      const pos = p * (TICKS - 1);
      for (let i = 0; i < TICKS; i++) {
        const d = Math.abs(i - pos);
        const f = Math.max(0, 1 - d / RADIUS);
        const ease = f * f;
        const t = ticks[i];
        t.style.transform = `scaleX(${1 + 0.5 * ease})`;
        t.style.opacity = String(Math.min(1, +t.dataset.base! + 0.5 * ease));
      }
    };

    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    const target = () => {
      const max = maxScroll();
      return max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    };

    const tick = () => {
      raf = 0;
      // Mid-drag the pill sticks to the finger (leading indicator; the page
      // trails it through Lenis' lerp) — pointermove drives the writes.
      if (dragging) {
        write(dragP);
        return;
      }
      const t = target();
      // First paint / reduced motion: track exactly, no trailing glide.
      cur = cur < 0 || reducedMotion ? t : cur + (t - cur) * 0.18;
      if (Math.abs(t - cur) < 0.0005) cur = t;
      write(cur);
      if (cur !== t) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // ---- Visibility: from #nxr-intro onward, auto-hide after idle ----
    const visibilityOk = () => {
      const gate = document.getElementById("nxr-intro");
      // Routes without the Intro section: appear after a small scroll.
      if (!gate) return window.scrollY > 40;
      return gate.getBoundingClientRect().top <= window.innerHeight * 0.55;
    };
    const activity = () => {
      if (visibilityOk()) {
        root.classList.add("is-visible");
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
          if (!dragging) root.classList.remove("is-visible");
        }, 2200);
      } else {
        root.classList.remove("is-visible");
      }
      wake();
    };

    // ---- Drag-to-scrub (mouse only, see header comment) ----
    const moveTo = (clientY: number) => {
      const rect = root.getBoundingClientRect();
      const span = rect.height - pill.offsetHeight;
      dragP = Math.max(0, Math.min(1, (clientY - grabOff - rect.top) / span));
      const y = dragP * maxScroll();
      const lenis = window.__nxrLenis;
      // Small lerp: the page chases the pill smoothly instead of
      // teleporting (immediate writes would race every pinned scrub).
      if (lenis) lenis.scrollTo(y, { lerp: 0.25 });
      else window.scrollTo(0, y);
      // Zero-delta wheel = "user is scrolling" for everyone listening
      // (cancels Servicios' snap glide, keeps the scene in active mode)
      // without moving anything itself. deltaY MUST be present — a bare
      // Event("wheel") NaN-poisons Lenis (learned the hard way).
      window.dispatchEvent(new WheelEvent("wheel", { deltaY: 0 }));
      activity();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      dragging = true;
      grabOff = e.clientY - pill.getBoundingClientRect().top;
      pill.classList.add("is-drag");
      document.documentElement.style.cursor = "grabbing";
      pill.setPointerCapture(e.pointerId);
      e.preventDefault();
      moveTo(e.clientY);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (dragging) moveTo(e.clientY);
    };
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      pill.classList.remove("is-drag");
      document.documentElement.style.cursor = "";
      cur = dragP; // resume normal tracking from where the pointer left off
      activity(); // re-arm the idle fade from the moment of release
    };

    pill.addEventListener("pointerdown", onPointerDown);
    pill.addEventListener("pointermove", onPointerMove);
    pill.addEventListener("pointerup", endDrag);
    pill.addEventListener("pointercancel", endDrag);
    // Hovering the (visible) pill keeps the ruler from fading mid-reach.
    pill.addEventListener("pointerenter", activity);

    tick();
    activity(); // reload mid-page (scroll restoration): show, then idle-fade
    window.addEventListener("scroll", activity, { passive: true });
    window.addEventListener("resize", activity, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hideTimer);
      window.removeEventListener("scroll", activity);
      window.removeEventListener("resize", activity);
      pill.removeEventListener("pointerdown", onPointerDown);
      pill.removeEventListener("pointermove", onPointerMove);
      pill.removeEventListener("pointerup", endDrag);
      pill.removeEventListener("pointercancel", endDrag);
      pill.removeEventListener("pointerenter", activity);
      document.documentElement.style.cursor = "";
    };
  }, [reducedMotion]);

  return (
    <div className="nxr-scrollruler" ref={rootRef} aria-hidden="true">
      {Array.from({ length: TICKS }, (_, i) => {
        const accent = i % 5 === 0;
        return (
          <span
            key={i}
            className={accent ? "nxr-scrollruler-tick is-accent" : "nxr-scrollruler-tick"}
            data-base={accent ? "0.38" : "0.16"}
          />
        );
      })}
      <div className="nxr-scrollruler-pill" ref={pillRef} />
    </div>
  );
}
