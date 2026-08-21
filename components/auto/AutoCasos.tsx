"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useTextScramble } from "@/hooks/useTextScramble";

/**
 * QUÉ SE AUTOMATIZA, por áreas del negocio.
 *
 * Seis bloques concretos en vez de una promesa genérica: cada uno nombra la
 * herramienta y el disparador reales, porque "automatizamos tus procesos" no
 * le dice nada a nadie y "el lead del formulario entra solo en el CRM" sí.
 *
 * Mismo acabado y mismas razones que DwhAeo: sin pin, sin scrub y sin cristal
 * volumétrico —seis tarjetas quietas no justifican una captura de transmisión
 * por frame—, con .nxr-card para el fondo desenfocado.
 */
const AREAS = [
  {
    k: "a1",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 17l5-5 4 3 8-8" />
        <path d="M15 7h5v5" />
      </svg>
    ),
  },
  {
    k: "a2",
    color: "var(--c-salmon)",
    bg: "rgba(255,157,125,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M6 2h9l4 4v16l-2.3-1.4-2.3 1.4-2.3-1.4L9.8 22l-2.3-1.4L6 22V2z" />
        <path d="M15 2v4h4M9.5 10h6M9.5 14h4" />
      </svg>
    ),
  },
  {
    k: "a3",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    ),
  },
  {
    k: "a4",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 11v2a1 1 0 001 1h2l4 4V6L6 10H4a1 1 0 00-1 1z" />
        <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
      </svg>
    ),
  },
  {
    k: "a5",
    color: "var(--c-salmon)",
    bg: "rgba(255,157,125,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 12l9 4 9-4M3 17l9 4 9-4" />
      </svg>
    ),
  },
  {
    k: "a6",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2.5" />
        <path d="M7.5 15.5v-3M12 15.5v-6M16.5 15.5v-4.5" />
      </svg>
    ),
  },
];

export default function AutoCasos() {
  const t = useTranslations("auto.casos");
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useTitleReveal<HTMLHeadingElement>();

  useTextScramble(sectionRef, ".nxr-auto-cs-intro");

  return (
    <section id="nxr-auto-casos" ref={sectionRef}>
      <div className="nxr-auto-cs-inner">
        <div className="nxr-auto-cs-head nxr-reveal">
          <h2 className="nxr-section-h2" ref={titleRef}>
            {t("titulo1")}
            <br />
            <span className="nxr-gradient-text-lime">{t("titulo2")}</span>
          </h2>
          <p className="nxr-auto-cs-intro">{t("intro")}</p>
        </div>

        <div className="nxr-auto-cs-grid">
          {AREAS.map((a) => (
            <div className="nxr-auto-cs-card nxr-card" key={a.k}>
              <div className="nxr-auto-cs-ico" style={{ background: a.bg, color: a.color }}>
                {a.icon}
              </div>
              <h3 className="nxr-auto-cs-t">{t(`${a.k}t`)}</h3>
              <p className="nxr-auto-cs-d">{t(`${a.k}d`)}</p>
              <span className="nxr-auto-cs-ej">{t(`${a.k}e`)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
