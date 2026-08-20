"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useZoomParallaxCardsRegistry } from "@/store/useZoomParallaxCardsRegistry";

type T = (clave: string) => string;
// `content` es una FUNCION y no JSX fijo: este array vive a nivel de modulo,
// donde no se puede llamar a useTranslations, asi que recibe el traductor
// desde el componente en cada render.
const CARDS: { scale: number; mobileScale?: number; content: (t: T) => React.ReactNode }[] = [
  {
    scale: 3.5,
    // On mobile this card needs a wider resting box (see globals.css) to fit
    // its bigger text without wrapping too much — a lower zoom-in intensity
    // than desktop achieves that while still filling most of the screen at
    // the start of the scroll.
    mobileScale: 2.2,
    // V16.23: texto propio ("cambia el texto para no confundirlo") — el
    // "Construido con maestría / Entregado con precisión" es la frase del
    // HERO y estaba duplicada aquí. Esta habla de las stats que hacen zoom
    // alrededor (+40 proyectos, 98%, 3x ROI).
    content: (t: T) => (
      <div className="nxr-zp-card" style={{ gap: "calc(4px * var(--zp-max, 1))" }}>
        <div className="nxr-zp-hero-text">
          {t("heroA")}
          <br />
          <span className="nxr-gradient-text-lime">{t("heroB")}</span>
        </div>
      </div>
    ),
  },
  {
    scale: 5,
    content: (t: T) => (
      <div className="nxr-zp-card">
        <div className="nxr-zp-card-num" style={{ color: "var(--c-lime)" }}>
          +40
        </div>
        <div className="nxr-zp-card-title">{t("t1")}</div>
        <div className="nxr-zp-card-desc">{t("d1")}</div>
      </div>
    ),
  },
  {
    scale: 6,
    content: (t: T) => (
      <div className="nxr-zp-card">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF3D0D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        <div className="nxr-zp-card-title">{t("t2")}</div>
        <div className="nxr-zp-card-desc">{t("d2")}</div>
      </div>
    ),
  },
  {
    scale: 8,
    content: (t: T) => (
      <div className="nxr-zp-card">
        <div className="nxr-zp-card-num" style={{ color: "var(--c-salmon)" }}>
          98%
        </div>
        <div className="nxr-zp-card-title">{t("t3")}</div>
      </div>
    ),
  },
  {
    scale: 9,
    content: (t: T) => (
      <div className="nxr-zp-card">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A8F04A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3L3 8.5v7L12 21l9-5.5v-7L12 3z" />
          <path d="M12 12l9-3.5M12 12L3 8.5M12 12v9" />
        </svg>
        <div className="nxr-zp-card-title">{t("t4")}</div>
        <div className="nxr-zp-card-desc">{t("d4")}</div>
      </div>
    ),
  },
  {
    scale: 8,
    // V16.87 móvil ("las cards inferiores se cargan de golpe a mitad de la
    // transición"): con la escala de desktop, su rect no tocaba el viewport
    // hasta ~40% del zoom y la curva ease-out móvil comprimía la entrada en
    // un suspiro de scroll real. Escala móvil menor = posición de SALIDA
    // más cercana (asoma desde el inicio de la sección); la posición y
    // tamaño FINALES no cambian — la caja CSS móvil se redujo en la misma
    // proporción (ver nth-child(6) en globals.css).
    mobileScale: 3.5,
    content: (t: T) => (
      <div className="nxr-zp-card">
        <div className="nxr-zp-card-num" style={{ color: "var(--c-lime)" }}>
          3x
        </div>
        <div className="nxr-zp-card-title">{t("t5")}</div>
        <div className="nxr-zp-card-desc">{t("d5")}</div>
      </div>
    ),
  },
  {
    scale: 9,
    // V16.87 móvil: ídem — ver nth-child(7) en globals.css.
    mobileScale: 4.5,
    content: (t: T) => (
      <div className="nxr-zp-card">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF9D7D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M16.5 16.5L21 21" />
        </svg>
        <div className="nxr-zp-card-title">{t("t6")}</div>
        <div className="nxr-zp-card-desc">{t("d6")}</div>
      </div>
    ),
  },
];

