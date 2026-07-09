"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import SceneBackground from "./SceneBackground";
import ServiciosCardsLayer from "./ServiciosCardsLayer";
import PixelCamera, { CAMERA_DISTANCE } from "./PixelCamera";

// Procedural HDRI: `<Environment>` + `<Lightformer>` only — never the
// `preset` prop, which downloads an HDRI from drei's CDN at runtime. That
// was confirmed slow/unreliable enough to hang a page load while building
// DesarrolloWebHero (see AGENTS.md) — this is fully local/instant instead,
// and the Lightformers are tinted with the site's own brand colors so
// reflections read as "this site" rather than a generic gray studio.
function SceneEnvironment() {
  return (
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={1.4} color="#a8f04a" position={[-4, 3, 4]} scale={[4, 4, 1]} />
      <Lightformer form="rect" intensity={1.1} color="#ff9d7d" position={[4, -2, 3]} scale={[3, 5, 1]} />
      <Lightformer form="rect" intensity={0.8} color="#ef3d0d" position={[0, 4, -3]} scale={[6, 2, 1]} />
      {/* COMPACT camera-aligned fill (not a wall of light): a dome needs a
          concentrated highlight that falls off toward the rim to read as
          curved — a huge uniform panel lights the whole face evenly and
          makes it look flat. Slightly off-centre so the hotspot sits off
          the bulge apex naturally. */}
      <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[-1.5, 1, 7]} scale={[5, 5, 1]} />
      <Lightformer form="ring" intensity={0.5} color="#ffffff" position={[0, 0, 6]} scale={[8, 8, 1]} />
      {/* Thin bright strips: a straight line reflecting off a domed surface
          renders as a visibly BENT band sweeping across the face — the
          strongest available cue that the card is convex, much stronger
          than any diffuse blob highlight. Horizontal white above, salmon
          below, brand-lime vertical off to the side, so the bend shows on
          both curvature axes and shifts continuously as the cards travel,
          turn and idle-drift in the reel. */}
      <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 3.5, 6]} scale={[20, 0.3, 1]} />
      <Lightformer form="rect" intensity={1.3} color="#ff9d7d" position={[0, -3, 5]} scale={[14, 0.25, 1]} />
      <Lightformer form="rect" intensity={1.2} color="#a8f04a" position={[-5, -0.5, 5]} scale={[0.35, 9, 1]} />
    </Environment>
  );
}

export default function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  // Whole-page background canvas — not scoped to one section's visibility
  // like HeroScene.tsx, only to the tab's own visibility (mirrors
  // WaveBackground.tsx's `onVisibility`, the component this replaces).
  const [active, setActive] = useState(true);

  useEffect(() => {
    const onVisibility = () => setActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100lvh",
        zIndex: -1000,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <Canvas
        ref={canvasRef}
        frameloop={active ? "always" : "never"}
        dpr={isMobile ? [1, 1.25] : [1, 2]}
        camera={{ position: [0, 0, CAMERA_DISTANCE], fov: 50, near: 1, far: CAMERA_DISTANCE * 3 }}
        gl={{ alpha: true, antialias: !isMobile, powerPreference: "high-performance" }}
      >
        <PixelCamera />
        <ambientLight intensity={0.35} />
        <directionalLight position={[500, 800, 600]} intensity={0.5} color="#ffffff" />
        <SceneEnvironment />
        <SceneBackground />
        <ServiciosCardsLayer isMobile={isMobile} />
        {!isMobile && (
          <EffectComposer>
            <Bloom mipmapBlur luminanceThreshold={0.6} luminanceSmoothing={0.3} intensity={0.35} />
            <Vignette eskil={false} offset={0.25} darkness={0.55} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
