"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// The ENTIRE WebGL stack (three.js + @react-three/fiber + drei +
// postprocessing, ~700KB min) lives behind this dynamic import — statically
// importing SceneCanvas in the root layout put all of it on the load's
// critical path: parse+eval blocked the main thread and R3F's first render
// compiled the (huge) transmission/composer shaders inside the Lighthouse
// window, dominating "main-thread work" (Other 3.4s + Script Eval 0.8s).
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

/**
 * Mounts the global 3D backdrop AFTER hydration, on the first idle moment:
 * the page paints and becomes interactive first, then the WebGL chunk
 * downloads/evaluates and its shaders compile OUTSIDE the TBT/LCP window.
 * The body is the same dark base tone as the wall and SceneCanvas fades its
 * container in (see .nxr-scene-arrive), so the hand-off reads as a designed
 * entrance rather than a pop.
 */
export default function SceneCanvasLazy() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // requestIdleCallback with a hard timeout so a busy main thread can't
    // postpone the backdrop for long; setTimeout fallback for Safari.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), 250);
    return () => window.clearTimeout(id);
  }, []);

  return ready ? <SceneCanvas /> : null;
}
