"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// ===== Formación del H1 por fragmentos =====
// Concepto adaptado del "Emoji Particle" de Originkit (aprobado por Álvaro:
// "fragmentos sueltos que se juntan para formar un texto", sin emojis): el
// titular de la home se ensambla a partir de glifos monospace sueltos —
// letras, dígitos y símbolos de código, la misma identidad del efecto
// scramble de Intro/reel — que vuelan desde fuera del hero hasta ocupar la
// silueta exacta del texto, y al asentarse se funden con el H1 real.
//
// SEO/a11y: el <h1> REAL está siempre en el DOM con su texto completo
// (renderizado en servidor); este canvas es solo pintura (aria-hidden,
// pointer-events none). Durante la formación el texto va oculto con la
// clase .nxr-hero-h1-assemble (mismo patrón CSS-oculta/JS-revela que
// .nxr-intro-texts o .nxr-hero-mastery), y un watchdog fuerza la
// revelación aunque cualquier paso falle — el título nunca puede quedarse
// invisible.
//
// Muestreo desde el DOM real, no desde un texto configurado: cada palabra
// del h1 se mide con un Range (rect por palabra — una palabra nunca parte
// línea por dentro, así que el wrapping responsive queda cubierto gratis) y
// se redibuja en un canvas offscreen con su fuente/color computados
// (Rajdhani uppercase; blanco la línea 1, lima el span gradient). Los
// píxeles con tinta se muestrean a un paso fijo y cada punto se convierte
// en un fragmento con el COLOR del píxel — si mañana cambia el texto, el
// wrapping o los colores, esto se adapta solo.
//
// Física adaptada de Originkit: cada fragmento persigue con un muelle
// (STIFFNESS/DAMPING) un objetivo que viaja de su punto de aparición (fuera
// del hero) a su casilla final con easing — organicidad del muelle +
// aterrizaje determinista. Se quitaron las colisiones y la repulsión del
// puntero del original: es una entrada one-shot de ~2s, no una escena
// interactiva persistente. Al completar: crossfade al h1 real, se cancela
// el rAF y el canvas pasa a display:none — coste residual CERO (playbook).
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{}[]#&+=";
const FLY_MS = 1250; // vuelo de un fragmento (su objetivo llega a casa)
const STAGGER_MS = 520; // escalonado de salida entre fragmentos
const SETTLE_MS = 260; // margen para que los muelles asienten tras volar
const SWAP_MS = 420; // crossfade fragmentos → texto real (= CSS .38s + margen)
const WATCHDOG_MS = 4000; // pase lo que pase, el título se revela
const ALPHA_IN_MS = 140; // fade-in de cada fragmento al aparecer
const STIFFNESS = 120;
const DAMPING = 18;
const MAX_SPEED = 2600;
const INK_ALPHA = 40; // umbral de alpha para considerar un píxel "tinta"

interface Frag {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  vx: number;
  vy: number;
  glyph: string;
  size: number;
  color: string;
  delay: number;
}

function easeOutCubic(t: number) {
  const u = 1 - t;
  return 1 - u * u * u;
}

// Punto de aparición: sobre un rayo con ángulo aleatorio desde la casilla
// final, más allá del borde del canvas (mismo planteamiento que el
// spawnFor de Originkit) — los fragmentos entran desde todos los lados.
function spawnFor(homeX: number, homeY: number, W: number, H: number): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const tx = dx > 0 ? (W - homeX) / dx : dx < 0 ? -homeX / dx : Infinity;
  const ty = dy > 0 ? (H - homeY) / dy : dy < 0 ? -homeY / dy : Infinity;
  const out = Math.min(tx, ty) + 40 + Math.random() * Math.max(W, H) * 0.2;
  return [homeX + dx * out, homeY + dy * out];
}

