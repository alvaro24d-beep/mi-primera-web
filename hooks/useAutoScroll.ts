"use client";

import { useEffect } from "react";

/**
 * AUTO-SCROLL DE UNA SECCIÓN PINEADA.
 *
 * El problema: una sección con `pin` + `scrub` solo cuenta su historia si el
 * visitante la empuja. Quien llega y se queda mirando no ve nada, y quien pasa
 * deprisa se la salta entera.
 *
 * NO convierte la animación a reproducción por tiempo. El pin y el scrub se
 * conservan intactos: lo que se automatiza es el SCROLL. La página avanza sola
 * a lo largo del recorrido del pin y la animación lo sigue como siempre, así
 * que se puede volver atrás y rebobinar igual que antes — que es justo lo que
 * se pierde al pasar una escena a reproducción por tiempo.
 *
 * Cómo se comporta:
 *  · Arranca cuando la sección lleva `desde` de su recorrido consumido, no al
 *    entrar. Deja que el titular salga primero por el gesto del propio
 *    visitante y recoge la escena a partir de ahí.
 *  · Un gesto del usuario lo PAUSA, y se reanuda tras 700 ms de quietud. No lo
 *    mata: mientras alguien mueve el scroll manda él y el asistente no le pelea
 *    el control; en cuanto suelta, la escena sigue sola.
 *  · Se apaga del todo, y ya no vuelve, al llegar al final del rango. Quien
 *    quiera salirse antes no tiene que luchar: sigue scrolleando y sale.
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
    let reanudar = 0;

    /**
     * Un gesto del usuario PAUSA el asistente y lo reanuda tras un momento de
     * quietud. No lo mata.
     *
     * La primera versión sí lo mataba, y era un error que lo dejaba inservible:
     * para llegar al punto de arranque hay que scrollear, ese scroll dispara
     * `wheel`, y el asistente se cancelaba para siempre ANTES de haber llegado
     * a arrancar. Nunca se veía funcionar.
     *
     * Con pausa-y-reanuda el reparto es el correcto: mientras el usuario mueve
     * el scroll manda él —el asistente no le pelea el control— y en cuanto
     * suelta, la escena sigue avanzando sola. Quien quiera salirse del todo no
     * tiene que luchar contra nada: sigue scrolleando y sale del rango, que es
     * donde el asistente se apaga solo y ya no vuelve.
     */
    const PAUSA_MS = 700;

    const pausar = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      corriendo = false;
      ultimo = 0;
      if (terminado) return;
      window.clearTimeout(reanudar);
      reanudar = window.setTimeout(vigilar, PAUSA_MS);
    };

    const acabar = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      corriendo = false;
      terminado = true;
      window.clearTimeout(reanudar);
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
        acabar();
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
    function vigilar() {
      if (terminado || corriendo) return;
      const { top, total } = rango();
      const p = (window.scrollY - top) / total;
      if (p >= desde && p < hasta) {
        corriendo = true;
        ultimo = 0;
        raf = requestAnimationFrame(paso);
      }
    }

    // OJO al reparto: los gestos (`wheel`, `touchstart`, `touchmove`,
    // `keydown`) PAUSAN, mientras que el evento `scroll` solo VIGILA. Es
    // deliberado y no se puede intercambiar: el propio asistente genera
    // `scroll` en cada frame, así que si ese evento pausara se pararía a sí
    // mismo en cuanto arrancase.
    window.addEventListener("scroll", vigilar, { passive: true });
    window.addEventListener("wheel", pausar, { passive: true });
    window.addEventListener("touchstart", pausar, { passive: true });
    window.addEventListener("touchmove", pausar, { passive: true });
    window.addEventListener("keydown", pausar);
    vigilar();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(reanudar);
      window.removeEventListener("scroll", vigilar);
      window.removeEventListener("wheel", pausar);
      window.removeEventListener("touchstart", pausar);
      window.removeEventListener("touchmove", pausar);
      window.removeEventListener("keydown", pausar);
    };
  }, [ref, desde, hasta, velocidad]);
}
