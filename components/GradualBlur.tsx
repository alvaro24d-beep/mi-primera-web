"use client";

import { memo, useMemo } from "react";

// Bandas de desenfoque progresivo pegadas al borde de la ventana, para que el
// contenido que pasa por debajo del header y del nav flotante se disuelva en
// vez de cortarse en seco. Dos instancias en app/layout.tsx (arriba y abajo).
//
// V17.76 — PODADO. Venía de React Bits con una API genérica de la que este
// sitio no usaba NADA: presets con nombre, alturas responsive por breakpoint
// (con su listener de resize y su debounce), aparición por IntersectionObserver,
// intensificado al pasar el ratón (con su estado de React), cuatro curvas de
// reparto, modo exponencial, y opacity/zIndex/width/className/style/duration/
// easing/onAnimationComplete configurables. Todo eso se ha ido: quedan las tres
// props que las dos instancias reales pasan. El componente ya no tiene estado
// ni efectos, así que tampoco vuelve a renderizar nunca.
//
// El reparto del desenfoque es el mismo de antes (curva lineal): la banda i
// difumina 0.0625·(i+1)·strength rem y se recorta con una máscara que la deja
// entrar y salir, de forma que las capas se solapan y el desenfoque crece por
// escalones hacia el borde.

export interface GradualBlurProps {
  position: "top" | "bottom";
  /** Alto de la banda (cualquier unidad CSS). */
  height: string;
  /** Multiplicador del desenfoque: el de la capa más externa es 0.0625·(divCount+1)·strength rem. */
  strength: number;
  /** Capas apiladas. Cada una es una capa de compositor con su propio
      backdrop-filter, así que el coste va con este número — ver el comentario
      de la llamada en app/layout.tsx. */
  divCount: number;
}

function GradualBlur({ position, height, strength, divCount }: GradualBlurProps) {
  const divs = useMemo(() => {
    const increment = 100 / divCount;
    const direction = position === "top" ? "to top" : "to bottom";
    const out: React.ReactNode[] = [];
    for (let i = 1; i <= divCount; i++) {
      const blur = 0.0625 * (i + 1) * strength;
      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;
      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;
      const mask = `linear-gradient(${direction}, ${gradient})`;
      out.push(
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            maskImage: mask,
            WebkitMaskImage: mask,
            backdropFilter: `blur(${blur.toFixed(3)}rem)`,
            WebkitBackdropFilter: `blur(${blur.toFixed(3)}rem)`,
          }}
        />
      );
    }
    return out;
  }, [position, strength, divCount]);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        [position]: 0,
        height,
        width: "100%",
        pointerEvents: "none",
        // Por encima del contenido, por debajo del header (9998) y del nav
        // flotante (9999).
        zIndex: 1100,
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>{divs}</div>
    </div>
  );
}

export default memo(GradualBlur);
