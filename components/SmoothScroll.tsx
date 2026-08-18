"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Components that need to animate the scroll position programmatically
// (e.g. Servicios' card snap) MUST go through this instance — a plain
// window.scrollTo fights Lenis' own rAF-driven positioning. Exposed on
// window because the consumers live in a different React tree.
declare global {
  interface Window {
    __nxrLenis?: Lenis;
  }
}

export default function SmoothScroll() {
  // Refresh de ScrollTrigger tras navegación CLIENTE (SPA). V16.54, bug: al
  // volver a la home desde otra página, la frase "todo lo que tu negocio
  // necesita" (y potencialmente otros textos scroll-driven) no reaparecía —
  // en una navegación SPA no hay evento `load`, así que los pins/starts se
  // quedaban con las posiciones calculadas antes de que el layout de la nueva
  // página se asentara, y el clamp de la frase la dejaba apagada fuera de su
  // rango real. Un refresh diferido (2 rAF, ya montados los efectos de la
  // página nueva) recalcula todas las posiciones. Seguro: tras navegar estás
  // en el top (scroll 0), así que solo recalcula secciones fuera de pantalla,
  // sin salto visible. Se salta el montaje inicial (ese ya lo cubre `load`).
  const pathname = usePathname();
  const firstMount = useRef(true);
  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [pathname]);

  useEffect(() => {
    // Mobile browsers (Chrome/Safari) show/hide their address bar as you scroll,
    // firing a `resize` that only changes viewport HEIGHT. By default that makes
    // ScrollTrigger.refresh() recompute every pin/end, which reflows the pinned
    // sections and visibly shoves the whole page up/down — exactly the "the bar
    // hides and leaves an empty gap that pushes the site up" glitch. Telling
    // ScrollTrigger to ignore that height-only mobile resize keeps the layout
    // rock-steady while the toolbar animates (pros do this on any pinned site).
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Base V16.17 (defaults de Lenis) + AJUSTE DE INERCIA (V18.30, petición:
    // "que tarde mucho más en pararse y que no sea tan sensible").
    //
    // Las dos cosas que se piden NO son la misma y las gobiernan parámetros
    // distintos, así que conviene no confundirlos al retocar esto:
    //   · CUÁNTO TARDA EN PARARSE  -> el lerp. Es la fracción de la distancia
    //     que queda pendiente que se recorre en cada frame, así que cuanto más
    //     bajo, más larga es la cola de frenado.
    //   · CUÁNTO LLEGA A AVANZAR   -> el exponente de inercia (táctil) y el
    //     multiplicador de rueda (escritorio). Son los que hacen que un gesto
    //     fuerte se coma media web.
    // Bajar solo el lerp habría alargado el frenado pero dejando los mismos
    // saltos largos; bajar solo el alcance habría cortado los saltos pero
    // parando igual de seco. Van juntos.
    //
    //   - syncTouchLerp 0.05 -> 0.03 (default 0.075): el deslizamiento táctil
    //     decelera bastante más despacio; es lo que se pidió como "que tarde
    //     mucho más en pararse".
    //   - touchInertiaExponent 1.9 -> 1.55 (default 1.7): AHORA POR DEBAJO del
    //     default. Estaba subido para que el flick avanzara más, que es
    //     justamente lo que hacía que las secciones se pasaran demasiado
    //     rápido.
    //   - lerp 0.07 (default 0.1) y wheelMultiplier 0.85: lo mismo para la
    //     rueda, porque lo pedido es el scroll "en general en la web", no solo
    //     el táctil.
    //
    // (autoRaf false y syncTouch true son ESTRUCTURALES — ver V16.17: el rAF
    // lo llevamos nosotros junto a ScrollTrigger.update, y sin syncTouch las
    // cards de cristal WebGL, posicionadas por frame desde rects DOM, irían un
    // frame por detrás del contenido en móvil.)
    // El reel de Servicios y ZP no dependen de esto: paginan por su cuenta en
    // touchend (glideTo con escrituras immediate que anulan la inercia de
    // Lenis) y su muro de primera llegada clampa cualquier flick fuerte.
    // NO se toca el cap de 1.35·vh de abajo: está co-afinado con el prólogo del
    // reel y bajarlo rompió su entrada dos veces en teléfono real. El alcance
    // se reduce por el exponente, que no arrastra esa dependencia.
    // Afinado anterior por si se revierte: syncTouchLerp 0.05,
    // touchInertiaExponent 1.9, sin lerp ni wheelMultiplier propios.
    const lenis = new Lenis({
      autoRaf: false,
      syncTouch: true,
      lerp: 0.07,
      wheelMultiplier: 0.85,
      syncTouchLerp: 0.03,
      touchInertiaExponent: 1.55,
    });
    window.__nxrLenis = lenis;

    // TOPE DE VELOCIDAD/ALCANCE POR GESTO en móvil (V16.53, petición: "que no
    // se pueda desplazar muy rápido por las páginas"). Con exponent 1.9 la
    // curva de inercia se dispara en flicks fuertes (|v|^1.9), así que un solo
    // deslizamiento podía volar varias secciones. Lenis no tiene tope propio:
    // en touchend, tras un rAF (su listener de inercia corre primero, se
    // registra al crear la instancia), se clampa cuánto puede quedar el
    // objetivo por delante de la posición actual. Al capar el hueco máximo se
    // capa también la velocidad pico del planeo (v_pico ≈ hueco·lerp), que es
    // exactamente el "tope de velocidad" pedido. El scrollTo usa el mismo
    // syncTouchLerp (0.05) para que la cola de frenado mantenga el tacto largo
    // de V16.52. Reintroduce el capFlickReach que existía antes de V16.17;
    // 1.35 pantallas está co-afinado con el prólogo del reel de Servicios (ver
    // memoria reel-geometria-validada) — la paginación del reel es inmune (sus
    // escrituras immediate por frame sobrescriben cualquier objetivo).
    const capFlickReach = () => {
      requestAnimationFrame(() => {
        const ahead = lenis.targetScroll - lenis.animatedScroll;
        const cap = window.innerHeight * 1.35;
        if (Math.abs(ahead) > cap) {
          lenis.scrollTo(lenis.animatedScroll + Math.sign(ahead) * cap, { lerp: 0.05 });
        }
      });
    };
    window.addEventListener("touchend", capFlickReach, { passive: true });

    // Any ScrollTrigger created anywhere in the app (this is the only place
    // that should own a Lenis instance) needs to recompute on Lenis' own
    // scroll event, since Lenis drives scroll via rAF rather than firing
    // native `scroll` events at the same cadence ScrollTrigger expects.
    lenis.on("scroll", ScrollTrigger.update);

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("touchend", capFlickReach);
      delete window.__nxrLenis;
      lenis.destroy();
    };
  }, []);

  return null;
}
