"use client";

import { useEffect, useRef } from "react";
import { RIPPLE } from "./scene/rippleParams";

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
// V17.70 cambió ese "cómo": las columnas desescalonadas dejaron paso a una
// PIEDRA EN EL AGUA. El círculo que abre descubre la página (máscara radial,
// ver globals.css) y el muro del fondo ondula de verdad —vídeo, cuadrícula y
// monitores— con un frente circular amortiguado que vive en el shader (uniform
// uRipT en SceneBackground.tsx).
//
// V17.72 la parte en DOS TIEMPOS, que es como se pidió: primero una pantalla
// de carga PLANA con el nombre —fondo liso, sin columnas ni scanlines, y un
// mínimo de exhibición para que se llegue a leer aunque la carga sea
// instantánea— y solo después cae la piedra. Antes la cortina se abría en el
// mismo instante en que el muro asentaba, así que en cargas calientes el nombre
// pasaba de largo sin verse.
//
// Los dos lados de la onda se enganchan al MISMO hito, `nxr:curtain-open`, así
// que impacto y apertura son un solo gesto y ninguno de los dos componentes
// necesita conocer al otro.
//
// Se mantiene lo que ya funcionaba: cubre desde el PRIMER PAINT (el div viene
// en el SSR y tapa por CSS, sin hueco pre-hidratación), espera al muro (señal
// real `nxr:wall-settled`) y un failsafe la levanta a los 8s si la red falla —
// el muro procedural de respaldo ya pinta y la web es usable.
//
// Al abrirse deja window.__nxrCurtainOpen y emite `nxr:curtain-open`.

// Tiempo mínimo que la pantalla de carga se deja ver antes de romperse, aunque
// el muro asiente antes. Sin esto, en carga caliente el nombre aparecía y
// desaparecía en el mismo frame.
const MIN_SHOW_MS = 900;
// Retirada del árbol de pintado. Cubre el revelado completo (3s de máscara) con
// margen: mientras siga montada, su capa a pantalla completa se recompone sobre
// un canvas que invalida a ~30fps.
const LIFT_MS = 3200;
const FAILSAFE_MS = 8000;

// ---- Chapoteo del CONTENIDO de la hero ----
// "Los textos se ondulan como si fuese un flan pero no siguen la animación de
// las ondas del fondo; tienen que seguir el efecto de ondas del centro hacia el
// exterior" (V17.72).
//
// La V17.71 usaba un filtro SVG (feTurbulence + feDisplacementMap) y el
// problema era de raíz, no de calibración: feTurbulence genera RUIDO, un campo
// aleatorio sin centro ni dirección. Puede licuar un texto —de ahí el flan—
// pero no sabe nada de dónde cayó la piedra, así que jamás iba a producir
// anillos que salieran del centro. Y no hay forma barata de alimentar el
// displacement con un mapa radial animado: habría que regenerar la imagen del
// mapa en cada frame.
//
// Así que se cambia de técnica. Los textos se parten en caracteres y cada uno
// se desplaza RADIALMENTE evaluando la misma fórmula que el shader (ver
// rippleParams, de donde salen los dos), con su propia distancia al centro de
// pantalla. Resultado: los glifos del centro se mueven primero y la ondulación
// se propaga hacia fuera, en fase con el muro. Además es más barato que el
// filtro — son transforms compuestos en GPU, sin recalcular ruido por frame.
const AMP_PX = 24;
// Los caracteres se parten solo en estos dos: los botones y el indicador de
// scroll se mueven como bloques (partir un <Link> obliga a tocar su interior, y
// aquí se restaura por innerHTML al terminar).
const SEL_CHARS = ".nxr-hero-h1, .nxr-hero-sub";
const SEL_BLOQUES = ".nxr-hero-actions, .nxr-hero-cue";

type Pieza = { el: HTMLElement; dx: number; dy: number; r: number };

