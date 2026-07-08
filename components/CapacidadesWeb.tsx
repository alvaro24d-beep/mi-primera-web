"use client";

import { useEffect, useRef } from "react";
import { useTitleReveal } from "@/hooks/useTitleReveal";

const CAPACIDADES = [
  {
    title: "Diseño a medida",
    desc: "Nada de plantillas genéricas: cada web se diseña desde cero para tu marca.",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
      </svg>
    ),
  },
  {
    title: "Responsive & mobile-first",
    desc: "Se ve y funciona perfecto en cualquier pantalla, empezando por el móvil.",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    title: "Rendimiento real",
    desc: "Core Web Vitals aprobados y tiempos de carga que no espantan visitas.",
    color: "var(--c-salmon)",
    bg: "rgba(255,157,125,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z" />
      </svg>
    ),
  },
  {
    title: "SEO técnico de base",
    desc: "Estructura, metadatos y velocidad pensados para posicionar desde el día uno.",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5L21 21" />
      </svg>
    ),
  },
  {
    title: "CMS / panel de gestión",
    desc: "Edita textos, imágenes y contenido sin tocar código ni depender de nosotros.",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    title: "Integraciones & APIs",
    desc: "Conectamos tu web con CRM, pasarelas de pago, email y las herramientas que ya usas.",
    color: "var(--c-salmon)",
    bg: "rgba(255,157,125,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 3L3 8.5v7L12 21l9-5.5v-7L12 3z" />
        <path d="M12 12l9-3.5M12 12L3 8.5M12 12v9" />
      </svg>
    ),
  },
];

const STATS = [
  { val: "+40", label: "Proyectos web entregados", color: "var(--c-lime)" },
  { val: "100%", label: "Core Web Vitals aprobados", color: "var(--c-salmon)" },
  { val: "-40%", label: "Tiempo de carga medio", color: "var(--c-lime)" },
  { val: "30d", label: "Soporte post-lanzamiento", color: "var(--c-salmon)" },
];

export default function CapacidadesWeb() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>(".nxr-dwh-cap-card"));

    const onMouseMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    cards.forEach((card) => card.addEventListener("mousemove", onMouseMove));

    return () => {
      cards.forEach((card) => card.removeEventListener("mousemove", onMouseMove));
    };
  }, []);

  return (
    <section id="nxr-dwh-capacidades" className="nxr-dwh-capacidades">
      <div className="nxr-dwh-capacidades-inner">
        <div className="nxr-reveal">
          <p className="nxr-section-label">Capacidades</p>
          <h2 className="nxr-section-h2" ref={titleRef}>
            Todo lo que tu web necesita para{" "}
            <span className="nxr-gradient-text-lime">competir de verdad.</span>
          </h2>
        </div>

        <div className="nxr-dwh-cap-grid" ref={gridRef}>
          {CAPACIDADES.map((c, i) => (
            <div
              key={c.title}
              className="nxr-dwh-cap-card nxr-glass-edge nxr-reveal"
              style={{ transitionDelay: `${i * 0.06}s` }}
            >
              <span className="nxr-glass-edge-content nxr-dwh-cap-inner">
                <div className="nxr-dwh-cap-icon" style={{ background: c.bg, color: c.color }}>
                  {c.icon}
                </div>
                <div className="nxr-dwh-cap-title">{c.title}</div>
                <div className="nxr-dwh-cap-desc">{c.desc}</div>
              </span>
            </div>
          ))}
        </div>

        <div className="nxr-dwh-stats-strip">
          {STATS.map((s, i) => (
            <div key={s.label} className="nxr-dwh-stat nxr-reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className="nxr-dwh-stat-val" style={{ color: s.color }}>
                {s.val}
              </div>
              <div className="nxr-dwh-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
