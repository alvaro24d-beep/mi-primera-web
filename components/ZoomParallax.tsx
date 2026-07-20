"use client";

import { useEffect, useRef } from "react";
import { useZoomParallaxCardsRegistry } from "@/store/useZoomParallaxCardsRegistry";

const CARDS: { scale: number; mobileScale?: number; content: React.ReactNode }[] = [
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
    content: (
      <div className="nxr-zp-card" style={{ gap: "calc(4px * var(--zp-max, 1))" }}>
        <div className="nxr-zp-hero-text">
          Los números
          <br />
          <span className="nxr-gradient-text-lime">hablan por nosotros.</span>
        </div>
      </div>
    ),
  },
  {
    scale: 5,
    content: (
      <div className="nxr-zp-card">
        <div className="nxr-zp-card-num" style={{ color: "var(--c-lime)" }}>
          +40
        </div>
        <div className="nxr-zp-card-title">Proyectos entregados</div>
        <div className="nxr-zp-card-desc">con éxito</div>
      </div>
    ),
  },
  {
    scale: 6,
    content: (
      <div className="nxr-zp-card">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF3D0D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        <div className="nxr-zp-card-title">Desarrollo web</div>
        <div className="nxr-zp-card-desc">Webs que convierten</div>
      </div>
    ),
  },
  {
    scale: 8,
    content: (
      <div className="nxr-zp-card">
        <div className="nxr-zp-card-num" style={{ color: "var(--c-salmon)" }}>
          98%
        </div>
        <div className="nxr-zp-card-title">Clientes satisfechos</div>
      </div>
    ),
  },
  {
    scale: 9,
    content: (
      <div className="nxr-zp-card">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A8F04A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3L3 8.5v7L12 21l9-5.5v-7L12 3z" />
          <path d="M12 12l9-3.5M12 12L3 8.5M12 12v9" />
        </svg>
        <div className="nxr-zp-card-title">Automatizaciones</div>
        <div className="nxr-zp-card-desc">Sin intervención humana</div>
      </div>
    ),
  },
  {
    scale: 8,
    content: (
      <div className="nxr-zp-card">
        <div className="nxr-zp-card-num" style={{ color: "var(--c-lime)" }}>
          3x
        </div>
        <div className="nxr-zp-card-title">ROI medio</div>
        <div className="nxr-zp-card-desc">primer año</div>
      </div>
    ),
  },
  {
    scale: 9,
    content: (
      <div className="nxr-zp-card">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF9D7D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M16.5 16.5L21 21" />
        </svg>
        <div className="nxr-zp-card-title">SEO</div>
        <div className="nxr-zp-card-desc">Visibilidad real en Google</div>
      </div>
    ),
  },
];

