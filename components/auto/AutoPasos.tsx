"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useTextScramble } from "@/hooks/useTextScramble";

/**
 * CÓMO SE MONTA — cuatro pasos, del mapeo al mantenimiento.
 *
 * Va después de los casos de uso a propósito: primero se entiende QUÉ se puede
 * automatizar y solo entonces interesa CÓMO se hace. Cierra con el paso que
 * más dudas resuelve —quién se ocupa cuando algo cambia— porque es la objeción
 * real de quien ya ha visto una automatización romperse.
 *
 * El número de cada paso NO es decorativo: es el hilo que hace que las cuatro
 * tarjetas se lean como una secuencia y no como cuatro ventajas sueltas.
 * Sección de lectura, sin pin ni scrub (ver la nota de DwhAeo).
 */
const PASOS = ["p1", "p2", "p3", "p4"] as const;

export default function AutoPasos() {
  const t = useTranslations("auto.pasos");
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useTitleReveal<HTMLHeadingElement>();

  useTextScramble(sectionRef, ".nxr-auto-ps-intro");

  return (
    <section id="nxr-auto-pasos" ref={sectionRef}>
      <div className="nxr-auto-ps-inner">
        <div className="nxr-auto-ps-head nxr-reveal">
          <h2 className="nxr-section-h2" ref={titleRef}>
            {t("titulo1")}
            <br />
            <span className="nxr-gradient-text-salmon">{t("titulo2")}</span>
          </h2>
          <p className="nxr-auto-ps-intro">{t("intro")}</p>
        </div>

        <ol className="nxr-auto-ps-grid">
          {PASOS.map((k, i) => (
            <li className="nxr-auto-ps-card nxr-card" key={k}>
              <span className="nxr-auto-ps-num">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="nxr-auto-ps-t">{t(`${k}t`)}</h3>
              <p className="nxr-auto-ps-d">{t(`${k}d`)}</p>
            </li>
          ))}
        </ol>

        <p className="nxr-auto-ps-cierre nxr-reveal">{t("cierre")}</p>
      </div>
    </section>
  );
}
