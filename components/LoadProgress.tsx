"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __nxrWallSettled?: boolean;
    __nxrCurtainOpen?: boolean;
  }
}

// ===== Cortina de entrada =====
// V17.47 — deja de ser una BARRA DE PROGRESO ("no tiene que ser una barra que
// esperas a que se complete; algo dinámico y visualmente estimulante, pero
// profesional"). Ahora la cortina no informa de nada: es una pantalla apagada
// que se RETIRA, y la gracia está en cómo se va.
//
// El lenguaje es el del propio sitio, no un efecto genérico: el muro de fondo
// se enciende monitor a monitor en cascada aleatoria (ver uPower/tileOn en
// SceneBackground.tsx), así que la cortina se despide igual — en columnas que
// suben desescalonadas, con la textura de scanlines y el tinte por columna que
// ya identifican a esa pantalla. Mientras espera, una línea de escaneo la
// recorre en bucle: hay movimiento continuo desde el primer frame, sin
// prometer un porcentaje que no controlamos.
//
// Se mantiene lo que ya funcionaba: cubre desde el PRIMER PAINT (el div viene
// en el SSR y las columnas tapan por CSS, sin hueco pre-hidratación), se abre
// EN CUANTO el muro asienta (señal real `nxr:wall-settled`, en cargas
// calientes es una fracción de segundo) y un failsafe la levanta a los 8s si
// la red falla — el muro procedural de respaldo ya pinta y la web es usable.
//
// Al abrirse deja window.__nxrCurtainOpen y emite `nxr:curtain-open`.

// Orden de salida de las columnas: barajado A MANO y fijo. Ni Math.random (el
// SSR y el cliente pintarían órdenes distintos) ni secuencial (un barrido de
// izquierda a derecha se lee como una persiana, no como el encendido por
// paneles del muro).
const COL_ORDER = [3, 0, 6, 2, 8, 1, 7, 4, 9, 5];
const COL_STAGGER_MS = 38;
// Cascada completa: 9·38 + 520 de la propia transición, con margen.
const LIFT_MS = 1000;
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
      // Fuera del árbol de pintado en cuanto termina la cascada: sin esto, sus
      // 10 columnas y la línea de escaneo seguirían componiéndose sobre un
      // canvas que invalida a ~30fps.
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
        {COL_ORDER.map((orden, i) => (
          <div
            key={i}
            className="nxr-curtain-col"
            style={{ transitionDelay: `${orden * COL_STAGGER_MS}ms` }}
          />
        ))}
      </div>
      <div className="nxr-curtain-scan" />
      <div className="nxr-curtain-logo">
        Nexora<span>.</span>
      </div>
    </div>
  );
}
