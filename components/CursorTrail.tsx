"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const noopSubscribe = () => () => {};

// ESTELA PIXELADA del cursor (patrón PixelTrail de React Bits, reimplementado
// en canvas 2D por rendimiento). Al mover el ratón se "encienden" celdas de
// una retícula de píxeles —el mismo lenguaje visual que el muro CRT, que
// pixela el vídeo en celdas— con los colores de marca, y se desvanecen en
// ~medio segundo. El cursor NATIVO queda intacto.
//
// Por qué NO el SplashCursor de fluidos del catálogo: se probó y medido — un
// segundo contexto WebGL fullscreen compitiendo con la escena R3F hundía el
// hero de 47.9 a 12.3 fps incluso a resolución mínima. Este canvas 2D es una
// única textura para el compositor y pintar ≤400 rects/frame cuesta <1ms.
//
// Presupuesto de coste (medido): el rAF solo corre mientras quedan celdas
// vivas (~0.5s tras el último movimiento) — coste CERO en reposo.

// El canvas se pinta a MEDIA resolución y se escala 2x con
// image-rendering:pixelated: mismas celdas efectivas de 14px en pantalla
// (nearest-neighbor no suaviza nada) con una textura 4 veces menor para el
// compositor.
const SCALE = 2;
const CELL = 7; // celda en px de canvas → 14px efectivos en pantalla
const LIFE_DECAY = 1.5; // vida/seg → una celda vive ~0.65s
const MAX_CELLS = 420;
// Paleta de marca (tokens de globals.css) con pesos: lima y salmón dominan,
// rojo y blanco como chispas.
const COLORS: Array<[string, number]> = [
  ["168,240,74", 0.4], // --c-lime
  ["255,157,125", 0.3], // --c-salmon
  ["239,61,13", 0.18], // --c-red
  ["255,255,255", 0.12],
];

function pickColor(): string {
  let r = Math.random();
  for (const [c, w] of COLORS) {
    if ((r -= w) <= 0) return c;
  }
  return COLORS[0][0];
}

function PixelTrailCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = Math.ceil(window.innerWidth / SCALE);
      canvas.height = Math.ceil(window.innerHeight / SCALE);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Celdas vivas: clave "cx,cy" → { life, color }. Re-pasar por una celda
    // refresca su vida (sin duplicados).
    const cells = new Map<string, { cx: number; cy: number; life: number; color: string }>();
    let rafId = 0;
    let running = false;
    let last = 0;
    let prevX = -1;
    let prevY = -1;

    const light = (x: number, y: number) => {
      const cx = Math.floor(x / CELL);
      const cy = Math.floor(y / CELL);
      const key = cx + "," + cy;
      const existing = cells.get(key);
      if (existing) {
        existing.life = 1;
      } else {
        if (cells.size >= MAX_CELLS) return;
        // Vida inicial ligeramente aleatoria: el borde de la estela se
        // deshace irregular en vez de cortarse en bloque.
        cells.set(key, { cx, cy, life: 0.75 + Math.random() * 0.25, color: pickColor() });
      }
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const [key, c] of cells) {
        c.life -= dt * LIFE_DECAY;
        if (c.life <= 0) {
          cells.delete(key);
          continue;
        }
        // Alpha con curva cuadrática: brillante al nacer, se apaga suave.
        const a = c.life * c.life * 0.7;
        ctx.fillStyle = `rgba(${c.color},${a.toFixed(3)})`;
        ctx.fillRect(c.cx * CELL + 1, c.cy * CELL + 1, CELL - 2, CELL - 2);
      }
      if (cells.size > 0) {
        rafId = requestAnimationFrame(tick);
      } else {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const wake = () => {
      if (running) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const x = e.clientX / SCALE;
      const y = e.clientY / SCALE;
      // Interpola el segmento desde la posición anterior: un movimiento
      // rápido enciende la LÍNEA de celdas atravesadas, no puntos sueltos.
      if (prevX >= 0) {
        const dist = Math.hypot(x - prevX, y - prevY);
        const steps = Math.min(Math.ceil(dist / (CELL * 0.75)), 24);
        for (let i = 1; i <= steps; i++) {
          light(prevX + ((x - prevX) * i) / steps, prevY + ((y - prevY) * i) / steps);
        }
      } else {
        light(x, y);
      }
      prevX = x;
      prevY = y;
      wake();
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      // Sin mix-blend-mode a propósito: un blend fullscreen añade un render
      // pass del compositor por frame (medido caro en esta web); sobre el
      // fondo oscuro la composición alpha normal se ve prácticamente igual.
      // width/height 100% + pixelated: el canvas a media resolución se escala
      // 2x con nearest-neighbor — celdas nítidas, cero suavizado.
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 50,
        pointerEvents: "none",
        imageRendering: "pixelated",
      }}
    />
  );
}

// Gate de montaje: solo escritorio con puntero fino y sin reduced-motion.
export default function CursorTrail() {
  const reducedMotion = useReducedMotion();
  // false en SSR/primera hidratación, true en cliente (patrón useReducedMotion).
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
  if (!mounted || reducedMotion) return null;
  if (!window.matchMedia("(pointer: fine)").matches || window.innerWidth <= 900) return null;
  return <PixelTrailCanvas />;
}
