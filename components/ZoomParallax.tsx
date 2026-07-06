"use client";

import { useEffect, useRef } from "react";

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

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    const layers = layerRefs.current.filter(Boolean) as HTMLDivElement[];

    function onScroll() {
      const vh = window.innerHeight;
      const isMobile = window.innerWidth <= 768;

      const rect = section!.getBoundingClientRect();
      const total = section!.offsetHeight - vh;
      const scrolled = -rect.top;

      const raw = Math.max(0, Math.min(1, scrolled / total));
      const progress = isMobile ? Math.min(1, raw / 0.8) : raw - Math.sin(raw * Math.PI * 2) / (2 * Math.PI);

      // Each card's layout (width/height/position/font-size/etc.) is static
      // CSS sized for its OWN largest (start-of-scroll) state — see the
      // `nth-child` rules in globals.css. The only thing that changes on
      // scroll is a single `transform: scale()` shrinking it down from
      // there, which is GPU-composited (no reflow) and never enlarges
      // pre-rendered pixels, so it stays both smooth and crisp.
      layers.forEach((layer) => {
        const max =
          parseFloat((isMobile ? layer.dataset.maxScaleMobile : undefined) ?? layer.dataset.maxScale ?? "4") || 4;
        const img = layer.querySelector<HTMLElement>(".nxr-zp-img");
        if (!img) return;
        const scale = max - (max - 1) * progress;
        img.style.transform = `scale(${scale / max})`;
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
            <div className="nxr-zp-img">{item.content}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
