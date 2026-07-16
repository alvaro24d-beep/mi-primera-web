"use client";

// Typographic curved marquee between Capacidades and the tech stack —
// CurvedLoop (React Bits, adapted). The words ARE the service (regla de oro:
// nothing abstract): what Nexora builds into every web, looping like a
// production line. Decorative for AT (aria-hidden) — the same claims exist
// as real copy in the sections around it. Draggable on desktop; on reduced
// motion it renders as a static curved line, no loop.
import CurvedLoop from "./CurvedLoop";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function DwhClaims() {
  const reducedMotion = useReducedMotion();
  return (
    <section className="nxr-dwh-claims" aria-hidden="true">
      <CurvedLoop
        marqueeText="Diseño ✦ Código ✦ Rendimiento ✦ SEO ✦ Conversión ✦ "
        speed={1.4}
        curveAmount={90}
        interactive={!reducedMotion}
        paused={reducedMotion}
        className="nxr-dwh-claims-text"
      />
    </section>
  );
}
