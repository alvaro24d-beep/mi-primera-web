"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const noopSubscribe = () => () => {};

// ESTELA DE HUMO del cursor. Al mover el ratón nacen volutas suaves de color
// que heredan el impulso del gesto, se expanden, derivan levemente hacia
// arriba y se funden — el color va rotando por el espectro como en el efecto
// de fluidos original. El cursor NATIVO queda intacto.
//
// Técnica: PARTÍCULAS con sprites difuminados en canvas 2D (composición
// aditiva DENTRO del canvas). El SplashCursor de fluidos real (React Bits) se
// probó y medía 12 fps — un segundo contexto WebGL fullscreen compitiendo con
// la escena R3F es inviable aquí. Esto da el mismo carácter de humo con coste
// ~cero: sprites pre-renderizados (12 tonos en una rueda de hue), ≤140
// drawImage por frame a MEDIA resolución (el upscale suave además ayuda al
// look de humo), y un rAF que solo corre mientras quedan volutas vivas.

const SCALE = 2; // canvas a media resolución, escalado suave por CSS
const MAX_PARTICLES = 140;
const SPRITE = 64; // tamaño del sprite base px
const HUES = 12; // sprites precacheados en rueda de 30°

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 → 0
  decay: number; // vida/seg
  size: number;
  growth: number; // px/seg
  hue: number; // índice de sprite
}

function makeSprites(): HTMLCanvasElement[] {
  const sprites: HTMLCanvasElement[] = [];
  for (let i = 0; i < HUES; i++) {
    const c = document.createElement("canvas");
    c.width = SPRITE;
    c.height = SPRITE;
    const ctx = c.getContext("2d")!;
    const h = (i * 360) / HUES;
    const g = ctx.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
    // Núcleo casi blanco con el tono, que se apaga a transparente: en
    // composición aditiva varias volutas superpuestas dan el cuerpo del humo.
    g.addColorStop(0, `hsla(${h}, 90%, 72%, 0.55)`);
    g.addColorStop(0.35, `hsla(${h}, 95%, 58%, 0.28)`);
    g.addColorStop(1, `hsla(${h}, 95%, 50%, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SPRITE, SPRITE);
    sprites.push(c);
  }
  return sprites;
}

function SmokeTrailCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sprites = makeSprites();

    const resize = () => {
      canvas.width = Math.ceil(window.innerWidth / SCALE);
      canvas.height = Math.ceil(window.innerHeight / SCALE);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const particles: Particle[] = [];
    let rafId = 0;
    let running = false;
    let last = 0;
    let prevX = -1;
    let prevY = -1;
    // El tono base rota despacio con el tiempo (como el rainbow del fluido);
    // cada voluta nace con el tono actual + un poco de dispersión.
    let huePhase = Math.random() * HUES;

    const spawn = (x: number, y: number, mvx: number, mvy: number) => {
      if (particles.length >= MAX_PARTICLES) return;
      particles.push({
        x,
        y,
        // Hereda el impulso del gesto + jitter: el humo "sale despedido"
        // en la dirección del movimiento y se frena enseguida.
        vx: mvx * 3.2 + (Math.random() - 0.5) * 14,
        vy: mvy * 3.2 + (Math.random() - 0.5) * 14 - 6,
        life: 1,
        decay: 0.9 + Math.random() * 0.5, // vive ~0.7-1.1s
        size: 14 + Math.random() * 10,
        growth: 26 + Math.random() * 18,
        hue: Math.floor(huePhase + Math.random() * 1.6) % HUES,
      });
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      huePhase = (huePhase + dt * 2.2) % HUES;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt * p.decay;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 1 - dt * 2.2; // fricción: el impulso muere rápido
        p.vy = p.vy * (1 - dt * 2.2) - dt * 9; // deriva ascendente suave
        p.size += p.growth * dt; // el humo se expande al disiparse
        // Curva de alpha: entra fuerte, se funde suave al final.
        ctx.globalAlpha = p.life * p.life;
        const s = p.size;
        ctx.drawImage(sprites[p.hue], p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      if (particles.length > 0) {
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
      if (prevX >= 0) {
        const dx = x - prevX;
        const dy = y - prevY;
        const dist = Math.hypot(dx, dy);
        // Volutas repartidas a lo largo del tramo (gesto rápido = más humo,
        // sin huecos), con el impulso del gesto.
        const steps = Math.min(Math.max(1, Math.round(dist / 7)), 6);
        for (let i = 1; i <= steps; i++) {
          spawn(prevX + (dx * i) / steps, prevY + (dy * i) / steps, dx, dy);
        }
      } else {
        spawn(x, y, 0, 0);
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
      // Sin mix-blend-mode CSS a propósito (un blend fullscreen añade un
      // render pass del compositor): el aditivo va DENTRO del canvas
      // (globalCompositeOperation lighter), que para el compositor es una
      // textura normal. El escalado 2x suave difumina — bien para humo.
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 50,
        pointerEvents: "none",
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
  return <SmokeTrailCanvas />;
}
