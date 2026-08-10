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
// Retirada del árbol de pintado. Cubre el revelado completo (3s de máscara) con
// margen: mientras siga montada, su capa a pantalla completa se recompone sobre
// un canvas que invalida a ~30fps.
const LIFT_MS = 3200;
const FAILSAFE_MS = 8000;

// ---- Chapoteo del CONTENIDO de la hero (V17.71) ----
// "Que las ondas afecten a todo, incluido el h1 y los textos". El muro es
// WebGL y ondula en su shader, pero el h1, el párrafo y los botones son DOM
// normal: ahí la única forma de deformar de verdad los glifos es un filtro
// SVG (feTurbulence + feDisplacementMap). Se le da vida animando SOLO el
// `scale` del displacement — la turbulencia se deja con parámetros fijos a
// propósito, porque tocar baseFrequency o seed obliga a regenerar el ruido en
// cada frame y eso sí es caro.
// El scale oscila y cambia de signo, así que el texto se estira y se comprime
// en direcciones alternas: se lee como ondulación y no como un temblor. La
// envolvente está amortiguada y arranca fuerte porque el texto vive en el
// CENTRO, que es justo donde cae la piedra.
const SPLASH_DUR = 2.6;
// Calibrado a ojo contra el h1 real: a 26px la deformación no se apreciaba
// (con la baseFrequency de abajo, ~85px de longitud de onda, el ruido apenas
// varía dentro de un glifo) y a 200 el texto se vuelve ilegible. 58 ondula de
// forma inequívoca y todavía se lee.
const SPLASH_MAX = 58;
const SPLASH_FREQ = 7.2; // rad/s: ~3 ondulaciones antes de apagarse
const SPLASH_DECAY = 1.15;

export default function LoadProgress() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let done = false;
    let raf = 0;
    const timers: number[] = [];

    // El licuado del contenido de la hero. Solo existe en la home: en el resto
    // de rutas no hay `.nxr-hero-center` y esto no hace nada, que es lo
    // correcto —- la piedra cae sobre la hero de la portada.
    const chapotear = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const destino = document.querySelector<HTMLElement>(".nxr-hero-center");
      const mapa = document.getElementById("nxr-splash-dm");
      if (!destino || !mapa) return;

      // Quitar el filtro al acabar no es cosmético: dejarlo puesto mantiene la
      // hero en su propia capa filtrada el resto de la sesión, y cada repintado
      // volvería a pasar por el displacement.
      const limpiar = () => {
        destino.style.filter = "";
        mapa.setAttribute("scale", "0");
      };

      destino.style.filter = "url(#nxr-splash)";
      const t0 = performance.now();
      const tick = (ahora: number) => {
        const t = (ahora - t0) / 1000;
        if (t >= SPLASH_DUR) {
          limpiar();
          return;
        }
        const env = Math.sin(t * SPLASH_FREQ) * Math.exp(-t * SPLASH_DECAY);
        mapa.setAttribute("scale", (SPLASH_MAX * env).toFixed(2));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      // Red de seguridad, no redundancia: si la pestaña pasa a segundo plano el
      // rAF se para en seco y el tick nunca alcanza su rama de salida, así que
      // el filtro se quedaría puesto para siempre (comprobado). El timer corre
      // igual con la pestaña oculta y deja la hero limpia pase lo que pase.
      timers.push(window.setTimeout(limpiar, SPLASH_DUR * 1000 + 400));
    };

    const open = () => {
      if (done) return;
      done = true;
      root.classList.add("nxr-curtain-open");
      if (!window.__nxrCurtainOpen) {
        window.__nxrCurtainOpen = true;
        window.dispatchEvent(new Event("nxr:curtain-open"));
      }
      chapotear();
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
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Definición del filtro. Va FUERA de la cortina a propósito: la cortina
          acaba en display:none y un <filter> dentro de un subárbol oculto deja
          de estar disponible para quien lo referencia. */}
      <svg className="nxr-splash-def" aria-hidden="true" focusable="false">
        <filter id="nxr-splash" x="-25%" y="-25%" width="150%" height="150%">
          {/* Frecuencia baja = ondas largas (~85px), que es lo que se lee como
              agua; subirla convierte el licuado en un rizado sucio sobre los
              glifos. Una sola octava a propósito: basta para la forma y evita
              el coste de las demás en un filtro que corre a 60fps. */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.011 0.017"
            numOctaves="1"
            seed="7"
            result="ruido"
          />
          {/* scale lo escribe el rAF de arriba; 0 = sin deformar. */}
          <feDisplacementMap
            id="nxr-splash-dm"
            in="SourceGraphic"
            in2="ruido"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

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
    </>
  );
}