export default function ZoomParallax() {
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

    // ===== Typewriter de entrada (V16.20, "animación de entrada de las
    // frases de construido con maestría de tipo escritura a máquina"). El
    // texto se trocea UNA vez en spans por carácter (los espacios quedan
    // como nodos de texto para no alterar el word-wrap móvil); todos los
    // caracteres existen desde el primer render, así que teclear = conmutar
    // visibility, cero reflow. La escritura es temporal (no scrub) y se
    // rebobina si vuelves a subir; la SALIDA (encogimiento + glitch móvil)
    // no se toca. Reduced motion: no se trocea nada, el texto queda plano.
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
              s.className = "nxr-zp-tw";
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
      // Los clones de los slices se trocean también para que el glitch
      // pueda corromper caracteres de forma coherente con la base, pero
      // nacen ya visibles: solo asoman dentro de la banda de glitch, mucho
      // después de que el tecleo haya terminado.
      heroSlices.forEach((sl) => {
        const st = sl.querySelector<HTMLElement>(".nxr-zp-hero-text");
        const list: HTMLElement[] = [];
        if (st) splitChars(st, list);
        list.forEach((c) => c.classList.add("nxr-zp-tw-on"));
        sliceCharLists.push(list);
      });
    }
    const caret = document.createElement("span");
    caret.className = "nxr-zp-twcaret";
    caret.setAttribute("aria-hidden", "true");
    let twTimer = 0;
    let twStarted = false;
    let twInit = false;
    const revealAll = () => {
      window.clearInterval(twTimer);
      twChars.forEach((c) => c.classList.add("nxr-zp-tw-on"));
      caret.remove();
    };
    const startTyping = () => {
      window.clearInterval(twTimer);
      let k = 0;
      twTimer = window.setInterval(() => {
        const c = twChars[k];
        if (!c) {
          window.clearInterval(twTimer);
          window.setTimeout(() => caret.remove(), 700);
          return;
        }
        c.classList.add("nxr-zp-tw-on");
        c.insertAdjacentElement("afterend", caret);
        k++;
      }, 30);
    };
    const resetTyping = () => {
      window.clearInterval(twTimer);
      caret.remove();
      twChars.forEach((c) => c.classList.remove("nxr-zp-tw-on"));
    };

    // Sticky del reel de Servicios (fade de handoff, ver onScroll):
    // undefined = aún no buscado; null = no existe en esta página.
    let reelSticky: HTMLElement | null | undefined;
    let lastReelFade = "__";

    function onScroll() {
      const vh = window.innerHeight;
      const isMobile = window.innerWidth <= 768;

      const rect = section!.getBoundingClientRect();
      const total = section!.offsetHeight - vh;
      const scrolled = -rect.top;

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

      // Disparo del typewriter. Desktop: teclea con la sección a media
      // pantalla, así termina de escribirse justo al quedar centrada.
      // Móvil: a 0.30·vh — el fade del reel de arriba termina a 0.35·vh,
      // así que la frase se escribe justo cuando la última card acaba de
      // fundirse, nunca encima, y con ~250px de tecleo visible subiendo a
      // su centro. Si la página CARGA ya dentro/pasada la sección
      // (deep-link, teleport grande), se muestra completa al instante —
      // teclear sobre estados avanzados (p. ej. el glitch) quedaría roto.
      const twGate = vh * (isMobile ? 0.3 : 0.5);
      if (twChars.length) {
        if (!twInit) {
          twInit = true;
          if (rect.top <= twGate) {
            twStarted = true;
            revealAll();
          }
        } else if (!twStarted && rect.top <= twGate) {
          // Cinturón anti-solape (V16.22): en móvil NO se empieza a
          // escribir mientras el sticky del reel siga pintado (fade > 0.05
          // y su caja aún en pantalla) — si algo desincronizara el fade en
          // un dispositivo raro, el tecleo se RETRASA en vez de escribirse
          // encima de la última card.
          const reelPainted =
            isMobile &&
            reelSticky &&
            lastReelFade !== "" &&
            parseFloat(lastReelFade) > 0.05 &&
            reelSticky.getBoundingClientRect().bottom > 0;
          if (!reelPainted) {
            twStarted = true;
            // Solo un aterrizaje MUY profundo (media pantalla pasada la
            // sección) revela al instante; un flick fuerte que cruza el
            // umbral de golpe TECLEA igualmente — "quiero que sea
            // animación de escritura", nunca el pop suave de antes.
            if (rect.top < -vh * 0.6) revealAll();
            else startTyping();
          }
        } else if (twStarted && rect.top > vh * 0.9) {
          twStarted = false;
          resetTyping();
        }
      }

      const raw = Math.max(0, Math.min(1, scrolled / total));
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
          // Banda original 0.55-0.9 sobre el progress compartido (V16.16).
          const t = Math.min(1, Math.max(0, (p - 0.55) / 0.35));
          const glitching = !rmMql.matches && t > 0 && t < 1;
          if (!glitching) {
            // Reduced motion keeps the plain smoothstep fade; outside the
            // band this also serves as the reset/cleanup path.
            const fade = 1 - t * t * (3 - 2 * t);
            img.style.opacity = fade.toFixed(3);
            img.style.setProperty("--zpg", "0");
            if (img.classList.contains("nxr-zp-glitching")) {
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
            }
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
        }
        // Real on-screen height AFTER the transform above — comparable
        // across cards despite their different base CSS sizes/max values,
        // and the SAME metric components/scene/ZoomParallaxCardsLayer.tsx
        // ranks the glass meshes by, so the DOM text below stacks in the
        // same order the glass does.
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
      window.clearInterval(twTimer);
      caret.remove();
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
              {item.content}
              {/* Slice layers for the centre card's mobile glitch-death:
                  full clones of the content, each clipped to a horizontal
                  band and displaced independently per scroll frame (see the
                  glitch block in onScroll). display:none everywhere except
                  while .nxr-zp-glitching is on the anchor (mobile only). */}
              {i === 0 &&
                Array.from({ length: 5 }, (_, k) => (
                  <div className="nxr-zp-glslice" aria-hidden="true" key={`gs${k}`}>
                    {item.content}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