function shuffle<T>(a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

export default function HeroTitleAssemble({ h1Ref }: { h1Ref: RefObject<HTMLHeadingElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // El branch reduced-motion de Hero no monta este componente, pero el
    // doble guard es gratis y a prueba de reordenaciones futuras.
    if (reducedMotion) {
      h1Ref.current?.classList.add("nxr-h1-on");
      return;
    }
    const canvas = canvasRef.current;
    const h1 = h1Ref.current;
    if (!canvas || !h1) return;

    let cancelled = false;
    let raf = 0;
    let swapTimer = 0;
    let revealed = false;

    // Revelación única: texto real dentro (CSS transiciona su opacity),
    // canvas fuera. Sirve para el final feliz Y para todos los fallbacks
    // (watchdog, resize a mitad, muestreo vacío, getImageData bloqueado).
    const reveal = (keepCanvasWhileFading: boolean) => {
      if (revealed) return;
      revealed = true;
      h1.classList.add("nxr-h1-on");
      canvas.classList.add("nxr-hero-assemble-out");
      swapTimer = window.setTimeout(
        () => {
          cancelAnimationFrame(raf);
          canvas.style.display = "none";
        },
        keepCanvasWhileFading ? SWAP_MS : 0
      );
    };
    const watchdog = window.setTimeout(() => reveal(true), WATCHDOG_MS);

    // Un resize durante la formación invalida las casillas medidas (el
    // título puede re-envolver líneas): mejor un final anticipado limpio
    // que fragmentos aterrizando donde el texto ya no está.
    const onResize = () => reveal(true);
    window.addEventListener("resize", onResize, { passive: true });

    const start = async () => {
      // Sin las fuentes reales cargadas se muestrearía la silueta del
      // fallback del sistema y el crossfade final "saltaría" de forma.
      try {
        await document.fonts.ready;
      } catch {
        /* ancho de banda del watchdog */
      }
      // Un frame extra para que el layout post-fuentes esté asentado.
      await new Promise((r) => requestAnimationFrame(r));
      if (cancelled || revealed) return;

      const holder = canvas.parentElement;
      if (!holder) return reveal(true);
      const box = holder.getBoundingClientRect();
      const W = Math.round(box.width);
      const H = Math.round(box.height);
      if (!W || !H) return reveal(true);

      // ---- 1. Redibujar el h1 palabra a palabra en un offscreen 1x ----
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const oc = off.getContext("2d", { willReadFrequently: true });
      if (!oc) return reveal(true);
      oc.textAlign = "center";
      oc.textBaseline = "middle";

      const isMobile = window.innerWidth < 768;
      let titlePx = 60;
      const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const textNode = node as Text;
        const parent = textNode.parentElement;
        if (!parent) continue;
        const cs = getComputedStyle(parent);
        const px = parseFloat(cs.fontSize) || 60;
        titlePx = Math.max(titlePx, px);
        oc.font = `${cs.fontStyle} ${cs.fontWeight} ${px}px ${cs.fontFamily}`;
        try {
          // Chrome soporta letterSpacing en el contexto 2D; donde no, el
          // desvío por palabra es subpíxel (0.01em) — ignorable.
          (oc as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing;
        } catch {
          /* opcional */
        }
        oc.fillStyle = cs.color;
        const upper = cs.textTransform === "uppercase";
        const raw = textNode.nodeValue ?? "";
        for (const m of raw.matchAll(/\S+/g)) {
          range.setStart(textNode, m.index);
          range.setEnd(textNode, m.index + m[0].length);
          const r = range.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) continue;
          const word = upper ? m[0].toUpperCase() : m[0];
          oc.fillText(word, r.left - box.left + r.width / 2, r.top - box.top + r.height / 2);
        }
      }

      // ---- 2. Muestrear la tinta a paso fijo → fragmentos ----
      let px: Uint8ClampedArray;
      try {
        px = oc.getImageData(0, 0, W, H).data;
      } catch {
        return reveal(true);
      }
      const gap = Math.max(5, Math.round(titlePx * (isMobile ? 0.13 : 0.09)));
      const maxFrags = isMobile ? 450 : 900;
      const pts: [number, number, string][] = [];
      for (let y = 0; y < H; y += gap) {
        for (let x = 0; x < W; x += gap) {
          const i = (y * W + x) * 4;
          if (px[i + 3] < INK_ALPHA) continue;
          pts.push([x, y, `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`]);
        }
      }
      if (!pts.length) return reveal(true);
      shuffle(pts);
      if (pts.length > maxFrags) pts.length = maxFrags;

      const base = Math.max(9, Math.min(16, titlePx * 0.16));
      const frags: Frag[] = pts.map(([hx, hy, color]) => {
        const [sx, sy] = spawnFor(hx, hy, W, H);
        return {
          homeX: hx,
          homeY: hy,
          x: sx,
          y: sy,
          startX: sx,
          startY: sy,
          vx: 0,
          vy: 0,
          glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0],
          size: Math.round(base * (0.75 + Math.random() * 0.5)),
          color,
          delay: Math.random() * STAGGER_MS,
        };
      });
      // Orden por tamaño y color: el bucle de dibujo solo cambia ctx.font /
      // fillStyle cuando cambian de verdad (mismo truco que Originkit).
      frags.sort((a, b) => a.size - b.size || (a.color < b.color ? -1 : 1));

      // ---- 3. Bucle de animación en el canvas visible ----
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return reveal(true);
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const mono =
        getComputedStyle(document.documentElement).getPropertyValue("--font-space-mono").trim() || "monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const t0 = performance.now();
      let last = t0;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const elapsed = now - t0;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        let lastSize = -1;
        let lastColor = "";
        for (const f of frags) {
          const own = elapsed - f.delay;
          if (own < 0) continue;
          const t = easeOutCubic(own >= FLY_MS ? 1 : own / FLY_MS);
          const tx = f.startX + (f.homeX - f.startX) * t;
          const ty = f.startY + (f.homeY - f.startY) * t;
          f.vx += ((tx - f.x) * STIFFNESS - f.vx * DAMPING) * dt;
          f.vy += ((ty - f.y) * STIFFNESS - f.vy * DAMPING) * dt;
          const sp = Math.hypot(f.vx, f.vy);
          if (sp > MAX_SPEED) {
            f.vx = (f.vx / sp) * MAX_SPEED;
            f.vy = (f.vy / sp) * MAX_SPEED;
          }
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          if (f.size !== lastSize) {
            lastSize = f.size;
            ctx.font = `${f.size}px ${mono}`;
          }
          if (f.color !== lastColor) {
            lastColor = f.color;
            ctx.fillStyle = f.color;
          }
          ctx.globalAlpha = own < ALPHA_IN_MS ? own / ALPHA_IN_MS : 1;
          ctx.fillText(f.glyph, f.x, f.y);
        }
        ctx.globalAlpha = 1;

        // Los muelles siguen asentándose DURANTE el crossfade (reveal deja
        // el rAF vivo SWAP_MS más), así los fragmentos se disuelven en el
        // texto nítido sin congelarse a mitad de camino.
        if (elapsed >= STAGGER_MS + FLY_MS + SETTLE_MS) reveal(true);
      };
      raf = requestAnimationFrame(frame);
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(watchdog);
      window.clearTimeout(swapTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [reducedMotion, h1Ref]);

  return <canvas ref={canvasRef} className="nxr-hero-assemble-canvas" aria-hidden="true" />;
}
