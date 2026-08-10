"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __nxrWallSettled?: boolean;
    __nxrCurtainOpen?: boolean;
  }
}

// ===== Cortina de entrada — piedra en el agua =====
// V17.47 dejó de ser una BARRA DE PROGRESO ("no tiene que ser una barra que
// esperas a que se complete; algo dinámico y visualmente estimulante, pero
// profesional"): la cortina no informa de nada, es una pantalla apagada que se
// RETIRA, y la gracia está en cómo se va.
//
// V17.70 cambia ese "cómo": las columnas desescalonadas dejan paso a una
// PIEDRA EN EL AGUA. Cae en el centro justo cuando la web está lista, el
// círculo que abre descubre la página (máscara radial, ver globals.css) y el
// muro del fondo ondula de verdad —vídeo, cuadrícula y monitores— con un
// frente circular amortiguado que vive en el shader (uniform uRipT en
// SceneBackground.tsx). Los dos lados se enganchan al MISMO hito,
// `nxr:curtain-open`, así que impacto y apertura son un solo gesto y ninguno
// de los dos componentes necesita conocer al otro.
//
// Las columnas se quedan, pero ya solo como TEXTURA: el tinte alterno y las
// scanlines son lo que hace que la cortina se lea como una pantalla apagada
// —el mismo lenguaje del muro— en vez de como un rectángulo negro. Ya no se
// mueven.
//
// Se mantiene lo que ya funcionaba: cubre desde el PRIMER PAINT (el div viene
// en el SSR y las columnas tapan por CSS, sin hueco pre-hidratación), se abre
// EN CUANTO el muro asienta (señal real `nxr:wall-settled`, en cargas
// calientes es una fracción de segundo) y un failsafe la levanta a los 8s si
// la red falla — el muro procedural de respaldo ya pinta y la web es usable.
//
// Al abrirse deja window.__nxrCurtainOpen y emite `nxr:curtain-open`.

// Columnas de textura. Sin orden de salida ya (no se van una a una), pero
// siguen siendo 10 para conservar el mismo grano de tinte/scanlines.
const COLS = 10;
// Retirada del árbol de pintado. Cubre el revelado completo (1.3s de máscara)
// con margen: mientras siga montada, su capa a pantalla completa se recompone
// sobre un canvas que invalida a ~30fps.
const LIFT_MS = 1500;
const FAILSAFE_MS = 8000;

export default function LoadProgress() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let done = false;
    const timers: number[] = [];

    const open = () => {
      if (done) return;
      done = true;
      root.classList.add("nxr-curtain-open");
      if (!window.__nxrCurtainOpen) {
        window.__nxrCurtainOpen = true;
        window.dispatchEvent(new Event("nxr:curtain-open"));
      }
      // Fuera del árbol de pintado en cuanto termina el revelado: sin esto, la
      // capa y su máscara radial seguirían componiéndose sobre un canvas que
      // invalida a ~30fps.
      timers.push(
        window.setTimeout(() => {
          root.style.display = "none";
        }, LIFT_MS)
      );
    };

    if (window.__nxrWallSettled) open();
    else window.addEventListener("nxr:wall-settled", open, { once: true });

    timers.push(window.setTimeout(open, FAILSAFE_MS));

    return () => {
      window.removeEventListener("nxr:wall-settled", open);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div ref={rootRef} className="nxr-curtain" aria-hidden="true">
      <div className="nxr-curtain-cols">
        {Array.from({ length: COLS }, (_, i) => (
          <div key={i} className="nxr-curtain-col" />
        ))}
      </div>
      <div className="nxr-curtain-logo">
        Nexora<span>.</span>
      </div>
    </div>
  );
}
