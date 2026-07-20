"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// Capa ambiental detrás de la SERP que se construye en el DOM: un TERRENO DE
// BARRAS DE ANALÍTICA (una gráfica de posiciones/clics hecha paisaje) que
// respira y CRECE conforme el scroll avanza — temático a propósito (barras
// que suben = rankings subiendo), igual que los glifos de código lo son en
// /desarrollo-web. La narración representacional de verdad (tu resultado
// escalando al #1) ocurre en la SERP nítida del DOM encima (SeoHero.tsx).
//
// El scroll NO se lee aquí: SeoHero escribe su progreso en `drive.p` (patrón
// del ref de AGENTS.md — el driver GSAP vive en el DOM, el consumidor en
// R3F) y cada frame lo usa para el dolly de cámara y el empuje de altura.

export type SeoDrive = { p: number };

const COLS = 26;
const ROWS = 12;
const COUNT = COLS * ROWS;
const COLS_M = 14;
const ROWS_M = 9;
const COUNT_M = COLS_M * ROWS_M;

const C_LIME = new THREE.Color("#a8f04a");
const C_SALMON = new THREE.Color("#ff9d7d");
const C_RED = new THREE.Color("#ef3d0d");
const C_DARK = new THREE.Color("#1a1420");

function BarTerrain({ drive, isMobile }: { drive: SeoDrive; isMobile: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const cols = isMobile ? COLS_M : COLS;
  const rows = isMobile ? ROWS_M : ROWS;
  const count = isMobile ? COUNT_M : COUNT;

  // Semillas por barra (fase/velocidad/altura base), fijadas una vez.
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.5,
        base: 0.25 + Math.random() * 0.6,
      })),
    [count]
  );

  // Color por instancia, una vez: gradiente rojo→salmón→lima hacia el fondo
  // (la dirección en la que "suben" las posiciones), oscurecido por columna
  // para dar profundidad.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const t = row / (rows - 1);
      if (t < 0.5) c.lerpColors(C_RED, C_SALMON, t * 2);
      else c.lerpColors(C_SALMON, C_LIME, (t - 0.5) * 2);
      c.lerp(C_DARK, 0.55 - t * 0.3);
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cols, rows, count]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    const g = groupRef.current;
    if (!mesh || !g) return;
    const t = state.clock.elapsedTime;
    const p = drive.p;

    // Parallax de ratón suavizado + dolly por scroll: la cámara del canvas es
    // fija, así que el "dolly" se hace acercando/inclinando el grupo entero.
    mouse.current.x += (target.current.x - mouse.current.x) * 0.04;
    mouse.current.y += (target.current.y - mouse.current.y) * 0.04;
    g.rotation.y = mouse.current.x * 0.1;
    g.rotation.x = -0.52 + mouse.current.y * 0.05 + p * 0.1;
    g.position.z = -6 + p * 2.4;
    g.position.y = -5.1 - p * 0.4;

    const spacing = 1.05;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const rowT = row / (rows - 1);
      // La ola respira siempre; el progreso del scroll EMPUJA la altura
      // media hacia arriba, más fuerte cuanto más "al fondo" (posiciones
      // altas) — el paisaje entero asciende contigo.
      const wave = Math.sin(t * s.speed + s.phase + col * 0.35) * 0.22;
      const h = Math.max(0.08, s.base + wave + p * (0.35 + rowT * 1.4));
      dummy.position.set((col - (cols - 1) / 2) * spacing, h / 2, -(row - (rows - 1) / 2) * spacing);
      dummy.scale.set(0.62, h, 0.62);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.32} />
      </instancedMesh>
    </group>
  );
}

function Atmosphere() {
  return (
    <>
      <fogExp2 attach="fog" args={[0x05070d, 0.045]} />
    </>
  );
}

export default function SerpScene({ drive }: { drive: SeoDrive }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Mismo reparto de coste que dwh/HeroScene: sin composer, sin antialias y
  // menos instancias en móvil; loop parado fuera de pantalla o con la
  // pestaña oculta.
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let inView = true;
    let visible = document.visibilityState === "visible";
    const update = () => setActive(inView && visible);
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        update();
      },
      { rootMargin: "150px" }
    );
    io.observe(el);
    const onVis = () => {
      visible = document.visibilityState === "visible";
      update();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <Canvas
      ref={canvasRef}
      frameloop={active ? "always" : "never"}
      dpr={isMobile ? [1, 1.25] : [1, 2]}
      camera={{ position: [0, 0, 11], fov: 50, near: 0.1, far: 80 }}
      gl={{ alpha: true, antialias: !isMobile, powerPreference: "high-performance" }}
    >
      <Atmosphere />
      <BarTerrain drive={drive} isMobile={isMobile} />
      {!isMobile && (
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={0.4} luminanceSmoothing={0.3} intensity={0.55} />
          <Vignette eskil={false} offset={0.3} darkness={0.72} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
