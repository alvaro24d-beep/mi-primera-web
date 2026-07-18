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
// The pill is also GRABBABLE (mouse + touch): dragging it scrubs the page
// through Lenis (never native scrollTo — that fights Lenis' rAF). While a
// touch drag is active, pill-local touch listeners stopPropagation so the
// gesture never reaches Lenis' syncTouch handlers or Servicios' touchend
// pagination (both listen on window, bubble phase) — otherwise both would
// drive the scroll at once. Each drag write also dispatches a zero-delta
// WheelEvent: that's what cancels Servicios' idle-snap glide (it listens
// for wheel/touchstart) and feeds the scene's activity tracker.
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

    // ---- Drag-to-scrub ----
    const moveTo = (clientY: number) => {
      const rect = root.getBoundingClientRect();
      const span = rect.height - pill.offsetHeight;
      dragP = Math.max(0, Math.min(1, (clientY - grabOff - rect.top) / span));
      const y = dragP * maxScroll();
      const lenis = window.__nxrLenis;
      // Small lerp: the page chases the finger smoothly instead of
      // teleporting (immediate writes would race every pinned scrub).
      if (lenis) lenis.scrollTo(y, { lerp: 0.25 });
      else window.scrollTo(0, y);
      // Zero-delta wheel = "user is scrolling" for everyone listening
      // (cancels Servicios' snap glide, keeps the scene in active mode)
      // without moving anything itself. deltaY MUST be present — a bare
      // Event("wheel") NaN-poisons Lenis (learned the hard way).
      window.dispatchEvent(new WheelEvent("wheel", { deltaY: 0 }));
      wake();
    };
    const onPointerDown = (e: PointerEvent) => {
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
      cur = dragP; // resume normal tracking from where the finger left off
      wake();
    };
    // Fence: keep the raw touch gesture OUT of the window-level listeners
    // (Lenis syncTouch, Servicios pagination, SmoothScroll's flick cap) —
    // touch events keep targeting the touchstart element, so pill-local
    // bubble-phase stopPropagation isolates the whole gesture.
    const fence = (e: TouchEvent) => e.stopPropagation();
    const fenceMove = (e: TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };

    pill.addEventListener("pointerdown", onPointerDown);
    pill.addEventListener("pointermove", onPointerMove);
    pill.addEventListener("pointerup", endDrag);
    pill.addEventListener("pointercancel", endDrag);
    pill.addEventListener("touchstart", fence, { passive: true });
    pill.addEventListener("touchmove", fenceMove, { passive: false });
    pill.addEventListener("touchend", fence, { passive: true });

    tick();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      pill.removeEventListener("pointerdown", onPointerDown);
      pill.removeEventListener("pointermove", onPointerMove);
      pill.removeEventListener("pointerup", endDrag);
      pill.removeEventListener("pointercancel", endDrag);
      pill.removeEventListener("touchstart", fence);
      pill.removeEventListener("touchmove", fenceMove);
      pill.removeEventListener("touchend", fence);
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
