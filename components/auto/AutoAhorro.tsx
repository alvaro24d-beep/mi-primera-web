"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useTextScramble } from "@/hooks/useTextScramble";

gsap.registerPlugin(ScrollTrigger);

/**
 * ANTES / DESPUÉS — la sección que pone la cifra encima de la mesa.
 *
 * Es la respuesta a la única pregunta que se hace quien llega a una página de
 * automatizaciones: "¿esto qué me ahorra a mí?". Por eso son las MISMAS cinco
 * tareas en las dos columnas, alineadas fila a fila: se lee en horizontal y la
 * comparación se entiende sin leer los títulos.
 *
 * Sin pin ni scrub, como el resto de secciones de lectura del sitio (ver la
 * nota de DwhAeo): la página ya tiene el hero pineado. La única animación es
 * el contador de horas, que sube al entrar en pantalla y se rearma al salir
 * por arriba.
 */
const TAREAS = ["t1", "t2", "t3", "t4", "t5"] as const;

const HORAS = 14;

export default function AutoAhorro() {
  const t = useTranslations("auto.ahorro");
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const reducedMotion = useReducedMotion();

  useTextScramble(sectionRef, ".nxr-auto-ah-intro");

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      if (!section) return;
      const q = gsap.utils.selector(section);
      const cifra = q(".nxr-auto-ah-num")[0] as HTMLElement | undefined;
      if (!cifra) return;

      const proxy = { v: 0 };
      const pintar = () => (cifra.textContent = String(Math.round(proxy.v)));
      const reset = () => {
        gsap.killTweensOf(proxy);
        proxy.v = 0;
        pintar();
      };
      reset();

      ScrollTrigger.create({
        trigger: q(".nxr-auto-ah-total")[0] as HTMLElement,
        start: "top 85%",
        onEnter: () => gsap.to(proxy, { v: HORAS, duration: 1.3, ease: "power1.out", onUpdate: pintar }),
        onLeaveBack: reset,
      });
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-auto-ahorro" ref={sectionRef}>
      <div className="nxr-auto-ah-inner">
        <div className="nxr-auto-ah-head nxr-reveal">
          <h2 className="nxr-section-h2" ref={titleRef}>
            {t("titulo1")}
            <br />
            <span className="nxr-gradient-text-salmon">{t("titulo2")}</span>
          </h2>
          <p className="nxr-auto-ah-intro">{t("intro")}</p>
        </div>

        <div className="nxr-auto-ah-grid">
          <div className="nxr-auto-ah-col nxr-card nxr-card-lg -antes">
            <h3 className="nxr-auto-ah-col-t">{t("antes")}</h3>
            <ul>
              {TAREAS.map((k) => (
                <li key={k}>
                  <span className="nxr-auto-ah-tarea">{t(`${k}a`)}</span>
                  <span className="nxr-auto-ah-coste">{t(`${k}c`)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="nxr-auto-ah-col nxr-card nxr-card-lg -despues">
            <h3 className="nxr-auto-ah-col-t">{t("despues")}</h3>
            <ul>
              {TAREAS.map((k) => (
                <li key={k}>
                  <span className="nxr-auto-ah-check" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  <span className="nxr-auto-ah-tarea">{t(`${k}d`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="nxr-auto-ah-total nxr-card nxr-card-lg nxr-card-lime">
          <span className="nxr-auto-ah-num">{reducedMotion ? HORAS : 0}</span>
          <p className="nxr-auto-ah-total-d">{t("total")}</p>
        </div>
      </div>
    </section>
  );
}
