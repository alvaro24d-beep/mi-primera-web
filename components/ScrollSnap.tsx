"use client";

import { useEffect } from "react";

/**
 * Asentamiento del scroll entre secciones.
 *
 * El problema que resuelve: al soltar el scroll es fácil quedarse a medio
 * camino entre dos secciones, con media de cada una en pantalla.
 *
 * Lo hace por PROXIMIDAD y no como un scroll-snap de diapositiva, y esa
 * distinción es lo que permite que convivan las dos cosas. La mitad de las
 * secciones de esta web no son "una pantalla": el hero dura 3,6 pantallas de
 * pin, la Intro 2,4, el reel de Servicios más aún, y todas animan su contenido
 * con el scroll. Un snap obligatorio al inicio de cada sección se saltaría esos
 * recorridos enteros. Con proximidad, en mitad de un recorrido largo no hay
 * ningún límite cerca y aquí no pasa nada; solo actúa donde el problema existe
 * de verdad, que es al borde entre dos secciones.
 *
 * Y solo HACIA ADELANTE (V18.45): nunca devuelve el scroll a un límite que ya
 * has pasado. Ver la guarda en `asentar`.
 *
 * El deslizamiento se escribe con un bucle rAF propio a través de
 * `lenis.scrollTo(..., immediate)`, y no con las dos vías obvias, porque las dos
 * fallan con Lenis en medio (comprobado en su día para el snap del reel, ver el
 * comentario largo en Servicios.tsx): el `snap` nativo de ScrollTrigger escribe
 * scroll crudo que Lenis reemite y ScrollTrigger relee como "ha scrolleado el
 * usuario", matando su propio tween; y un `lenis.scrollTo()` con duración pierde
 * el tira y afloja contra el lerp interno de Lenis. Escribiendo la posición
 * absoluta cada frame, el estado interno de Lenis queda sincronizado por
 * construcción.
 */

// Tiempo sin movimiento para dar el scroll por detenido. Suficientemente corto
// para que el asentamiento se sienta inmediato y lo bastante largo para no
// dispararse entre dos golpes de rueda del mismo gesto.
const REPOSO_MS = 150;
// Solo se asienta si el límite de sección está a menos de esta fracción de
// pantalla. Es el número que decide que esto acompañe en vez de forzar: fuera
// de ese radio el scroll se queda exactamente donde lo dejó el usuario.
const PROXIMIDAD = 0.35;
const GLIDE_MS = 520;

export default function ScrollSnap() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer = 0;
    let raf = 0;
    let deslizando = false;

    const cancelar = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      deslizando = false;
    };

    const asentar = () => {
      const lenis = window.__nxrLenis;
      if (!lenis || deslizando) return;

      const y = window.scrollY;
      const vh = window.innerHeight;
      // Ni al principio ni al final del documento: ahí no hay "dos secciones
      // entre las que quedarse", y tirar del scroll contra el tope es
      // exactamente la clase de gesto forzado que hay que evitar.
      if (y < 2 || y + vh >= document.documentElement.scrollHeight - 2) return;

      // Los límites se recalculan en cada asentamiento y no se cachean: los
      // pin-spacer de ScrollTrigger cambian de alto al montarse y al
      // refrescarse, así que una lista guardada al cargar apuntaría a sitios
      // que ya no existen. Son ~8 elementos, una vez al parar el scroll.
      let destino = 0;
      let dist = Infinity;
      for (const s of document.querySelectorAll<HTMLElement>("section[id]")) {
        const top = s.getBoundingClientRect().top + y;
        const d = Math.abs(top - y);
        if (d < dist) {
          dist = d;
          destino = top;
        }
      }

      // Fuera del radio: no es un borde, es alguien leyendo a media sección.
      // Y por debajo de 3px ya está puesto — sin esta guarda, el propio glide
      // volvería a dispararse al terminar y no pararía nunca.
      if (dist > vh * PROXIMIDAD || dist < 3) return;

      // NUNCA HACIA ATRÁS (V18.45). Buscar el límite más cercano en valor
      // absoluto significaba que, nada más entrar en una sección, el borde de
      // arriba seguía siendo el más próximo y el asentamiento tiraba del
      // scroll de vuelta a él: "la cámara vuelve automáticamente a poner el
      // título de la sección arriba cuando ya estoy dentro". Deshacer avance
      // que el usuario acaba de hacer es lo más molesto que puede hacer un
      // asentamiento — se lee como que la página te lleva la contraria.
      //
      // Con esta guarda solo se completa el gesto hacia donde ya ibas: si el
      // límite más próximo queda por detrás, no se toca nada y el scroll se
      // queda exactamente donde lo dejaste. Lo que motivó este componente
      // —no quedarse a medio camino ENTRE dos secciones— se sigue cubriendo,
      // porque en ese caso el borde de la sección siguiente está por delante.
      if (destino < y) return;

      const desde = y;
      const delta = destino - desde;
      const t0 = performance.now();
      deslizando = true;

      const paso = () => {
        const t = Math.min(1, (performance.now() - t0) / GLIDE_MS);
        // Cúbica de salida: arranca decidido y llega frenando, que es como se
        // lee un asentamiento y no un tirón.
        const e = 1 - Math.pow(1 - t, 3);
        lenis.scrollTo(desde + delta * e, { immediate: true });
        if (t < 1) {
          raf = requestAnimationFrame(paso);
        } else {
          raf = 0;
          deslizando = false;
        }
      };
      raf = requestAnimationFrame(paso);
    };

    const programar = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(asentar, REPOSO_MS);
    };

    // El scroll del propio glide también dispara este evento; la guarda de
    // `deslizando` es la que evita que se reprograme a sí mismo.
    const onScroll = () => {
      if (!deslizando) programar();
    };

    // Cualquier intención del usuario CANCELA el deslizamiento en curso: si
    // sigue moviéndose, manda él. Después se vuelve a programar, de modo que el
    // asentamiento ocurre cuando de verdad ha parado.
    const onInput = () => {
      cancelar();
      programar();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onInput, { passive: true });
    window.addEventListener("touchstart", onInput, { passive: true });
    window.addEventListener("keydown", onInput);

    return () => {
      window.clearTimeout(timer);
      cancelar();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("touchstart", onInput);
      window.removeEventListener("keydown", onInput);
    };
  }, []);

  return null;
}
