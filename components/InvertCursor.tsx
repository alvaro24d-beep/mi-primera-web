"use client";

import { useEffect, useRef } from "react";

// Cursor circular que INVIERTE lo que tiene debajo (petición: "un círculo del
// color contrario de sobre donde está"). El patrón es el estándar del sector
// —confirmado en los catálogos: 21st.dev "Inverted Cursor" ×2— y consiste en
// un disco BLANCO con `mix-blend-mode: difference`: difference contra blanco
// da el negativo exacto del fondo (blanco→negro, negro→blanco, y cualquier
// color a su complementario). Todo el efecto vive en el compositor; aquí solo
// se escribe un transform.
//
// Decisiones propias de este proyecto:
//  - SEGUIMIENTO AMORTIGUADO (V17.40). La primera versión clavaba el disco en
//    la posición exacta del ratón, y se leía "un poco lageado": un cursor DOM
//    se repinta al ritmo de FRAMES DE LA PÁGINA, no al del ratón como hace el
//    del sistema, así que en los tramos donde el muro WebGL baja de 60fps el
//    salto entre posiciones se ve a tirones. Interpolar hacia el objetivo
//    convierte esos saltos discretos en movimiento continuo: se percibe MÁS
//    fluido justamente por no ir exacto. EASE alto (0.28) a propósito — el
//    disco sustituye a la flecha del sistema, así que el retraso tiene que
//    quedarse en "suavizado" y nunca estorbar al hacer clic.
//  - El bucle SE DETIENE al converger (mismo patrón que CursorDrift): en
//    reposo no hay rAF vivo, coste cero.
//  - El `cursor: none` lo activa una CLASE QUE PONE ESTE EFECTO, no una regla
//    CSS suelta: si el bundle falla o el componente no llega a montar, el
//    visitante conserva su flecha nativa en vez de quedarse sin cursor.
//  - Solo `pointer: fine` (mismo criterio que CursorDrift): un teléfono no
//    tiene cursor que sustituir y se ahorra la capa de composición.

// Factor de persecución por frame. 0.28 ≈ el 95% del recorrido en ~9 frames
// (~150ms): se nota la estela, no el retardo.
const EASE = 0.28;
export default function InvertCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const dot = dotRef.current;
    if (!dot) return;

    const root = document.documentElement;
    root.classList.add("nxr-cursor-on");

    // tx/ty = dónde está el ratón de verdad; cx/cy = dónde está pintado el
    // disco, persiguiendo al primero.
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    let running = false;
    let shown = false;

    const write = () => {
      // translate3d primero (lleva el disco al punto) y el centrado después,
      // relativo a su propio tamaño. Solo transform: cero layout, capa propia.
      dot.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0) translate(-50%, -50%)`;
    };

    const tick = () => {
      cx += (tx - cx) * EASE;
      cy += (ty - cy) * EASE;
      // Umbral de medio píxel: por debajo de eso el movimiento ya no es
      // visible y seguir iterando solo mantendría vivo un rAF para nada.
      if (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) {
        write();
        raf = requestAnimationFrame(tick);
        return;
      }
      // Asienta EXACTO en el objetivo antes de parar: si no, el disco queda
      // permanentemente medio píxel corrido respecto al puntero real.
      cx = tx;
      cy = ty;
      write();
      running = false;
      raf = 0;
    };

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        // Primera aparición (y cada regreso a la ventana): SIN glide — si no,
        // el disco se vería volando desde la esquina (0,0) o desde el punto
        // por donde salió el ratón.
        cx = tx;
        cy = ty;
        write();
        dot.classList.add("nxr-cursor-visible");
        return;
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    // Salir de la ventana (o pasar a otra pestaña/monitor) apaga el disco: sin
    // esto se quedaba clavado en el último punto, leyéndose como una mancha.
    const onLeave = () => {
      shown = false;
      dot.classList.remove("nxr-cursor-visible");
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      root.classList.remove("nxr-cursor-on");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={dotRef} className="nxr-cursor" aria-hidden="true" />;
}
