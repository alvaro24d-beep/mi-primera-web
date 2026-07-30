"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __nxrWallSettled?: boolean;
  }
}

// ===== Barra de carga (progreso REAL de la carga inicial) =====
// Petición: "el fondo tarda un poco en cargarse". Decisión de proyecto
// vigente (guía award-sites, 2026-07-07): nada de preloaders con delay
// artificial — un loader solo entra si no penaliza LCP/CWV. Esta barra es
// un hilo de 2px fijo arriba que NUNCA bloquea ni retrasa contenido:
// refleja hitos reales y se desvanece cuando el último se cumple (el muro
// de vídeo pintando de verdad — señal `nxr:wall-settled` que emite
// SceneBackground al primer frame, o a su fallback definitivo si el vídeo
// falla). Solo aparece en la carga completa de página (el layout persiste
// en navegación cliente, así que no re-dispara por ruta), y solo si la
// carga tarda >250ms — en cargas calientes ni parpadea.
//
// Hitos (acumulados):
//   0.15 montaje (bundle ejecutado + React hidratado)
//   0.30 fuentes listas (document.fonts.ready)
//   0.50 window load (estáticos del documento)
//   0.70 canvas WebGL montado (.nxr-scene-arrive en el DOM — montaje en idle)
//   1.00 muro asentado (nxr:wall-settled)
// Entre hitos, goteo asintótico estilo nprogress: acerca la barra a un
// techo POR DEBAJO del hito siguiente (suaviza la percepción, nunca miente
// llegando a donde la carga real no llegó). Failsafe 12s: con una red rota
// el muro tiene su propio fallback procedural y la web es usable — la
// barra se cierra en vez de quedarse eternamente a medias.
const M_MOUNT = 0.15;
const M_FONTS = 0.3;
const M_LOAD = 0.5;
const M_CANVAS = 0.7;
const TRICKLE_HEAD = 0.09; // techo de goteo por encima del último hito real
const TICK_MS = 140;
const SHOW_AFTER_MS = 250;
const FAILSAFE_MS = 12000;

export default function LoadProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let target = M_MOUNT;
    let shown = 0; // progreso pintado (persigue al target con easing)
    let done = false;
    let interval = 0;
    const timers: number[] = [];
    const bump = (v: number) => {
      if (!done) target = Math.max(target, v);
    };

    const cleanup = () => {
      window.clearInterval(interval);
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("nxr:wall-settled", complete);
      window.removeEventListener("load", onLoad);
    };

    const complete = () => {
      if (done) return;
      done = true;
      shown = 1;
      // El salto hasta 1 lo suaviza la transition de transform del CSS; el
      // interval deja de escribir en cuanto `done` es true (ver abajo) para
      // no pisar este valor final.
      bar.style.transform = "scaleX(1)";
      // Llena, respira un instante, se desvanece, y deja de existir para
      // el compositor (display none) — coste residual cero.
      timers.push(
        window.setTimeout(() => bar.classList.add("nxr-loadbar-done"), 420),
        window.setTimeout(() => {
          bar.style.display = "none";
          window.clearInterval(interval);
        }, 950)
      );
    };

    const onLoad = () => bump(M_LOAD);
    if (document.readyState === "complete") bump(M_LOAD);
    else window.addEventListener("load", onLoad, { once: true });

    document.fonts?.ready.then(() => bump(M_FONTS)).catch(() => {});

    if (window.__nxrWallSettled) complete();
    else window.addEventListener("nxr:wall-settled", complete, { once: true });

    timers.push(
      // Solo se muestra si a los 250ms sigue incompleta (cargas calientes
      // completan antes y la barra ni parpadea).
      window.setTimeout(() => {
        if (!done) bar.classList.add("nxr-loadbar-show");
      }, SHOW_AFTER_MS),
      window.setTimeout(complete, FAILSAFE_MS)
    );

    interval = window.setInterval(() => {
      if (done) return;
      // El canvas monta en idle (SceneCanvasLazy) — sondearlo aquí evita
      // instrumentar SceneCanvas; el tick ya existe para el goteo.
      if (target < M_CANVAS && document.querySelector(".nxr-scene-arrive")) bump(M_CANVAS);
      const cap = Math.min(target + TRICKLE_HEAD, 0.97);
      shown += (cap - shown) * 0.09;
      bar.style.transform = `scaleX(${shown.toFixed(4)})`;
    }, TICK_MS);

    return cleanup;
  }, []);

  return <div ref={barRef} className="nxr-loadbar" aria-hidden="true" />;
}
