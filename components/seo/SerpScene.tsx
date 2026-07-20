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

const C_LIME = new THREE.Color("#a8f04a");
const C_SALMON = new THREE.Color("#ff9d7d");
const C_RED = new THREE.Color("#ef3d0d");
const C_DARK = new THREE.Color("#141020");

// V16.25 ("la animación roja del fondo no se entiende qué es"): rediseño de
// terreno-masa a GRÁFICA DE BARRAS legible — una sola fila de barras que
// asciende de izquierda a derecha (rojo→salmón→lima, la silueta clásica de
// una analítica de crecimiento) más una fila trasera tenue de profundidad.
// Cada barra respira, y el scroll (drive.p) amplifica la pendiente entera:
// la gráfica "despega" mientras tu resultado escala en la SERP del DOM.
function GrowthChart({ drive, isMobile }: { drive: SeoDrive; isMobile: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const bars = isMobile ? 16 : 30;
  const count = bars * 2;
  const spacing = isMobile ? 0.34 : 0.6;
  const barW = spacing * 0.58;
  const hScale = isMobile ? 0.8 : 1;

  // Semillas por barra (fase/velocidad/jitter de altura), fijadas una vez.
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.6,
        jitter: 0.85 + Math.random() * 0.3,
      })),
    [count]
  );

  // Color por instancia: gradiente rojo→salmón→lima de izquierda a derecha
  // (posiciones subiendo); la fila trasera, apagada hacia oscuro.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const col = i % bars;
      const back = i >= bars;
      const t = col / (bars - 1);
      if (t < 0.5) c.lerpColors(C_RED, C_SALMON, t * 2);
      else c.lerpColors(C_SALMON, C_LIME, (t - 0.5) * 2);
      if (back) c.lerp(C_DARK, 0.62);
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [bars, count]);

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

    // Parallax de ratón suavizado + leve acercamiento con el scroll.
    mouse.current.x += (target.current.x - mouse.current.x) * 0.04;
    mouse.current.y += (target.current.y - mouse.current.y) * 0.04;
    g.rotation.y = -0.12 + mouse.current.x * 0.08;
    g.rotation.x = -0.06 + mouse.current.y * 0.04;
    g.position.z = -5.5 + p * 1.6;
    g.position.y = -5.0;

    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const col = i % bars;
      const back = i >= bars;
      const asc = col / (bars - 1);
      // Rampa ascendente SIEMPRE visible (se lee como gráfica desde p=0);
      // el scroll multiplica la pendiente y la respiración la mantiene viva.
      const base = (0.45 + asc * 1.9) * s.jitter * hScale;
      const wave = Math.sin(t * s.speed + s.phase) * 0.16;
      const h = Math.max(0.1, base * (0.55 + 0.8 * p) + wave);
      dummy.position.set((col - (bars - 1) / 2) * spacing, h / 2, back ? -1.3 : 0);
      dummy.scale.set(barW, h, barW);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.42} />
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
      <GrowthChart drive={drive} isMobile={isMobile} />
      {!isMobile && (
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={0.4} luminanceSmoothing={0.3} intensity={0.55} />
          <Vignette eskil={false} offset={0.3} darkness={0.72} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
