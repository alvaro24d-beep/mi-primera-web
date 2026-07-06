"use client";

import { useEffect, useRef } from "react";

const STATS = [
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    bg: "rgba(239,61,13,.15)",
    color: "var(--c-red)",
    num: (
      <>
        +40 <span style={{ color: "var(--c-lime)" }}>proyectos</span>
      </>
    ),
    label: "Entregados con éxito",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    bg: "rgba(168,240,74,.12)",
    color: "var(--c-lime)",
    num: (
      <>
        98<span style={{ color: "var(--c-lime)" }}>%</span>
      </>
    ),
    label: "Clientes satisfechos",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    bg: "rgba(255,157,125,.12)",
    color: "var(--c-salmon)",
    num: (
      <>
        24<span style={{ color: "var(--c-lime)" }}>/7</span>
      </>
    ),
    label: "Agentes activos",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 17l4-8 4 5 3-3 4 6" />
      </svg>
    ),
    bg: "rgba(239,61,13,.15)",
    color: "var(--c-red)",
    num: (
      <>
        3<span style={{ color: "var(--c-lime)" }}>x</span>
      </>
    ),
    label: "ROI medio primer año",
  },
];

function StatCard({ stat }: { stat: (typeof STATS)[number] }) {
  return (
    <div className="nxr-hero-stat-card nxr-glass-edge">
      <div
        className="nxr-hero-stat-card-icon nxr-glass-edge-content"
        style={{ background: stat.bg, color: stat.color }}
      >
        {stat.icon}
      </div>
      <div className="nxr-glass-edge-content">
        <div className="nxr-hero-stat-card-num">{stat.num}</div>
        <div className="nxr-hero-stat-card-label">{stat.label}</div>
      </div>
    </div>
  );
}

export default function Hero() {
  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const marqueeWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--vh-100", `${window.innerHeight}px`);

    if (window.innerWidth <= 768 && marqueeTrackRef.current && marqueeWrapRef.current) {
      const track = marqueeTrackRef.current;
      const cards = Array.from(track.parentElement!.parentElement!.querySelectorAll<HTMLElement>(
        ".nxr-hero-bottom .nxr-hero-stat-card"
      ));
      if (cards.length) {
        const all = cards;
        all.concat(all.map((c) => c.cloneNode(true) as HTMLElement)).forEach((c) => track.appendChild(c));
        marqueeWrapRef.current.style.display = "block";
      }
    }
  }, []);

  return (
    <section id="nxr-hero">
      <div className="nxr-hero-center">
        <div className="nxr-hero-badge nxr-glass-edge nxr-reveal nxr-reveal-delay-1">
          <span className="nxr-hero-badge-dot nxr-glass-edge-content"></span>
          <span className="nxr-glass-edge-content">Agencia de software & inteligencia artificial</span>
        </div>

        <h1 className="nxr-hero-h1 nxr-reveal nxr-reveal-delay-2">
          Tu empresa en
          <br />
          <span className="nxr-gradient-text-lime">piloto automático.</span>
        </h1>

        <p className="nxr-hero-sub nxr-reveal nxr-reveal-delay-3">
          Webs, agentes de IA, automatizaciones y apps que trabajan por ti mientras tú te enfocas en crecer.
        </p>

        <div className="nxr-hero-actions nxr-reveal nxr-reveal-delay-4">
          <a href="/contacto" className="nxr-btn-primary nxr-glass-edge">
            <svg
              className="nxr-glass-edge-content"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span className="nxr-glass-edge-content">Empezar proyecto</span>
          </a>
          <a href="/servicios" className="nxr-btn-secondary">
            Ver servicios
          </a>
        </div>
      </div>

      <div className="nxr-hero-bottom nxr-reveal nxr-reveal-delay-5">
        <div className="nxr-hero-bottom-left">
          <StatCard stat={STATS[0]} />
          <StatCard stat={STATS[1]} />
        </div>
        <div className="nxr-hero-bottom-right">
          <StatCard stat={STATS[2]} />
          <StatCard stat={STATS[3]} />
        </div>
      </div>

      <div id="nxr-hero-marquee-wrap" ref={marqueeWrapRef} style={{ display: "none" }}>
        <div className="nxr-hero-marquee-track" ref={marqueeTrackRef}></div>
      </div>
    </section>
  );
}
