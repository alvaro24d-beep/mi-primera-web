"use client";

import { usePathname } from "next/navigation";
import ThreeBackground from "./ThreeBackground";

// The instanced-particle background is a home-page feature only: it reacts to
// the homepage's section layout (see SEC_IDS in ThreeBackground). On any other
// route we render nothing, so it mounts on `/` and cleanly unmounts (disposing
// its WebGL renderer) on navigation away.
export default function ParticlesGate() {
  const pathname = usePathname();
  return pathname === "/" ? <ThreeBackground /> : null;
}
