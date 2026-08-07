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
//  - SEGUIMIENTO EXACTO, sin lerp. Los cursores "premium" suelen ir con
//    retraso, pero este SUSTITUYE a la flecha del sistema (cursor: none), y un
//    disco que llega tarde vuelve impreciso hacer clic en el nav o en el
//    formulario. La personalidad la pone la inversión, no el arrastre.
//  - El `cursor: none` lo activa una CLASE QUE PONE ESTE EFECTO, no una regla
//    CSS suelta: si el bundle falla o el componente no llega a montar, el
//    visitante conserva su flecha nativa en vez de quedarse sin cursor.
//  - Solo `pointer: fine` (mismo criterio que CursorDrift): un teléfono no
//    tiene cursor que sustituir y se ahorra la capa de composición.
//  - Escritura coalescida con rAF — mousemove puede dispararse varias veces
//    por frame y solo la última posición importa.
export default function InvertCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const dot = dotRef.current;
    if (!dot) return;

    const root = document.documentElement;
    root.classList.add("nxr-cursor-on");

    let x = 0;
    let y = 0;
    let raf = 0;
    let shown = false;

    const write = () => {
      raf = 0;
      // translate3d primero (lleva el disco al punto) y el centrado después,
      // relativo a su propio tamaño. Solo transform: cero layout, capa propia.
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        // Escribe la posición ANTES de encender la opacidad: si no, el disco
        // aparecería un frame en la esquina (0,0) antes de saltar al ratón.
        write();
        dot.classList.add("nxr-cursor-visible");
        return;
      }
      if (!raf) raf = requestAnimationFrame(write);
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
