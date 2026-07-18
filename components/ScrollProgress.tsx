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

    const write = (p: number) => {
      const h = root.clientHeight - pill.offsetHeight;
      pill.style.transform = `translateY(${p * h}px)`;
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

    const target = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    };

    const tick = () => {
      raf = 0;
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

    tick();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
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
