"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useTextScramble } from "@/hooks/useTextScramble";

/**
 * QUÉ INCLUYE EL PROYECTO: especialización, infraestructura y seguridad, y lo
 * que se entrega. Cierra la página justo antes del formulario a propósito —es
 * el argumento con el que uno decide escribir, así que va pegado al sitio
 * donde se escribe.
 *
 * Tres grupos con encabezado propio en vez de una rejilla plana de once
 * tarjetas: son tres ideas distintas (con qué construimos / dónde vive y cómo
 * se protege / qué te llevas), y sin esa separación el bloque se lee como una
 * lista de características intercambiables.
 *
 * El plazo va aparte y al final, en su propia franja: es un dato que se busca
 * activamente y no debe quedar enterrado entre las tarjetas.
 *
 * Sin pin, sin scrub y sin cristal volumétrico, por lo mismo que DwhAeo.
 */
const GRUPOS = [
  {
    k: "g1",
    items: [
      { k: "1", color: "var(--c-salmon)", bg: "rgba(255,157,125,.12)" },
      { k: "2", color: "var(--c-lime)", bg: "rgba(168,240,74,.12)" },
      { k: "3", color: "var(--c-red)", bg: "rgba(239,61,13,.15)" },
    ],
  },
  {
    k: "g2",
    items: [
      { k: "1", color: "var(--c-salmon)", bg: "rgba(255,157,125,.12)" },
      { k: "2", color: "var(--c-red)", bg: "rgba(239,61,13,.15)" },
      { k: "3", color: "var(--c-lime)", bg: "rgba(168,240,74,.12)" },
      { k: "4", color: "var(--c-salmon)", bg: "rgba(255,157,125,.12)" },
    ],
  },
  {
    k: "g3",
    items: [
      { k: "1", color: "var(--c-lime)", bg: "rgba(168,240,74,.12)" },
      { k: "2", color: "var(--c-salmon)", bg: "rgba(255,157,125,.12)" },
      { k: "3", color: "var(--c-red)", bg: "rgba(239,61,13,.15)" },
      { k: "4", color: "var(--c-lime)", bg: "rgba(168,240,74,.12)" },
    ],
  },
];

// Un icono por celda, en el mismo orden que GRUPOS. Se mantienen aparte de los
// datos para que el array de arriba se lea de un vistazo.
const ICONOS: Record<string, React.ReactNode> = {
  g11: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M6 9l2.5 7 3.5-10 3.5 10L18 9" />
    </svg>
  ),
  g12: (
    <svg viewBox="0 0 24 24">
      <path d="M12 2l8 4.6v10.8L12 22l-8-4.6V6.6L12 2z" />
      <path d="M9 16V8l6 8V8" />
    </svg>
  ),
  g13: (
    <svg viewBox="0 0 24 24">
      <path d="M12 2l8 4.6v10.8L12 22l-8-4.6V6.6L12 2z" />
      <path d="M12 12v10M12 12L4 7M12 12l8-5" />
    </svg>
  ),
  g21: (
    <svg viewBox="0 0 24 24">
      <path d="M18 10a6 6 0 00-11.7-1.8A4.5 4.5 0 006.5 19H18a4.5 4.5 0 000-9z" />
    </svg>
  ),
  g22: (
    <svg viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  g23: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
    </svg>
  ),
  g24: (
    <svg viewBox="0 0 24 24">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
      <path d="M12 15v2" />
    </svg>
  ),
  g31: (
    <svg viewBox="0 0 24 24">
      <path d="M9 19c-4 1.4-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.3 4.3 0 00-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 00-6 0C6.8 2.8 5.8 3.1 5.8 3.1a4.3 4.3 0 00-.1 3.2A4.6 4.6 0 004.4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
    </svg>
  ),
  g32: (
    <svg viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="7" rx="2" />
      <rect x="2" y="13" width="20" height="7" rx="2" />
      <path d="M6 7.5h.01M6 16.5h.01" />
    </svg>
  ),
  g33: (
    <svg viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 11-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  ),
  g34: (
    <svg viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
};

export default function DwhIncluido() {
  const t = useTranslations("dwhIncluido");
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useTitleReveal<HTMLHeadingElement>();

  useTextScramble(sectionRef, ".nxr-inc-intro");

  return (
    <section id="nxr-dwh-incluido" ref={sectionRef}>
      <div className="nxr-inc-inner">
        <div className="nxr-inc-head nxr-reveal">
          <h2 className="nxr-section-h2" ref={titleRef}>
            {t("titulo1")}
            <br />
            <span className="nxr-gradient-text-salmon">{t("titulo2")}</span>
          </h2>
          <p className="nxr-inc-intro">{t("intro")}</p>
        </div>

        {GRUPOS.map((g) => (
          <div className="nxr-inc-grupo" key={g.k}>
            <h3 className="nxr-inc-grupo-label nxr-reveal">{t(g.k)}</h3>
            <div className="nxr-inc-grid">
              {g.items.map((it, i) => (
                <div className={`nxr-inc-card nxr-reveal nxr-reveal-delay-${i + 1}`} key={it.k}>
                  <div className="nxr-inc-icon" style={{ background: it.bg, color: it.color }}>
                    {ICONOS[`${g.k}${it.k}`]}
                  </div>
                  <div>
                    <h4 className="nxr-inc-card-title">{t(`${g.k}t${it.k}`)}</h4>
                    <p className="nxr-inc-card-desc">{t(`${g.k}d${it.k}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="nxr-inc-plazo nxr-reveal">
          <div className="nxr-inc-plazo-t">{t("plazoT")}</div>
          <p className="nxr-inc-plazo-d">{t("plazoD")}</p>
        </div>
      </div>
    </section>
  );
}
