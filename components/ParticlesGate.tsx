"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Load Three.js + the particle system as a separate chunk AFTER hydration
// (`ssr: false`), so the ~hundreds-of-KB of Three.js never block first paint /
// interactivity — a direct win for Total Blocking Time and Speed Index. It's a
// decorative background, so appearing a beat later is imperceptible.
const ThreeBackground = dynamic(() => import("./ThreeBackground"), { ssr: false });

// The instanced-particle background is a home-page feature only: it reacts to
// the homepage's section layout (see SEC_IDS in ThreeBackground). On any other
// route we render nothing, so it mounts on `/` and cleanly unmounts (disposing
// its WebGL renderer) on navigation away.
export default function ParticlesGate() {
  const pathname = usePathname();
  return pathname === "/" ? <ThreeBackground /> : null;
}
