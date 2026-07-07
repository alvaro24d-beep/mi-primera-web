"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// Ambient depth layer behind the building browser: code tokens drifting in
// 3D. This is thematic on purpose (code = web development) instead of the
// abstract crystal it replaces, and it stays a *backdrop* — the actual
// representational storytelling (the site building itself) happens in the
// crisp DOM browser layered on top (see BrowserBuild.tsx).
const TOKENS: { text: string; color: string }[] = [
  { text: "</>", color: "#a8f04a" },
  { text: "{ }", color: "#ff9d7d" },
  { text: "<div>", color: "#a8f04a" },
  { text: "</html>", color: "#ff9d7d" },
  { text: "const", color: "#ef3d0d" },
  { text: "()=>", color: "#a8f04a" },
  { text: "<img/>", color: "#ff9d7d" },
  { text: "flex", color: "#a8f04a" },
  { text: "#fff", color: "#ef3d0d" },
  { text: "px", color: "#ff9d7d" },
];

function makeTokenTexture(text: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 128);
  ctx.font = "600 64px ui-monospace, 'SF Mono', Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 68);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function GlyphField() {
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  const textures = useMemo(() => TOKENS.map((t) => makeTokenTexture(t.text, t.color)), []);

  const sprites = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        texIndex: i % TOKENS.length,
        x: (Math.random() - 0.5) * 28,
        y: (Math.random() - 0.5) * 17,
        z: (Math.random() - 0.5) * 12 - 8,
        scale: 0.5 + Math.random() * 0.55,
        speed: 0.15 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.1 + Math.random() * 0.16,
      })),
    []
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    mouse.current.x += (target.current.x - mouse.current.x) * 0.04;
    mouse.current.y += (target.current.y - mouse.current.y) * 0.04;
    g.rotation.y = mouse.current.x * 0.18;
    g.rotation.x = -mouse.current.y * 0.12;

    const t = state.clock.elapsedTime;
    g.children.forEach((child, i) => {
      const s = sprites[i];
      if (!s) return;
      child.position.y = s.y + Math.sin(t * s.speed + s.phase) * 0.8;
      child.position.x = s.x + Math.cos(t * s.speed * 0.7 + s.phase) * 0.5;
    });
  });

  return (
    <group ref={groupRef}>
      {sprites.map((s, i) => (
        <sprite key={i} position={[s.x, s.y, s.z]} scale={[s.scale * 2, s.scale, 1]}>
          <spriteMaterial
            map={textures[s.texIndex]}
            transparent
            opacity={s.opacity}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}

function Atmosphere() {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x05070d, 0.02);
    return () => {
      scene.fog = null;
    };
  }, [scene]);
  return null;
}

export default function HeroScene() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 12], fov: 55, near: 0.1, far: 100 }} gl={{ alpha: true }}>
      <Atmosphere />
      <GlyphField />
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.5} luminanceSmoothing={0.3} intensity={0.5} />
        <Vignette eskil={false} offset={0.3} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
