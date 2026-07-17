"use client";

import { useEffect } from "react";

// Route-ENTER transition. With every internal link now a next/link, the
// layout (Header, nav, SmoothScroll/Lenis, the WebGL backdrop) PERSISTS
// across navigations — the wall keeps playing while only the page content
// swaps, so there is no "blank second" to hide anymore; this fade just
// makes the swap read as one continuous space. This file remounts per
// navigation (that's what template.tsx is for), driving the CSS entrance.
//
// Pure OPACITY on purpose: a transform/filter here would become the
// containing block of every position:fixed descendant — all ScrollTrigger
// pins plus the Servicios fixed phrase would break (same constraint as
// CursorDrift's curated list). Reduced motion renders instantly via CSS.
export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // New route starts at the top — through Lenis, so its internal lerp
    // target agrees (the App Router's own scroll reset fights it).
    window.__nxrLenis?.scrollTo(0, { immediate: true });
  }, []);
  return <div className="nxr-route-enter">{children}</div>;
}
