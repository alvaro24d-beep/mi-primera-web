"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useTextScramble } from "@/hooks/useTextScramble";

/**
 * VISIBILIDAD: buscadores tradicionales + buscadores de IA (AEO).
 *
 * Va justo después de CapacidadesWeb porque el orden de la página es "qué
 * lleva tu web" → "qué consigue" → "con qué se construye" → "qué incluye".
 *
 * Sección DELIBERADAMENTE SIN PIN ni scrub. La página ya tiene el hero pineado
 * y la pila sticky de capacidades; una tercera sección que secuestre el scroll
 * la haría interminable, y esto es contenido para leer, no para mirar. La
 * entrada es el reveal estándar (RevealInit) más el scramble del párrafo, que
 * es el patrón del resto de párrafos de sección del sitio.
 *
 * Sin cristal volumétrico por lo mismo que las cards de Proceso (V18.01): un
 * MeshTransmissionMaterial visible obliga a la escena a capturar todo lo que
 * hay detrás una vez por frame, y estos cuatro bloques están quietos. Llevan
 * el acabado de .nxr-paso-card: fondo semitransparente + backdrop-filter.
 */
const BLOQUES = [
  {
    k: "b1",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    ),
  },
  {
    k: "b2",
    color: "var(--c-salmon)",
    bg: "rgba(255,157,125,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <path d="M17.5 14v7M14 17.5h7" />
      </svg>
    ),
  },
  {
    k: "b3",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    k: "b4",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5L21 21" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
  },
];

export default function DwhAeo() {
  const t = useTranslations("dwhAeo");
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useTitleReveal<HTMLHeadingElement>();

  useTextScramble(sectionRef, ".nxr-aeo-intro");

  return (
    <section id="nxr-dwh-aeo" ref={sectionRef}>
      <div className="nxr-aeo-inner">
        <div className="nxr-aeo-head nxr-reveal">
          <h2 className="nxr-section-h2" ref={titleRef}>
            {t("titulo1")}
            <br />
            <span className="nxr-gradient-text-lime">{t("titulo2")}</span>
          </h2>
          <p className="nxr-aeo-intro">{t("intro")}</p>
        </div>

        <div className="nxr-aeo-grid">
          {BLOQUES.map((b) => (
            <div className="nxr-aeo-card nxr-card" key={b.k}>
              <div className="nxr-aeo-icon" style={{ background: b.bg, color: b.color }}>
                {b.icon}
              </div>
              <h3 className="nxr-aeo-card-title">{t(`${b.k}t`)}</h3>
              <p className="nxr-aeo-card-desc">{t(`${b.k}d`)}</p>
            </div>
          ))}
        </div>

        <p className="nxr-aeo-cierre nxr-reveal">{t("cierre")}</p>
      </div>
    </section>
  );
}
