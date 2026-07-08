"use client";

import { usePathname } from "next/navigation";

// Every page load — the first one AND every client-side navigation — should
// blur in rather than snap in fully sharp. `key={pathname}` forces React to
// mount a fresh DOM node per route, so the CSS `animation` on
// `.nxr-page-transition` (see globals.css) always plays from its start state
// instead of being skipped because the element already existed.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="nxr-page-transition">
      {children}
    </div>
  );
}