// Envuelve cada carácter en un span sin tocar el markup que ya hubiera dentro
// (el <span> del degradado lima del h1 sigue siendo el padre de SUS letras).
// Las palabras van en su propio inline-block para que el salto de línea siga
// cayendo entre palabras y no entre letras.
function partirEnCaracteres(raiz: HTMLElement): HTMLElement[] {
  const chars: HTMLElement[] = [];
  const textos: Text[] = [];
  const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) textos.push(n as Text);

  for (const t of textos) {
    if (!t.data.trim()) continue;
    const frag = document.createDocumentFragment();
    for (const trozo of t.data.split(/(\s+)/)) {
      if (!trozo) continue;
      if (/^\s+$/.test(trozo)) {
        frag.appendChild(document.createTextNode(trozo));
        continue;
      }
      const palabra = document.createElement("span");
      palabra.style.display = "inline-block";
      palabra.style.whiteSpace = "pre";
      for (const c of Array.from(trozo)) {
        const s = document.createElement("span");
        s.textContent = c;
        s.style.display = "inline-block";
        s.style.willChange = "transform";
        palabra.appendChild(s);
        chars.push(s);
      }
      frag.appendChild(palabra);
    }
    t.parentNode?.replaceChild(frag, t);
  }
  return chars;
}

export default function LoadProgress() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let done = false;
    let raf = 0;
    const timers: number[] = [];
    const montado = performance.now();

    const chapotear = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Solo la home tiene hero con estos textos; en el resto de rutas esto no
      // encuentra nada y no hace nada, que es lo correcto.
      const fuentes = Array.from(document.querySelectorAll<HTMLElement>(SEL_CHARS));
      const bloques = Array.from(document.querySelectorAll<HTMLElement>(SEL_BLOQUES));
      if (!fuentes.length && !bloques.length) return;

      // Se guarda el HTML de partida para devolverlo tal cual: es más seguro
      // que intentar desenvolver span a span.
      const original = fuentes.map((el) => ({ el, html: el.innerHTML }));
      const piezas: Pieza[] = [];

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const H = window.innerHeight;

      const registrar = (el: HTMLElement) => {
        const b = el.getBoundingClientRect();
        if (!b.width && !b.height) return;
        // MISMA métrica que el shader: distancia al centro dividida por la
        // altura del viewport (ver rippleParams).
        const dx = (b.left + b.width / 2 - cx) / H;
        const dy = (b.top + b.height / 2 - cy) / H;
        piezas.push({ el, dx, dy, r: Math.hypot(dx, dy) });
      };

      for (const el of fuentes) partirEnCaracteres(el).forEach(registrar);
      bloques.forEach(registrar);
      if (!piezas.length) return;

      const limpiar = () => {
        for (const p of piezas) {
          p.el.style.transform = "";
          p.el.style.willChange = "";
        }
        // Devolver el markup original deshace de un golpe los inline-block de
        // los caracteres, que alteran mínimamente el kerning mientras duran.
        for (const o of original) o.el.innerHTML = o.html;
      };

      const t0 = performance.now();
      const tick = (ahora: number) => {
        const t = (ahora - t0) / 1000;
        if (t >= RIPPLE.DUR) {
          limpiar();
          return;
        }
        const decae = Math.exp(-t * RIPPLE.DECAY);
        const frente = t * RIPPLE.VEL;
        for (const p of piezas) {
          const dr = p.r - frente;
          const w = Math.sin(dr * RIPPLE.FREQ) * Math.exp(-dr * dr * RIPPLE.BELL) * decae;
          const k = (w * AMP_PX) / (p.r > 0.0001 ? p.r : 1);
          p.el.style.transform = `translate(${(p.dx * k).toFixed(2)}px, ${(p.dy * k).toFixed(2)}px)`;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      // Red de seguridad, no redundancia: si la pestaña pasa a segundo plano el
      // rAF se para en seco y el tick nunca alcanza su rama de salida, así que
      // los textos se quedarían desplazados para siempre (comprobado con el
      // filtro de V17.71). El timer corre igual con la pestaña oculta.
      timers.push(window.setTimeout(limpiar, RIPPLE.DUR * 1000 + 400));
    };

    const romper = () => {
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

    const open = () => {
      if (done) return;
      done = true;
      // La pantalla de carga se cobra su mínimo aunque el muro ya esté listo.
      const falta = MIN_SHOW_MS - (performance.now() - montado);
      if (falta > 0) timers.push(window.setTimeout(romper, falta));
      else romper();
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
    <div ref={rootRef} className="nxr-curtain" aria-hidden="true">
      <div className="nxr-curtain-logo">
        Nexora<span>.</span>
      </div>
    </div>
  );
}