export default function ZoomParallax() {
  const t = useTranslations("zp");
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Registers each card's `.nxr-zp-img` (the element the scroll effect
  // `transform: scale()`s) with the global SceneCanvas so a real volumetric
  // glass mesh renders behind it — same anchor-bridge pattern as Servicios.
  // The mesh reads this element's live rect every frame to position+scale
  // itself; the DOM element itself carries no glass, only the card content.
  useEffect(() => {
    const reg = useZoomParallaxCardsRegistry.getState();
    imgRefs.current.forEach((el, i) => reg.setAnchor(i, el));
    return () => reg.clearAll();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    const layers = layerRefs.current.filter(Boolean) as HTMLDivElement[];
    const rmMql = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Centre-card glitch actors, collected once: the intact base content and
    // the 5 slice clones (see the JSX below).
    const heroImg = imgRefs.current[0];
    const heroBase = heroImg?.querySelector<HTMLElement>(":scope > .nxr-zp-card") ?? null;
    const heroSlices = heroImg ? Array.from(heroImg.querySelectorAll<HTMLElement>(".nxr-zp-glslice")) : [];

    // Deterministic pseudo-random (shader-style hash): the glitch pattern is
    // a pure function of scroll progress, so scrubbing back through the
    // dissolve replays the exact same frames in reverse — no RAF loops, no
    // state, nothing to desync from the scrub.
    const frac = (n: number) => n - Math.floor(n);
    const hash = (n: number) => frac(Math.sin(n * 127.1) * 43758.5453);

    // ===== Entrada del texto central (V18.37: fundido con desenfoque, en su
    // posición; antes era un tecleo carácter a carácter que además empezaba
    // con la sección aún subiendo). El texto se sigue troceando UNA vez en
    // spans por carácter —los espacios quedan como nodos de texto para no
    // alterar el word-wrap móvil— pero YA NO es para revelarlo: los spans
    // existen porque el glitch de salida corrompe letras sueltas. La entrada
    // es temporal (no scrub) y se rebobina si vuelves a subir; la SALIDA
    // (encogimiento + glitch móvil) no se toca. Reduced motion: no se trocea
    // nada y el texto queda plano y visible.
    const heroText = heroBase?.querySelector<HTMLElement>(".nxr-zp-hero-text") ?? null;
    const twChars: HTMLElement[] = [];
    const sliceCharLists: HTMLElement[][] = [];
    const splitChars = (root: HTMLElement, out: HTMLElement[]) => {
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent ?? "";
          if (!text.trim()) return;
          const fragment = document.createDocumentFragment();
          for (const ch of text) {
            if (ch === " ") {
              fragment.appendChild(document.createTextNode(" "));
            } else {
              const s = document.createElement("span");
              // Clase NEUTRA, sin estilo: solo marca el carácter para que el
              // glitch de salida pueda corromper letras sueltas. Deliberadamente
              // NO es `nxr-zp-tw`, que lleva `visibility: hidden` y la
              // conmutan por carácter el hero de la home y el de /seo — aquí
              // el texto entra con un fundido del contenedor, así que nadie le
              // quitaría nunca ese hidden y no se vería jamás.
              s.className = "nxr-zp-char";
              s.textContent = ch;
              fragment.appendChild(s);
              out.push(s);
            }
          }
          (node as ChildNode).replaceWith(fragment);
        } else if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName !== "BR") {
          Array.from(node.childNodes).forEach(walk);
        }
      };
      Array.from(root.childNodes).forEach(walk);
    };
    if (heroText && !rmMql.matches) {
      splitChars(heroText, twChars);
      // Estado inicial: oculto y desenfocado, listo para el fundido. Se pone
      // desde JS y no en el CSS para que la rama de movimiento reducido —que
      // no llega aquí— muestre el texto plano sin depender de que alguien le
      // quite la clase.
      heroText.classList.add("nxr-zp-oculto");
      // Los clones de los slices se trocean también para que el glitch
      // pueda corromper caracteres de forma coherente con la base. Solo
      // asoman dentro de la banda de glitch, mucho después de la entrada.
      heroSlices.forEach((sl) => {
        const st = sl.querySelector<HTMLElement>(".nxr-zp-hero-text");
        const list: HTMLElement[] = [];
        if (st) splitChars(st, list);
        sliceCharLists.push(list);
      });
    }
    let twStarted = false;
    let twInit = false;
    // ENTRADA DEL TEXTO CENTRAL (V18.37). Antes se tecleaba carácter a
    // carácter y, además, empezaba a escribirse ANTES de que la sección
    // llegara a su tope: se veía subir mientras se escribía ("sale desde
    // abajo"). Ahora aparece quieto en su posición final, con un fundido y
    // desenfoque.
    //
    // El efecto va en el CONTENEDOR, no en los ~30 spans: un solo elemento
    // que animar en vez de treinta capas de compositing con `filter` propio,
    // que en móvil no sale gratis. Los spans por carácter siguen existiendo
    // porque el glitch de salida los necesita para corromper letras sueltas;
    // simplemente ya no se usan para revelar.
    const mostrarTexto = (instantaneo = false) => {
      if (!heroText) return;
      if (instantaneo) heroText.style.transition = "none";
      heroText.classList.remove("nxr-zp-oculto");
      if (instantaneo) {
        void heroText.offsetWidth; // fuerza el reflow antes de devolver la transición
        heroText.style.transition = "";
      }
    };
    const ocultarTexto = () => {
      if (!heroText) return;
      heroText.style.transition = "none";
      heroText.classList.add("nxr-zp-oculto");
      void heroText.offsetWidth;
      heroText.style.transition = "";
    };

    // Deshace TODO lo que escribe el glitch de la card central: los clones de
    // banda, la base y los caracteres corrompidos. Extraído porque ahora hace
    // falta desde dos sitios — al salir de la banda de glitch (uso de
    // siempre) y al pasar a desktop, donde el bloque del glitch deja de
    // ejecutarse por completo (ver la rama `else if` en onScroll).
    const clearHeroGlitch = (img: HTMLElement) => {
      if (!img.classList.contains("nxr-zp-glitching")) return;
      img.classList.remove("nxr-zp-glitching");
      if (heroBase) heroBase.style.opacity = "";
      for (const sl of heroSlices) {
        sl.style.opacity = "";
        sl.style.transform = "";
        sl.style.clipPath = "";
      }
      // Restaura cualquier carácter corrompido por el glitch.
      for (const list of [twChars, ...sliceCharLists]) {
        for (const c of list) {
          if (c.dataset.o !== undefined) {
            c.textContent = c.dataset.o;
            delete c.dataset.o;
          }
        }
      }
    };

    // Sticky del reel de Servicios (fade de handoff, ver onScroll):
    // undefined = aún no buscado; null = no existe en esta página.
    let reelSticky: HTMLElement | null | undefined;
    let lastReelFade = "__";

    // Puerta de proximidad (V17.76): igual que en Proceso. Este handler está
    // enganchado al scroll global y arrancaba con un getBoundingClientRect de
    // la sección + hasta 7 rects de las cards en CADA frame de scroll de la
    // página entera, también estando a cuatro pantallas de distancia. El
    // margen de una pantalla completa cubre de sobra el handoff del reel
    // (empieza con rect.top ≈ 0.95·vh) y el disparo del typewriter.
    let cerca = false;
    let ioNear: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      ioNear = new IntersectionObserver(
        ([entry]) => {
          cerca = entry.isIntersecting;
          if (cerca) onScroll();
        },
        { rootMargin: `${Math.round(window.innerHeight)}px 0px` }
      );
      ioNear.observe(section);
    } else {
      cerca = true;
    }

    function onScroll() {
      if (!cerca) return;
      const vh = window.innerHeight;
      const isMobile = window.innerWidth <= 768;

      const rect = section!.getBoundingClientRect();
      const total = section!.offsetHeight - vh;
      const scrolled = -rect.top;

      // ===== POR QUÉ EL STICKY YA NO LLEVA CURVA DE ACOPLAMIENTO (V18.37) =====
      //
      // Hubo tres intentos de suavizar el momento en que el sticky se pega y
      // se suelta —V18.27 una parábola, V18.28 un smooth max cuadrático,
      // V18.33 arreglando el alto inestable de la toolbar y el ciclo de
      // crear/destruir capa— y ninguno aguantó. El motivo es de raíz, no de
      // afinado, así que queda escrito para que no haya un cuarto:
      //
      // La curva suavizaba respecto a la POSICIÓN DE SCROLL: repartía un
      // desplazamiento de hasta ~45px a lo largo de una zona de 0,25·vh
      // (~200px). Pero la fluidez se percibe respecto al TIEMPO, y cuántos
      // frames caen dentro de esos 200px depende de lo rápido que scrollees.
      // Yendo muy despacio hay decenas de frames y se ve bien —justo lo que
      // describe Álvaro—; a velocidad normal de flick se cruzan los 200px en
      // uno o dos frames, y entonces esos 45px de ida y otros 45 de vuelta
      // ocurren en dos frames: un tirón, no una suavización. Cuanto más
      // rápido va el scroll, peor se porta, que es exactamente al revés de lo
      // que hace falta.
      //
      // A eso se suma que este handler corre en el evento `scroll` NATIVO,
      // que el navegador coalesce y no garantiza en el mismo tick del rAF
      // donde Lenis escribe la posición. A velocidad alta el transform se
      // aplica sobre un rect ya viejo.
      //
      // Un `position: sticky` sin ayuda es exacto en todos los frames y a
      // cualquier velocidad, que es lo que se pide: 100% fluido siempre. Si
      // algún día vuelve a quererse el efecto, la vía NO es otra curva sobre
      // la posición de scroll: sería amortiguar en el tiempo (un damping con
      // dt sobre el desplazamiento) y aceptar el retardo respecto al
      // contenido que eso trae.

      // ===== Handoff reel→ZP en móvil (V16.21, "que vaya justo después
      // de la última card pero no encima"): el sticky del reel se funde en
      // función del rect REAL de esta sección — geometría visual, inmune a
      // los desalineamientos de la toolbar (st.end congelado por
      // ignoreMobileResize vs --vh-100 vivo, que en teléfono real dejaban
      // la última caption visible bajo la frase). Mapeo: zpTop 0.95·vh →
      // opacity 1, zpTop 0.35·vh → 0; todo ese tramo cae dentro de la cola
      // congelada del pin del reel (no se pierde nada en movimiento), y el
      // typewriter dispara DESPUÉS (0.30·vh), siempre sobre fondo limpio.
      // Activo también con reduced motion: no es "motion", es gestión de
      // oclusión — sin él el texto plano se pintaría sobre el reel.
      if (isMobile) {
        if (reelSticky === undefined) {
          reelSticky = document.querySelector<HTMLElement>("#nxr-servicios .nxr-servicios-sticky");
        }
        if (reelSticky) {
          const f = (rect.top / vh - 0.35) / 0.6;
          const v = f >= 1 ? "" : Math.max(0, Math.min(1, f)).toFixed(3);
          if (v !== lastReelFade) {
            lastReelFade = v;
            reelSticky.style.opacity = v;
          }
        }
      } else if (reelSticky && lastReelFade !== "" && lastReelFade !== "__") {
        // Rotación/resize a desktop con un fade escrito: restáuralo.
        lastReelFade = "";
        reelSticky.style.opacity = "";
      }

      // Disparo del fundido del texto central. El umbral es rect.top <= 0:
      // la sección ya ha llegado a su tope y el sticky está en su posición
      // definitiva, así que el texto aparece QUIETO, en su sitio. Antes se
      // disparaba a 0.30·vh (móvil) / 0.50·vh (escritorio), o sea con media
      // pantalla aún por subir, y por eso se veía salir desde abajo mientras
      // se escribía.
      //
      // Dispararlo más tarde no rompe el anti-solape con el reel: su fade
      // termina a 0.35·vh, muy por delante de 0. Si la página CARGA ya dentro
      // o pasada la sección (deep-link, teleport), se muestra sin transición
      // — un fundido sobre estados ya avanzados (p. ej. el glitch) se vería
      // roto.
      const twGate = 0;
      if (twChars.length) {
        if (!twInit) {
          twInit = true;
          if (rect.top <= twGate) {
            twStarted = true;
            mostrarTexto(true);
          }
        } else if (!twStarted && rect.top <= twGate) {
          // Cinturón anti-solape (V16.22): en móvil NO se muestra mientras
          // el sticky del reel siga pintado (fade > 0.05 y su caja aún en
          // pantalla) — si algo desincronizara el fade en un dispositivo
          // raro, el texto se RETRASA en vez de aparecer sobre la última
          // card.
          const reelPainted =
            isMobile &&
            reelSticky &&
            lastReelFade !== "" &&
            parseFloat(lastReelFade) > 0.05 &&
            reelSticky.getBoundingClientRect().bottom > 0;
          if (!reelPainted) {
            twStarted = true;
            // Un aterrizaje MUY profundo (media pantalla pasada la sección)
            // aparece sin transición; en el paso normal, con fundido.
            mostrarTexto(rect.top < -vh * 0.6);
          }
        } else if (twStarted && rect.top > vh * 0.9) {
          twStarted = false;
          ocultarTexto();
        }
      }

      // ===== PAUSA DE LECTURA al entrar (V17.45) =====
      // Petición: "quiero que haya que hacer más scroll por la parte de la
      // frase para que dé tiempo a leerla con un scroll normal". Los primeros
      // `hold` píxeles de la sección NO mueven nada: el progress se queda
      // clavado en 0, así que la frase "Los números hablan por nosotros" se
      // sostiene entera y a tamaño completo mientras el usuario la lee.
      //
      // La clave de por qué esto es seguro donde el recorte de V16.11 no lo
      // fue: la altura extra que acompaña a este hold en globals.css (240→300
      // desktop, 190→235 móvil) es EXACTAMENTE la del hold, así que el
      // denominador de abajo — el recorrido real del zoom — sigue valiendo
      // 1.4·vh en desktop y 0.9·vh en móvil, los mismos de siempre. El zoom no
      // se acelera ni se ralentiza: solo empieza más tarde.
      //
      // Antes de esto la frase se rompía habiendo recorrido 17,7vh en móvil y
      // encogía al 80% a los 48vh en desktop, contra los ~60vh / ~80-90vh que
      // pide la regla de legibilidad de la casa.
      const hold = vh * (isMobile ? 0.45 : 0.6);
      const raw = Math.max(0, Math.min(1, (scrolled - hold) / Math.max(1, total - hold)));
      // (La rampa de entrada móvil de V16.4 se eliminó en V16.6: su causa —
      // el remonte -160px bajo el reel — ya no existe (margin-top: 0 en
      // globals.css), así que la sección aparece COMO EN ORDENADOR.)
      let progress: number;
      if (isMobile) {
        // Ease-out (was cubic over 80% of the scroll). The higher exponent
        // spread over ~94% pairs with the section's height bump (200→240vh
        // in globals.css): the extra scroll room goes to the TAIL, so the
        // cards keep their entry pacing but settle progressively slower —
        // ever more scroll per pixel of movement as they approach rest.
        const t = Math.min(1, raw / 0.94);
        progress = 1 - Math.pow(1 - t, 3.4);
      } else {
        // The sine-smoothed S-curve composed with a tail-stretcher: the
        // approach into the final grid gets progressively slower and the
        // derivative reaches 0 at rest (no snap). NOTA (V15.95): el intento
        // de arranque rápido (1-(1-raw)^2.2, V15.94) se REVIRTIÓ — sin el
        // arranque lento del S-curve la sección entera "va rapidísimo";
        // la reducción de duración de las frases se quedó en los recortes
        // de altura (300→170vh / 240→150vh), no en la curva.
        const s = raw - Math.sin(raw * Math.PI * 2) / (2 * Math.PI);
        progress = 1 - Math.pow(1 - s, 1.4);
      }

      // Each card's layout (width/height/position/font-size/etc.) is static
      // CSS sized for its OWN largest (start-of-scroll) state — see the
      // `nth-child` rules in globals.css. The only thing that changes on
      // scroll is a single `transform: scale()` shrinking it down from
      // there, which is GPU-composited (no reflow) and never enlarges
      // pre-rendered pixels, so it stays both smooth and crisp.
      let dominantIdx = -1;
      let dominantHeight = -Infinity;
      const imgs: (HTMLElement | null)[] = [];
      layers.forEach((layer, i) => {
        const max =
          parseFloat((isMobile ? layer.dataset.maxScaleMobile : undefined) ?? layer.dataset.maxScale ?? "4") || 4;
        const img = layer.querySelector<HTMLElement>(".nxr-zp-img");
        imgs.push(img);
        if (!img) return;
        // La card CENTRAL (la frase "Construido con maestría") responde al
        // scroll CRUDO (raw, no la curva S de arranque lento): en cuanto
        // scrolleas, la frase empieza a salir — "termina la entrada, muy
        // poco sticky, y continúa la salida" — idéntico en móvil y
        // ordenador. Las demás cards conservan el pacing global (curva S
        // con cola lenta) intacto: la sección no se acelera (lección de
        // V15.95-96).
        // TODAS las cards comparten el MISMO progress (V16.16): el driver
        // propio de la card central (V16.2-16.15) desincronizaba su ritmo
        // del de las vecinas y Álvaro lo rechazó ("las cards de alrededor
        // no van al mismo ritmo que la central; antes estaba bien — nunca
        // cambies algo que no te haya pedido"). La menor duración de la
        // frase se gestiona exclusivamente con su disolución (banda 0.55
        // del progress en móvil), no con ritmos propios.
        const p = progress;
        const scale = max - (max - 1) * p;
        img.style.transform = `scale(${scale / max})`;
        // Mobile only: the CENTRE card (index 0, the one that fills the
        // screen at the start) dissolves while the surrounding cards scale
        // in — as a DIGITAL GLITCH, not a plain fade: the opacity stutters
        // in hard steps (the WebGL glass mesh mirrors the anchor's inline
        // opacity, so the glass itself flickers out — see
        // ZoomParallaxCardsLayer), while the card content jitters, loses
        // horizontal slices (clip-path) and RGB-splits its text via the
        // --zpg* custom properties consumed in globals.css.
        if (i === 0 && isMobile) {
          // Banda de disolución sobre el progress compartido. 0.55 -> 0.80
          // (V17.45, "se pasa sin querer y no da tiempo a leerla"): la frase
          // empezaba a romperse habiendo recorrido solo el 19,7% de la sección
          // — 17,7vh de lectura a brillo pleno, cuando la regla de la casa pide
          // ~60vh en móvil para una frase-momento. Retrasando el arranque de la
          // banda sube a ~31,9vh (+80%) SIN tocar la altura de la sección ni la
          // curva de progress: es justo el mecanismo que pide el comentario de
          // #nxr-zoom-parallax en globals.css ("la duración de la frase se
          // gestiona con su propio fade, no con la sección"). La disolución
          // sigue terminando en progress 1, así que ocupa menos progress pero
          // MÁS scroll real, porque la curva ya va aplanada en ese tramo.
          const t = Math.min(1, Math.max(0, (p - 0.8) / 0.2));
          const glitching = !rmMql.matches && t > 0 && t < 1;
          if (!glitching) {
            // Reduced motion keeps the plain smoothstep fade; outside the
            // band this also serves as the reset/cleanup path.
            const fade = 1 - t * t * (3 - 2 * t);
            img.style.opacity = fade.toFixed(3);
            img.style.setProperty("--zpg", "0");
            clearHeroGlitch(img);
          } else {
            // Slice-glitch death (After-Effects style): the intact text is
            // replaced almost immediately by 5 horizontal BANDS of the card
            // (full clones clipped to stratified stripes), each displaced
            // and strobed independently in ~26 discrete steps. The whole
            // card holds near-full opacity while it shreds, then crashes
            // late — the WebGL glass mirrors that strobe/death.
            img.classList.add("nxr-zp-glitching");
            const seed = Math.floor(t * 26);
            const g = Math.sin(Math.PI * t);
            const u = Math.min(1, Math.max(0, (t - 0.55) / 0.45));
            const die = 1 - u * u * (3 - 2 * u);
            const st = hash(seed * 3 + 11);
            const strobe = st > 0.68 ? 0.3 + 0.45 * hash(seed + 5) : 1;
            img.style.opacity = (die * strobe).toFixed(3);
            if (heroBase) heroBase.style.opacity = Math.max(0, 1 - t * 3.2).toFixed(3);
            img.style.setProperty("--zpg", ((hash(seed) - 0.5) * 2 * g).toFixed(3));
            const K = heroSlices.length || 1;
            heroSlices.forEach((sl, k) => {
              const h1 = hash(seed * 7 + k * 13);
              const h2 = hash(seed * 7 + k * 13 + 101);
              // Bands stratified over the middle 22–80% of the card, where
              // the text lives — bars that cut THROUGH the letters are what
              // sells the effect (bands on empty padding read as noise).
              const top = 22 + ((k + h1 * 0.85) / K) * 58;
              const hgt = 5 + h2 * 13;
              const x = (h2 - 0.5) * 2 * (16 + 60 * g);
              sl.style.clipPath = `inset(${top.toFixed(1)}% 0 ${Math.max(0, 100 - top - hgt).toFixed(1)}% 0)`;
              sl.style.transform = `translateX(${x.toFixed(1)}px)`;
              sl.style.opacity = h1 > 0.22 ? "1" : "0";
            });
            // Corrupción de caracteres (V16.20 "mejora la animación falla
            // del texto"): en cada paso discreto unos pocos glifos se
            // sustituyen por basura — determinista por seed (rebobinable
            // con el scrub) y coherente entre la base y los clones de los
            // slices, que comparten índice de carácter.
            const CORR = "▓▒█<>/\\|#*+=";
            const corrupt = (list: HTMLElement[]) => {
              for (let k = 0; k < list.length; k++) {
                const c = list[k];
                const hc = hash(seed * 31 + k * 7.3);
                if (hc > 0.9) {
                  if (c.dataset.o === undefined) c.dataset.o = c.textContent ?? "";
                  c.textContent = CORR[Math.floor(hc * 997) % CORR.length];
                } else if (c.dataset.o !== undefined) {
                  c.textContent = c.dataset.o;
                  delete c.dataset.o;
                }
              }
            };
            corrupt(twChars);
            sliceCharLists.forEach(corrupt);
          }
        } else if (i === 0 && (img.style.opacity || img.classList.contains("nxr-zp-glitching"))) {
          // DESKTOP: la card central no se disuelve, así que el bloque de
          // arriba no corre y nada retira lo que dejó escrito. Si el usuario
          // rota el teléfono o ensancha la ventana con la frase a medio
          // glitch, sin esto la card se quedaba clavada semitransparente,
          // con --zpg congelado y con glifos corruptos que ya nadie restaura
          // (el mismo caso que la rama `else if` del handoff del reel más
          // arriba). Solo toca estilos INLINE que escribió el propio glitch.
          //
          // La GUARDA de la condición es deliberada: sin ella esto correría en
          // cada frame de scroll de desktop ensuciando el CSSOM para nada.
          // En desktop puro la card 0 nunca tiene opacity inline ni la clase,
          // así que el coste es una comprobación de cadena vacía y se acabó.
          img.style.opacity = "";
          img.style.removeProperty("--zpg");
          clearHeroGlitch(img);
        }
      });

      // ---- PASADA DE LECTURA, separada de las escrituras de arriba ----
      // Real on-screen height AFTER the transform above — comparable
      // across cards despite their different base CSS sizes/max values,
      // and the SAME metric components/scene/ZoomParallaxCardsLayer.tsx
      // ranks the glass meshes by, so the DOM text below stacks in the
      // same order the glass does.
      //
      // POR QUÉ EN SU PROPIO BUCLE: leer getBoundingClientRect() dentro del
      // forEach anterior forzaba un reflow SÍNCRONO por card (7 por evento de
      // scroll, y en la card 0 justo después de escribirle transform,
      // clip-path y opacity a 5 clones). Con las escrituras ya todas hechas,
      // el primer rect paga UN layout y los otros seis salen de él gratis.
      // Es la misma lección que Servicios.tsx documenta en updateSpiral
      // ("one layout per SLIDE per frame instead of one per frame, the top
      // main-thread cost"). El resultado es idéntico: las cards están
      // posicionadas de forma independiente, así que el transform de una
      // nunca altera la altura medida de otra.
      imgs.forEach((img, i) => {
        if (!img) return;
        const h = img.getBoundingClientRect().height;
        if (h > dominantHeight) {
          dominantHeight = h;
          dominantIdx = i;
        }
      });
      // The currently most-dominant card's TEXT needs to sit BEHIND its
      // neighbours' text/content, mirroring the glass mesh depth order
      // (see BEHIND_Z in ZoomParallaxCardsLayer.tsx) — otherwise, once two
      // cards' boxes started overlapping (most visible on phones, where
      // they sit closer together), the central card's DOM content — plain
      // sibling elements with no z-index at all before this, so later ones
      // simply painted over earlier ones in mount order — could end up
      // showing IN FRONT of a neighbour it was supposed to be tucked behind.
      imgs.forEach((img, i) => {
        if (img) img.style.zIndex = i === dominantIdx ? "1" : "2";
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      ioNear?.disconnect();
      if (reelSticky) reelSticky.style.opacity = "";
    };
  }, []);

  return (
    <section id="nxr-zoom-parallax" ref={sectionRef}>
      <div id="nxr-zoom-sticky" ref={stickyRef}>
        {CARDS.map((item, i) => (
          <div
            className="nxr-zp-layer"
            data-max-scale={item.scale}
            data-max-scale-mobile={item.mobileScale ?? item.scale}
            key={i}
            ref={(el) => {
              layerRefs.current[i] = el;
            }}
          >
            <div
              className="nxr-zp-img"
              ref={(el) => {
                imgRefs.current[i] = el;
              }}
            >
              {item.content(t)}
              {/* Slice layers for the centre card's mobile glitch-death:
                  full clones of the content, each clipped to a horizontal
                  band and displaced independently per scroll frame (see the
                  glitch block in onScroll). display:none everywhere except
                  while .nxr-zp-glitching is on the anchor (mobile only). */}
              {i === 0 &&
                Array.from({ length: 5 }, (_, k) => (
                  <div className="nxr-zp-glslice" aria-hidden="true" key={`gs${k}`}>
                    {item.content(t)}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
