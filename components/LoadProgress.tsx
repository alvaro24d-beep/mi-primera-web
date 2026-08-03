"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __nxrWallSettled?: boolean;
    __nxrCurtainOpen?: boolean;
  }
}

// ===== Cortina de carga (el fondo sale YA cargado desde el primer frame) =====
// Petición: "quiero que el fondo salga ya cargado desde el principio" — la
// V16.71 (hilo fino informativo arriba) no bastaba: el fondo negro seguía a
// la vista hasta que llegaba el muro. Esta cortina cubre la página DESDE EL
// PRIMER PAINT (div en el SSR + CSS visible por defecto, así tampoco hay
// hueco pre-hidratación) con la marca y una barra de progreso centradas, y
// se levanta cuando el muro de vídeo ya está pintando (señal real
// nxr:wall-settled de SceneBackground) — debajo aparece la página con el
// fondo en marcha, nunca el vacío negro.
//
// Sigue SIN ser el "preloader teatral" que descartamos con la guía de
// award-sites: no retrasa nada artificialmente — se abre EN CUANTO el muro
// asienta (en cargas calientes dura una fracción de segundo), el progreso
// son hitos reales con goteo nprogress entre ellos (nunca por encima de la
// carga real), y un failsafe la abre a los 8s (red rota → el muro
// procedural de respaldo ya está pintando y la web es usable). El coste
// asumido y pedido: el primer contenido pintado es la cortina, no el hero.
//
// Al abrirse deja window.__nxrCurtainOpen y emite `nxr:curtain-open`, por
// si algo necesita arrancar justo cuando la página se descubre (lo usaba la
// formación del h1, eliminada en V17.10; hoy no tiene consumidores).
//
// Hitos (acumulados):
//   0.15 montaje (bundle ejecutado + React hidratado)
//   0.30 fuentes listas (document.fonts.ready)
//   0.50 window load (estáticos del documento)
//   0.70 canvas WebGL montado (.nxr-scene-arrive en el DOM — montaje en idle)
//   1.00 muro asentado (nxr:wall-settled)
const M_MOUNT = 0.15;
const M_FONTS = 0.3;
const M_LOAD = 0.5;
const M_CANVAS = 0.7;
const TRICKLE_HEAD = 0.09; // techo de goteo por encima del último hito real
const TICK_MS = 140;
const FILL_MS = 240; // respiro con la barra llena antes de levantar la cortina
const LIFT_MS = 700; // duración del fade de la cortina (= CSS .55s + margen)
const FAILSAFE_MS = 8000;

export default function LoadProgress() {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const bar = barRef.current;
    if (!root || !bar) return;

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

    const open = () => {
      root.classList.add("nxr-curtain-open");
      if (!window.__nxrCurtainOpen) {
        window.__nxrCurtainOpen = true;
        window.dispatchEvent(new Event("nxr:curtain-open"));
      }
      timers.push(
        window.setTimeout(() => {
          root.style.display = "none";
          window.clearInterval(interval);
        }, LIFT_MS)
      );
    };

    const complete = () => {
      if (done) return;
      done = true;
      shown = 1;
      // El salto hasta 1 lo suaviza la transition de transform del CSS; el
      // interval deja de escribir en cuanto `done` es true (ver abajo) para
      // no pisar este valor final.
      bar.style.transform = "scaleX(1)";
      timers.push(window.setTimeout(open, FILL_MS));
    };

    const onLoad = () => bump(M_LOAD);
    if (document.readyState === "complete") bump(M_LOAD);
    else window.addEventListener("load", onLoad, { once: true });

    document.fonts?.ready.then(() => bump(M_FONTS)).catch(() => {});

    if (window.__nxrWallSettled) complete();
    else window.addEventListener("nxr:wall-settled", complete, { once: true });

    timers.push(window.setTimeout(complete, FAILSAFE_MS));

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

  return (
    <div ref={rootRef} className="nxr-curtain" aria-hidden="true">
      <div className="nxr-curtain-logo">
        Nexora<span>.</span>
      </div>
      <div className="nxr-curtain-track">
        <div ref={barRef} className="nxr-curtain-bar" />
      </div>
    </div>
  );
}
