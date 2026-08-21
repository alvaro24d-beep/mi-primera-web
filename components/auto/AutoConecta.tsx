"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import LogoLoop, { type LogoItem } from "@/components/LogoLoop";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * CON QUÉ SE CONECTA — las herramientas que se enlazan en un flujo.
 *
 * Reutiliza LogoLoop (React Bits, ya en el repo por DwhTechStack) en vez de
 * montar otra cinta: mismo componente, misma sensación de movimiento continuo
 * y cero código nuevo de animación. Las dos filas van en direcciones opuestas
 * para que la cinta no se lea como una sola línea larga.
 *
 * Los glifos EVOCAN cada herramienta, no reproducen su marca: son trazos de
 * 24×24 en el mismo estilo que el resto de iconos del sitio (misma decisión
 * documentada en DwhTechStack). Marcas registradas fuera.
 */
const ICONOS: Record<string, React.ReactNode> = {
  n8n: (
    <svg viewBox="0 0 24 24">
      <circle cx="4.5" cy="12" r="2" />
      <circle cx="12" cy="6.5" r="2" />
      <circle cx="12" cy="17.5" r="2" />
      <circle cx="19.5" cy="12" r="2" />
      <path d="M6.4 11.2l3.8-3.2M6.4 12.8l3.8 3.2M13.8 7.7l3.9 3M13.8 16.3l3.9-3" />
    </svg>
  ),
  make: (
    <svg viewBox="0 0 24 24">
      <circle cx="7.5" cy="12" r="4.5" />
      <circle cx="16.5" cy="12" r="4.5" />
    </svg>
  ),
  zapier: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
    </svg>
  ),
  sheets: (
    <svg viewBox="0 0 24 24">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M3.5 9.5h17M3.5 15h17M9.5 3.5v17" />
    </svg>
  ),
  gmail: (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7.5l9 6 9-6" />
    </svg>
  ),
  notion: (
    <svg viewBox="0 0 24 24">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8.5 16.5v-9l7 9v-9" />
    </svg>
  ),
  slack: (
    <svg viewBox="0 0 24 24">
      <path d="M9.5 3v12M14.5 9v12M3 14.5h12M9 9.5h12" />
    </svg>
  ),
  airtable: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3L3 7l9 4 9-4-9-4z" />
      <path d="M3 12l9 4 9-4M3 16.5l9 4 9-4" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24">
      <path d="M20.5 12a8.5 8.5 0 01-12.6 7.4L3.5 20.5l1.2-4.3A8.5 8.5 0 1120.5 12z" />
      <path d="M9 10c.5 1.9 2.1 3.5 4 4l1.1-1.3 1.9 1-.7 1.6c-2.7.4-6.2-2.8-6.8-6l1.6-.7 1 1.9L9 10z" />
    </svg>
  ),
  stripe: (
    <svg viewBox="0 0 24 24">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19M6 15h4" />
    </svg>
  ),
  hubspot: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="15" r="4" />
      <circle cx="18" cy="6" r="2.2" />
      <path d="M12 11V8.5M13.6 9.4l2.8-2" />
    </svg>
  ),
  shopify: (
    <svg viewBox="0 0 24 24">
      <path d="M5 8h14l-1.2 12.5H6.2L5 8z" />
      <path d="M8.5 8V6a3.5 3.5 0 017 0v2" />
    </svg>
  ),
  calendly: (
    <svg viewBox="0 0 24 24">
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4M9.5 15l2 2 3.5-3.5" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24">
      <path d="M21 4L3 11l6 2.2L20.5 4.5 11 14.5l-.4 5 3-3.4L18 19 21 4z" />
    </svg>
  ),
  drive: (
    <svg viewBox="0 0 24 24">
      <path d="M9 3h6l6 11h-6L9 3z" />
      <path d="M9 3L3 14l3 5 6-11M3 14h9l3 5H6" />
    </svg>
  ),
  ia: (
    <svg viewBox="0 0 24 24">
      <path d="M12 2.5l8.2 4.75v9.5L12 21.5 3.8 16.75v-9.5L12 2.5z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

const FILA_1 = ["n8n", "make", "zapier", "sheets", "gmail", "notion", "slack", "airtable"] as const;
const FILA_2 = ["whatsapp", "stripe", "hubspot", "shopify", "calendly", "telegram", "drive", "ia"] as const;

const NOMBRES: Record<string, string> = {
  n8n: "n8n",
  make: "Make",
  zapier: "Zapier",
  sheets: "Google Sheets",
  gmail: "Gmail",
  notion: "Notion",
  slack: "Slack",
  airtable: "Airtable",
  whatsapp: "WhatsApp",
  stripe: "Stripe",
  hubspot: "HubSpot",
  shopify: "Shopify",
  calendly: "Calendly",
  telegram: "Telegram",
  drive: "Google Drive",
  ia: "OpenAI · Claude",
};

function aLogos(claves: readonly string[]): LogoItem[] {
  return claves.map((k) => ({
    node: (
      <span className="nxr-auto-tool-pill">
        <span className="nxr-auto-tool-inner">
          <span className="nxr-auto-tool-ico">{ICONOS[k]}</span>
          <span className="nxr-auto-tool-name">{NOMBRES[k]}</span>
        </span>
      </span>
    ),
  }));
}

export default function AutoConecta() {
  const t = useTranslations("auto.conecta");
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const q = gsap.utils.selector(section);
      const filas = q(".nxr-auto-tool-row");

      // Suelo anti-flash: las filas están ocultas por CSS hasta que este efecto
      // fija su estado inicial. Con reduced motion se limitan a hacerse
      // visibles, sin desplazamiento.
      if (reducedMotion) {
        gsap.set(filas, { visibility: "visible" });
        return;
      }

      gsap.set(filas[0] ?? [], { opacity: 0, x: -80 });
      gsap.set(filas[1] ?? [], { opacity: 0, x: 80 });
      gsap.set(filas, { visibility: "visible" });
      gsap.to(filas, {
        opacity: 1,
        x: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: section, start: "top 80%", toggleActions: "play none none none" },
      });
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-auto-conecta" ref={sectionRef}>
      <div className="nxr-auto-tool-head nxr-reveal">
        <h2 className="nxr-section-h2" ref={titleRef}>
          {t("titulo1")}
          <br />
          <span className="nxr-gradient-text-lime">{t("titulo2")}</span>
        </h2>
        <p className="nxr-auto-tool-intro">{t("intro")}</p>
      </div>

      <div className="nxr-auto-tool-row">
        <LogoLoop
          logos={aLogos(FILA_1)}
          speed={58}
          direction="left"
          gap={20}
          fadeOut
          pauseOnHover
          scaleOnHover
          ariaLabel={t("aria1")}
        />
      </div>
      <div className="nxr-auto-tool-row">
        <LogoLoop
          logos={aLogos(FILA_2)}
          speed={58}
          direction="right"
          gap={20}
          fadeOut
          pauseOnHover
          scaleOnHover
          ariaLabel={t("aria2")}
        />
      </div>

      <p className="nxr-auto-tool-cierre nxr-reveal">{t("cierre")}</p>
    </section>
  );
}
