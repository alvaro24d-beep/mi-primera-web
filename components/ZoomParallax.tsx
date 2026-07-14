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
    content: (
      <div className="nxr-zp-card" style={{ gap: "calc(4px * var(--zp-max, 1))" }}>
        <div className="nxr-zp-hero-text">
          Construido con maestría.
          <br />
          <span className="nxr-gradient-text-lime">Entregado con precisión.</span>
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

    // Deterministic pseudo-random (shader-style hash): the glitch pattern is
    // a pure function of scroll progress, so scrubbing back through the
    // dissolve replays the exact same frames in reverse — no RAF loops, no
    // state, nothing to desync from the scrub.
    const frac = (n: number) => n - Math.floor(n);
    const hash = (n: number) => frac(Math.sin(n * 127.1) * 43758.5453);

    function onScroll() {
      const vh = window.innerHeight;
      const isMobile = window.innerWidth <= 768;

      const rect = section!.getBoundingClientRect();
      const total = section!.offsetHeight - vh;
      const scrolled = -rect.top;

      const raw = Math.max(0, Math.min(1, scrolled / total));
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
        // The sine-smoothed S-curve is composed with a tail-stretcher:
        // 1-(1-s)^1.4 re-maps the remaining distance so the LAST stretch of
        // the animation consumes the section's added height (240→300vh, see
        // globals.css — retune both together). Early pacing is unchanged in
        // screen terms (the ^1.4 speed-up cancels against the 1.43x longer
        // scroll), the approach into the final grid gets progressively
        // slower, and the derivative still reaches 0 at rest (no snap).
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
        const scale = max - (max - 1) * progress;
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
          const t = Math.min(1, Math.max(0, (progress - 0.55) / 0.35));
          const fade = 1 - t * t * (3 - 2 * t); // smoothstep envelope
          if (rmMql.matches || t <= 0 || t >= 1) {
            img.style.opacity = fade.toFixed(3);
            img.style.setProperty("--zpg", "0");
            img.style.setProperty("--zpgt", "0");
            img.style.setProperty("--zpgb", "0");
          } else {
            // ~22 discrete glitch "frames" across the band; g ramps the
            // violence in and out so it starts/ends clean.
            const seed = Math.floor(t * 22);
            const h1 = hash(seed);
            const h2 = hash(seed + 13);
            const g = Math.sin(Math.PI * t);
            const flicker = h1 > 0.62 ? 0.45 + 0.4 * h2 : 1 - 0.12 * h2;
            img.style.opacity = (fade * flicker).toFixed(3);
            img.style.setProperty("--zpg", (((h1 - 0.5) * 2) * g).toFixed(3));
            img.style.setProperty("--zpgt", (h1 * 30 * g).toFixed(2));
            img.style.setProperty("--zpgb", (h2 * 24 * g).toFixed(2));
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
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
