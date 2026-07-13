"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ---- Concave "inside a cylinder" backdrop, now a TV wall ------------------
// A large vertical-axis cylindrical wall section behind everything in the
// shared scene, so the whole site reads as living inside a softly-curved tube
// (reference: alche.studio). The centre of the arc is pushed FARthest from the
// camera and both side edges wrap FORWARD toward it — that forward wrap is the
// concave read. The inner face shows a pixelated CRT "screen": a looping video
// (the `videoSrc` prop — SceneCanvas.tsx picks a portrait or landscape clip to
// match the live viewport orientation) or, as a zero-asset placeholder/
// fallback, a procedurally-generated TV test signal (colour bars + rolling
// static) shown until that video's first frame is ready. The grid + depth-glow
// ride on top of it.
//
// All numbers are world units: 1 unit == 1 CSS pixel at z=0 (see PixelCamera).
// Sized so the projected arc overfills both a wide desktop and a tall phone.
const R = 1300; // cylinder radius (smaller = tighter curve)
const PHI_MAX = 1.1; // half-arc in radians (~63°): how far the wall wraps forward at the edges
const Z_CENTER = -1050; // depth of the arc's farthest (central) column — deep so the centre reads clearly farther than the sides
const HEIGHT = 2600; // vertical span (straight — axis is vertical, so no vertical curvature)
const COLS = 220;
const ROWS = 72;
// Unrolled surface width of the arc (2·R·φmax) — the wall's TRUE width for
// aspect math, since u is parameterized by angle (≈ arc length), not by the
// chord. Wall aspect ≈ 1.1 : videos must be "cover"-mapped against this or
// they stretch to fill the whole wall (a 16:9 clip squashed onto a ~1.1:1
// surface was the reported distortion).
const ARC_LEN = 2 * R * PHI_MAX;
const WALL_ASPECT = ARC_LEN / HEIGHT;

function buildArcGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= ROWS; j++) {
    const v = j / ROWS;
    const y = (v - 0.5) * HEIGHT;
    for (let i = 0; i <= COLS; i++) {
      const u = i / COLS;
      const phi = (u - 0.5) * 2 * PHI_MAX;
      const x = R * Math.sin(phi);
      const z = Z_CENTER + R * (1 - Math.cos(phi));
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = COLS + 1;
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const a = j * stride + i;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uCells;
  uniform vec3 uBase;
  uniform vec3 uLine;
  uniform vec3 uGlowCol;
  uniform vec2 uFocus;
  uniform float uTv;       // 1 = show the CRT wall, 0 = plain grid (mobile fallback)
  uniform float uHasVideo; // 1 = sample uSource (real video), 0 = procedural test signal
  uniform sampler2D uSource;
  uniform vec2 uPixel;     // pixelation resolution (cells across / down)
  uniform vec2 uCoverScale; // aspect-correct "cover" crop: fraction of the video sampled per axis
  uniform float uTime;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

  vec3 barColor(float b) {
    if (b < 0.5) return vec3(0.72);
    else if (b < 1.5) return vec3(0.72, 0.72, 0.0);
    else if (b < 2.5) return vec3(0.0, 0.66, 0.72);
    else if (b < 3.5) return vec3(0.0, 0.66, 0.0);
    else if (b < 4.5) return vec3(0.72, 0.0, 0.62);
    else if (b < 5.5) return vec3(0.72, 0.12, 0.0);
    return vec3(0.0, 0.16, 0.72);
  }

  // Zero-asset placeholder: SMPTE-ish colour bars over a band of rolling
  // static, plus a soft bright retrace band sweeping up the screen.
  vec3 proceduralTV(vec2 uv) {
    vec3 col;
    if (uv.y > 0.28) {
      col = barColor(floor(uv.x * 7.0));
    } else {
      vec2 cell = floor(uv * vec2(150.0, 84.0));
      col = vec3(hash(cell + floor(uTime * 9.0)));
    }
    float roll = smoothstep(0.06, 0.0, abs(fract(uv.y * 0.5 - uTime * 0.08) - 0.5));
    col += roll * 0.12;
    return col;
  }

  vec3 sampleSource(vec2 uv) {
    if (uHasVideo > 0.5) {
      // "cover" mapping: sample only the central uCoverScale fraction of the
      // video so it fills the wall at its NATIVE aspect (excess is cropped,
      // never stretched) — computed in JS from videoWidth/Height vs the
      // wall's unrolled aspect.
      vec2 cuv = vec2(0.5) + (uv - vec2(0.5)) * uCoverScale;
      return texture2D(uSource, cuv).rgb;
    }
    return proceduralTV(uv);
  }

  void main() {
    // Crisp grid via screen-space derivatives (constant ~1px lines).
    vec2 g = vUv * uCells;
    vec2 gr = abs(fract(g - 0.5) - 0.5) / fwidth(g);
    float line = 1.0 - min(min(gr.x, gr.y), 1.0);

    // Depth: light pooling toward uFocus + outward vignette.
    float d = distance(vUv, uFocus);
    float glow = smoothstep(0.85, 0.0, d);
    float vig = smoothstep(1.2, 0.1, d);

    vec3 fill;
    if (uTv > 0.5) {
      // Chunky pixelation (in the curved UV, so the pixels follow the
      // concave deformation) + RGB split + scanlines = CRT screen.
      vec2 puv = (floor(vUv * uPixel) + 0.5) / uPixel;
      float o = 1.3 / uPixel.x;
      float r = sampleSource(puv + vec2(o, 0.0)).r;
      float gg = sampleSource(puv).g;
      float b = sampleSource(puv - vec2(o, 0.0)).b;
      vec3 tv = vec3(r, gg, b);
      tv *= 0.78 + 0.22 * sin(vUv.y * uPixel.y * 6.28318);
      // Dim + tint toward the site's dark base so overlaid text stays legible.
      fill = mix(uBase * 0.7, tv, 0.5);
    } else {
      fill = uBase;
    }

    vec3 col = fill;
    col += uGlowCol * glow * 0.10;
    col += uLine * line * (0.05 + 0.28 * glow);
    col *= (0.42 + 0.58 * vig);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function SceneBackground({
  tv,
  videoSrc,
  active,
}: {
  tv: boolean;
  videoSrc: string | null;
  active: boolean;
}) {
  const geometry = useMemo(() => buildArcGeometry(), []);
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const invalidate = useThree((s) => s.invalidate);

  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  // Live handle to the current <video> for the keep-alive interval below —
  // rendering must never depend on the video actually playing (phones can
  // refuse/delay autoplay, and in "demand" mode the video's rVFC is the
  // page-wide invalidation source: a stalled video used to freeze ALL
  // demand-mode rendering, including the hero CTA's glass panel).
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  // Always-valid 1x1 texture so `uSource` samples something before/without a
  // real video (the procedural path ignores it, but the sampler must be bound).
  const blankTex = useMemo(() => {
    const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    t.needsUpdate = true;
    return t;
  }, []);

  const uniforms = useMemo(
    () => ({
      uCells: { value: new THREE.Vector2(52, 40) },
      uBase: { value: new THREE.Color("#070b13") },
      uLine: { value: new THREE.Color("#33445f") },
      uGlowCol: { value: new THREE.Color("#1b2942") },
      uFocus: { value: new THREE.Vector2(0.5, 0.46) },
      uTv: { value: tv ? 1 : 0 },
      uHasVideo: { value: 0 },
      uSource: { value: blankTex as THREE.Texture },
      // Square CRT pixels: rows derived from the wall's real (unrolled)
      // aspect — the old fixed 180×110 grid had ~16×24-world-unit cells,
      // whose 1.5× vertical stretch was itself part of the reported
      // distortion.
      uPixel: { value: new THREE.Vector2(180, Math.round(180 / WALL_ASPECT)) },
      uCoverScale: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uTv.value = tv ? 1 : 0;
  }, [tv]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => blankTex.dispose(), [blankTex]);

  // Real video → VideoTexture. No-op while `videoSrc` is null (the procedural
  // placeholder runs instead). Depends on `videoSrc` itself (not just `tv`),
  // so an orientation flip (SceneCanvas.tsx swaps portrait/landscape clips)
  // tears down this video/texture and builds the other one, rather than
  // trying to swap `.src` on a live VideoTexture. Playback/invalidation is tuned
  // to decode and render no more than the video actually needs:
  //  - `requestVideoFrameCallback` (rVFC) invalidates the canvas exactly when
  //    a NEW decoded frame is ready — never faster than the video's own frame
  //    rate, and it naturally stops firing if the video stalls/buffers, unlike
  //    a blind interval that would keep invalidating (and re-rendering the
  //    whole scene) for nothing.
  //  - The `<video>` itself is paused (not just "not rendered") on
  //    visibilitychange, so a hidden tab does zero decode work, not just zero
  //    GPU upload.
  //  - `preload="auto"` + eager `.play()` on `loadeddata` so the loop is
  //    already primed by the time anyone scrolls to where it's visible —
  //    there's only one instance for the whole site, so this is a single
  //    decode pipeline, not one per section.
  useEffect(() => {
    if (!tv || !videoSrc) return;
    const video = document.createElement("video");
    video.src = videoSrc;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter; // keep the pixelation crisp
    tex.minFilter = THREE.LinearFilter;
    // Captured once — the material is stable for this component's lifetime, so
    // the same instance is valid across every callback/cleanup below.
    const mat = matRef.current;

    const supportsRVFC = typeof video.requestVideoFrameCallback === "function";
    let rvfcId: number | null = null;
    const onFrame = () => {
      invalidate();
      if (!document.hidden) rvfcId = video.requestVideoFrameCallback(onFrame);
    };

    const onReady = () => {
      if (mat) {
        mat.uniforms.uSource.value = tex;
        mat.uniforms.uHasVideo.value = 1;
        // Aspect-correct cover crop for THIS clip against the wall's
        // unrolled aspect (see sampleSource in the fragment shader).
        const va = video.videoWidth / video.videoHeight || 1;
        const cover = mat.uniforms.uCoverScale.value as THREE.Vector2;
        if (va > WALL_ASPECT) cover.set(WALL_ASPECT / va, 1);
        else cover.set(1, va / WALL_ASPECT);
      }
      video.play().catch(() => {});
      if (supportsRVFC) rvfcId = video.requestVideoFrameCallback(onFrame);
    };
    video.addEventListener("loadeddata", onReady);

    // Fallback ONLY for browsers without rVFC — a light interval just to keep
    // the canvas repainting while the video plays.
    let fallbackInterval: number | null = null;
    if (!supportsRVFC) {
      fallbackInterval = window.setInterval(() => {
        if (!document.hidden) invalidate();
      }, 33);
    }

    const onVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
        if (supportsRVFC) rvfcId = video.requestVideoFrameCallback(onFrame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Phones can refuse the eager autoplay (data saver, low-power mode,
    // browser quirks) — retry on any real user gesture, which always
    // satisfies autoplay policies. Cheap no-op once playing.
    const kick = () => {
      if (video.paused && !document.hidden) video.play().catch(() => {});
    };
    window.addEventListener("touchstart", kick, { passive: true });
    window.addEventListener("pointerdown", kick, { passive: true });

    // Decode/network failure → fall back to the procedural TV signal (the
    // keep-alive interval below animates it) instead of a frozen dark wall.
    const onError = () => {
      if (mat) {
        mat.uniforms.uHasVideo.value = 0;
        mat.uniforms.uSource.value = blankTex;
      }
    };
    video.addEventListener("error", onError);

    videoElRef.current = video;

    return () => {
      videoElRef.current = null;
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);
      window.removeEventListener("touchstart", kick);
      window.removeEventListener("pointerdown", kick);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rvfcId !== null) video.cancelVideoFrameCallback(rvfcId);
      if (fallbackInterval !== null) window.clearInterval(fallbackInterval);
      video.pause();
      video.src = "";
      tex.dispose();
      if (mat) {
        mat.uniforms.uHasVideo.value = 0;
        mat.uniforms.uSource.value = blankTex;
      }
    };
  }, [tv, videoSrc, blankTex, invalidate]);

  // Cursor parallax. Each mousemove kicks a render (the canvas runs
  // "demand" off the card sections), and the ease-out below re-invalidates
  // itself until it settles.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
      invalidate();
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [invalidate]);

  // Keep-alive invalidation at ~30fps whenever the video is NOT actually
  // producing frames (no video configured, still loading/buffering, autoplay
  // refused, decode error). While the video plays, its rVFC is the exact
  // per-decoded-frame invalidation source and this tick is a no-op check —
  // so there's never a redundant second source, but demand-mode rendering
  // (the wall, the hero CTA's glass panel) can no longer be starved by a
  // stalled video, which on some phones froze the whole backdrop. Paused
  // while the tab is hidden; `tv=false` stays fully demand-idle.
  useEffect(() => {
    if (!tv || !active) return;
    const id = window.setInterval(() => {
      const v = videoElRef.current;
      const videoPlaying = v && !v.paused && v.readyState >= 3;
      if (!document.hidden && !videoPlaying) invalidate();
    }, 33);
    return () => window.clearInterval(id);
  }, [tv, active, invalidate]);

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    const c = current.current;
    const t = target.current;
    c.x += (t.x - c.x) * 0.09;
    c.y += (t.y - c.y) * 0.09;

    const group = groupRef.current;
    if (group) {
      group.rotation.y = c.x * 0.09;
      group.rotation.x = -c.y * 0.065;
    }
    const mat = matRef.current;
    if (mat) {
      (mat.uniforms.uFocus.value as THREE.Vector2).set(0.5 + c.x * 0.14, 0.46 - c.y * 0.11);
    }

    if (Math.abs(t.x - c.x) > 0.001 || Math.abs(t.y - c.y) > 0.001) invalidate();
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} frustumCulled={false} renderOrder={-10}>
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
