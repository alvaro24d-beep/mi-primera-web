"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import SceneBackground from "./SceneBackground";
import ServiciosCardsLayer from "./ServiciosCardsLayer";
import ZoomParallaxCardsLayer from "./ZoomParallaxCardsLayer";
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
      {/* ONE thin bright strip: a straight line reflecting off a domed
          surface renders as a visibly BENT band sweeping across the face —
          the strongest available cue that the card is convex. Deliberately
          a single strip: every extra small bright source wraps into its own
          separate blob on the dome, and the face turns busy/lava-lamp
          instead of reading as one elegant curved sheen (tried and
          reverted). */}
      <Lightformer form="rect" intensity={2.1} color="#ffffff" position={[0, 3.5, 6]} scale={[20, 0.3, 1]} />
    </Environment>
  );
}

export default function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [active, setActive] = useState(true);
  // Frameloop has THREE regimes (see the `frameloop` prop below):
  //   • tab hidden            → "never"  (fully idle)
  //   • a card section near   → "always" (continuous — cards animate every frame)
  //   • otherwise (hero, etc) → "demand" (renders only when invalidated)
  // The concave cylinder backdrop (SceneBackground) is global, so the canvas
  // can no longer go fully idle off the card sections the way it used to —
  // but it doesn't need to run at 60fps there either: the backdrop is static
  // apart from a light cursor parallax, which self-invalidates only while the
  // pointer moves (see SceneBackground.tsx). So "demand" keeps the GPU idle
  // between interactions while still painting the backdrop everywhere, and
  // "always" is reserved for the two sections whose glass cards genuinely
  // animate each frame. The sections are far apart, so at most one is ever
  // near at a time.
  const [cardsNear, setCardsNear] = useState(false);

  useEffect(() => {
    const onVisibility = () => setActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const ids = ["nxr-servicios", "nxr-zoom-parallax"];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const nearby = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) nearby.add(e.target);
          else nearby.delete(e.target);
        }
        setCardsNear(nearby.size > 0);
      },
      { rootMargin: "300px 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
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
        frameloop={!active ? "never" : cardsNear ? "always" : "demand"}
        dpr={isMobile ? [1, 1.25] : [1, 1.5]}
        camera={{ position: [0, 0, CAMERA_DISTANCE], fov: 50, near: 1, far: CAMERA_DISTANCE * 3 }}
        gl={{ alpha: true, antialias: !isMobile, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          // Servicios' frosted cards (VolumetricCard's `transmission` prop)
          // need three.js to capture a copy of what's behind them each frame
          // it's visible — normally at full render-target resolution, which
          // is the expensive part of transmission, not the shading itself.
          // Downscaling that capture is BOTH the efficient choice (a quarter
          // the pixels to copy/mipmap) AND gives the frosted "blurred
          // background" look for free — a low-res capture magnified back up
          // reads as soft blur, so roughness alone doesn't have to do all the
          // blurring work (see VolumetricCard.tsx).
          gl.transmissionResolutionScale = 0.2;
        }}
      >
        <PixelCamera />
        <ambientLight intensity={0.35} />
        <directionalLight position={[500, 800, 600]} intensity={0.5} color="#ffffff" />
        <SceneEnvironment />
        {/* The CRT video wall is desktop-only (continuous video decode + render
            is dropped on mobile per the perf playbook — mobile keeps the cheap
            static concave grid). `active` pauses its ~30fps loop when the tab
            is hidden. */}
        <SceneBackground tv={!isMobile} active={active} />
        <ServiciosCardsLayer isMobile={isMobile} />
        <ZoomParallaxCardsLayer />
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
