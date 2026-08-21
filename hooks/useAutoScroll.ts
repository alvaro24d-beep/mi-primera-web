"use client";

import { useEffect } from "react";

/**
 * AUTO-SCROLL DE UNA SECCIÓN PINEADA.
 *
 * El problema: una sección con `pin` + `scrub` solo cuenta su historia si el
 * visitante la empuja. Quien llega y se queda mirando no ve nada, y quien pasa
 * deprisa se la salta entera.
 *
 * Esto NO convierte la animación a reproducción por tiempo —eso es lo que se
 * hizo en /agentes-ia y allí tiene sentido porque aquellas escenas no
 * necesitaban volver atrás—. Aquí se conserva el pin y el scrub intactos: lo
 * que se automatiza es el SCROLL. La página avanza sola a lo largo del
 * recorrido del pin y la animación la sigue como siempre, de modo que se puede
 * volver atrás y rebobinar exactamente igual que antes.
 *
 * Cómo se comporta:
 *  · Arranca cuando la sección lleva `desde` de su recorrido consumido, no al
 *    entrar. Sirve para dejar que el h1 salga primero por el gesto del propio
 *    visitante y que el automatismo recoja la escena a partir de ahí.
 *  · CUALQUIER intención del usuario lo cancela —rueda, dedo, tecla— y no se
 *    reanuda. Es un acompañamiento, no un secuestro: en cuanto alguien decide
 *    moverse por su cuenta, manda él.
 *  · Solo una vez por sesión y sección: reactivarlo al volver a subir haría
 *    imposible releer nada.
 *  · Escribe a través de Lenis con `immediate`, igual que ScrollSnap, porque
 *    las dos alternativas obvias fallan con Lenis en medio (ver el comentario
 *    largo de ScrollSnap.tsx).
 *  · Se desactiva con `prefers-reduced-motion`: mover el scroll solo es
 *    justamente lo que esa preferencia pide evitar.
 */
export function useAutoScroll(
  ref: React.RefObject<HTMLElement | null>,
  opciones?: {
    /** Fracción del recorrido ya consumida a la que arranca. */
    desde?: number;
    /** Fracción a la que se detiene. */
    hasta?: number;
    /** Píxeles de scroll por segundo. */
    velocidad?: number;
  }
) {
  const { desde = 0.12, hasta = 0.97, velocidad = 420 } = opciones ?? {};

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let corriendo = false;
    let terminado = false;
    let ultimo = 0;

    const parar = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      corriendo = false;
      // No se reanuda: a partir de aquí el recorrido es del usuario.
      terminado = true;
    };

    // El recorrido real de la sección se mide del pin-spacer que crea
    // ScrollTrigger, no de la sección: es el spacer el que ocupa el scroll
    // reservado, y su alto cambia en cada refresh (resize, carga de fuentes),
    // así que se relee en cada frame en vez de cachearse.
    const rango = () => {
      const spacer = el.querySelector<HTMLElement>(".pin-spacer") ?? el;
      const top = spacer.getBoundingClientRect().top + window.scrollY;
      const total = spacer.offsetHeight - window.innerHeight;
      return { top, total: Math.max(1, total) };
    };

    const paso = (t: number) => {
      if (!corriendo) return;
      const dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0;
      ultimo = t;

      const { top, total } = rango();
      const y = window.scrollY;
      const p = (y - top) / total;

      if (p >= hasta) {
        parar();
        return;
      }
      const lenis = window.__nxrLenis;
      const siguiente = y + velocidad * dt;
      if (lenis) lenis.scrollTo(siguiente, { immediate: true });
      else window.scrollTo(0, siguiente);
      raf = requestAnimationFrame(paso);
    };

    // Vigila el progreso para saber cuándo arrancar. Va en el evento de scroll
    // y no en un rAF permanente: mientras no se cumpla la condición esto no
    // debe costar nada.
    const vigilar = () => {
      if (terminado || corriendo) return;
      const { top, total } = rango();
      const p = (window.scrollY - top) / total;
      if (p >= desde && p < hasta) {
        corriendo = true;
        ultimo = 0;
        raf = requestAnimationFrame(paso);
      }
    };

    // Nota: `wheel`/`touchstart`/`keydown` cancelan, pero el evento `scroll`
    // NO — lo dispara el propio auto-scroll y se cancelaría a sí mismo.
    window.addEventListener("scroll", vigilar, { passive: true });
    window.addEventListener("wheel", parar, { passive: true });
    window.addEventListener("touchstart", parar, { passive: true });
    window.addEventListener("keydown", parar);
    vigilar();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", vigilar);
      window.removeEventListener("wheel", parar);
      window.removeEventListener("touchstart", parar);
      window.removeEventListener("keydown", parar);
    };
  }, [ref, desde, hasta, velocidad]);
}
