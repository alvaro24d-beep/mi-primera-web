"use client";

import { useEffect, useRef } from "react";

// Replaces the native scrollbar (hidden in globals.css) with a red vertical
// progress bar on the right edge that fills top→bottom as you scroll. Driven by
// the real `window.scrollY` (Lenis moves the real scroll position, so this stays
// correct), rAF-coalesced, and mutating only a GPU-composited `transform`.
export default function ScrollProgress() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      fill.style.transform = `scaleY(${Math.max(0, Math.min(1, p))})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="nxr-scrollprogress" aria-hidden="true">
      <div className="nxr-scrollprogress-fill" ref={fillRef} />
    </div>
  );
}
