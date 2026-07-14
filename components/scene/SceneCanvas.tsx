"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import SceneBackground from "./SceneBackground";
import ServiciosCardsLayer from "./ServiciosCardsLayer";
import ZoomParallaxCardsLayer from "./ZoomParallaxCardsLayer";
import GlassPanelsLayer from "./GlassPanelsLayer";
import PixelCamera, { CAMERA_DISTANCE } from "./PixelCamera";
import { nearSections } from "@/store/sceneActivity";

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
  //   • tab hidden                        → "never"  (fully idle)
  //   • card section near AND user active → "always" (60fps while it matters)
  //   • otherwise (idle, hero, etc)       → "demand" (renders only when invalidated,
  //     in practice at the wall video's frame rate)
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
  // TRUE while the user is actually interacting (scroll/wheel/pointer/touch
  // within the last ~450ms). The "always" 60fps regime used to run
  // CONTINUOUSLY near any glass section — reading a static paragraph next
  // to idle glass panels burned 60 full renders/s (transmission capture +
  // bloom included), the single biggest steady-state heat source. Nothing
  // there moves without input except micro-drifts, which read fine at the
  // video-driven demand rate, so idle now always falls back to "demand".
  // Engage is INSTANT (any input flips it synchronously); disengage lazy.
  const [engaged, setEngaged] = useState(false);
  const engagedRef = useRef(false);
  const lastActivity = useRef(0);
  // The TV-wall video is portrait/landscape-specific (a vertical clip reads as
  // cropped-wrong letterboxed garbage stretched across a wide desktop wall,
  // and vice versa), so — unlike `isMobile` above, a device-class check fixed
  // at mount — this tracks actual aspect ratio and updates live: a phone
  // rotated to landscape, or a desktop window resized narrow, should still
  // get the orientation-matched clip.
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== "undefined" && window.innerHeight > window.innerWidth
  );

  useEffect(() => {
    const onVisibility = () => setActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const onResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const bump = () => {
      lastActivity.current = performance.now();
      if (!engagedRef.current) {
        engagedRef.current = true;
        setEngaged(true);
      }
    };
    // `scroll` covers everything that actually moves the page (Lenis drives
    // the REAL scroll position, including its inertia tail and programmatic
    // glides), pointer/touch/wheel cover hover/tilt interactions that don't
    // scroll.
    window.addEventListener("scroll", bump, { passive: true });
    window.addEventListener("wheel", bump, { passive: true });
    window.addEventListener("pointermove", bump, { passive: true });
    window.addEventListener("touchmove", bump, { passive: true });
    window.addEventListener("touchstart", bump, { passive: true });
    const settle = window.setInterval(() => {
      if (engagedRef.current && performance.now() - lastActivity.current > 450) {
        engagedRef.current = false;
        setEngaged(false);
      }
    }, 200);
    return () => {
      window.removeEventListener("scroll", bump);
      window.removeEventListener("wheel", bump);
      window.removeEventListener("pointermove", bump);
      window.removeEventListener("touchmove", bump);
      window.removeEventListener("touchstart", bump);
      window.clearInterval(settle);
    };
  }, []);

  useEffect(() => {
    // Sections whose glass meshes ANIMATE every frame (scroll-scrubbed reels,
    // GSAP-revealed panels): near any of them the frameloop runs "always" so
    // the meshes track their DOM anchors frame-by-frame; elsewhere "demand".
    // Home sections + the /desarrollo-web ones with live glass panels — ids
    // missing on the current route are simply filtered out below, so one
    // list serves every page the global canvas backs.
    const alwaysIds = [
      "nxr-servicios",
      "nxr-zoom-parallax",
      "nxr-intro",
      "nxr-proceso",
      "nxr-contacto",
      "nxr-dwh-proceso",
      "nxr-dwh-capacidades",
      "nxr-aia-hero",
      "nxr-aia-casos",
    ];
    // The hero hosts one mostly-static panel (the CTA button): it needs its
    // section tracked in `nearSections` so its PanelSlot does work when
    // visible, but NOT a 60fps "always" loop — the TV-wall video already
    // invalidates ~25-30 renders/s page-wide, which tracks a pinned button
    // just fine and keeps the top of the page on the cheap demand loop.
    const ids = [...alwaysIds, "nxr-hero"];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const nearby = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).id;
          if (e.isIntersecting) {
            nearby.add(e.target);
            nearSections.add(id);
          } else {
            nearby.delete(e.target);
            nearSections.delete(id);
          }
        }
        setCardsNear([...nearby].some((el) => (el as HTMLElement).id !== "nxr-hero"));
      },
      { rootMargin: "300px 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => {
      io.disconnect();
      nearSections.clear();
    };
  }, []);

  return (
    <div
      // .nxr-scene-arrive: opacity 0 → 1 on mount (globals.css). The whole
      // canvas mounts lazily on idle (SceneCanvasLazy), so the backdrop
      // FADES onto the dark body instead of popping in mid-load.
      className="nxr-scene-arrive"
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
        frameloop={!active ? "never" : cardsNear && engaged ? "always" : "demand"}
        // Perf pass: 1.25 desktop / 1 mobile (was 1.5 / 1.25). The backdrop is
        // a deliberately pixelated CRT and the cards are frosted glass — the
        // ~40% pixel-count cut is not visible on either, and fill rate is this
        // scene's dominant GPU cost (fullscreen wall + transmission + bloom).
        dpr={isMobile ? 1 : [1, 1.25]}
        camera={{ position: [0, 0, CAMERA_DISTANCE], fov: 50, near: 1, far: CAMERA_DISTANCE * 3 }}
        // antialias false on desktop too: every desktop frame goes through
        // EffectComposer, which renders into its own (multisampled) buffers —
        // MSAA on the default framebuffer was pure wasted memory/bandwidth.
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
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
          // 0.35 (was 0.2): at 0.2 the upscaled capture was SO soft that the
          // transmitted background stopped being recognizable — the glass
          // read as a murky grey pane rather than "I can see through this".
          // 0.35 keeps the image legible through the cards (clearly
          // transparent) while still costing only ~12% of full-res pixels.
          gl.transmissionResolutionScale = 0.35;
        }}
      >
        <PixelCamera />
        <ambientLight intensity={0.35} />
        <directionalLight position={[500, 800, 600]} intensity={0.5} color="#ffffff" />
        <SceneEnvironment />
        {/* The CRT video wall now runs on every screen — portrait screens (phones
            held normally) get a vertical-shot clip, landscape/desktop keeps the
            original horizontal one, so the wall is never showing a
            wrong-orientation video stretched/cropped to fit. `active` pauses
            its ~30fps invalidation loop when the tab is hidden. */}
        <SceneBackground
          tv
          videoSrc={isPortrait ? "/bg-video-vertical.mp4" : "/bg-video.mp4"}
          active={active}
        />
        <ServiciosCardsLayer isMobile={isMobile} />
        <ZoomParallaxCardsLayer isMobile={isMobile} />
        <GlassPanelsLayer isMobile={isMobile} />
        {!isMobile && (
          // multisampling 2 (library default: 8): 8x MSAA on a fullscreen
          // 1.25-DPR buffer was the single most expensive setting in the
          // scene. 2x still smooths the glass-card silhouettes (the only
          // hard edges — the wall is fullscreen, bloom is blurred by
          // definition) at a quarter of the resolve cost.
          <EffectComposer multisampling={2}>
            <Bloom mipmapBlur luminanceThreshold={0.6} luminanceSmoothing={0.3} intensity={0.35} />
            <Vignette eskil={false} offset={0.25} darkness={0.55} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
