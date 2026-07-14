"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import LogoLoop, { type LogoItem } from "./LogoLoop";
import { useCurvedWords } from "@/hooks/useCurvedWords";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Simple line-art glyphs in the same style as CapacidadesWeb's icon set
// (24x24, path-based, no brand colors baked in) — evoke each tool rather
// than reproduce its exact trademarked mark, same approach already used
// sitewide for every other icon (e.g. the SEO card's icon is a plain
// magnifying glass, not Google's logo).
const ICONS: Record<string, React.ReactNode> = {
  nextjs: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8v8M9 8l7 8" />
    </svg>
  ),
  react: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" />
    </svg>
  ),
  typescript: (
    <svg viewBox="0 0 24 24">
      <path d="M4 8l3-3 3 3M7 5v14" />
      <path d="M14 16.5c.6.7 1.4 1 2.3 1 1.3 0 2.2-.7 2.2-1.8 0-2.5-4-1.6-4-4.1 0-1.1.9-1.8 2.1-1.8.9 0 1.6.3 2.1.9" />
    </svg>
  ),
  nodejs: (
    <svg viewBox="0 0 24 24">
      <path d="M12 2l8 4.6v10.8L12 22l-8-4.6V6.6L12 2z" />
      <path d="M9 12h6M12 9v6" />
    </svg>
  ),
  tailwind: (
    <svg viewBox="0 0 24 24">
      <path d="M4 12c1-3 2.5-4.5 5.5-4.5S13 9 14 12c1 3 2.5 4.5 5.5 4.5S23 15 24 12" />
      <path d="M0 16c1-3 2.5-4.5 5.5-4.5S9 13 10 16c1 3 2.5 4.5 5.5 4.5S19 19 20 16" />
    </svg>
  ),
  vercel: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3l9 16H3z" />
    </svg>
  ),
  cloudflare: (
    <svg viewBox="0 0 24 24">
      <path d="M17 17.5H6a4 4 0 01-.6-7.95A5.5 5.5 0 0116 8.1a3.5 3.5 0 011 6.9" />
    </svg>
  ),
  resend: (
    <svg viewBox="0 0 24 24">
      <path d="M3 11l18-7-7 18-3-8-8-3z" />
    </svg>
  ),
  postgresql: (
    <svg viewBox="0 0 24 24">
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  ),
  supabase: (
    <svg viewBox="0 0 24 24">
      <path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z" />
    </svg>
  ),
  stripe: (
    <svg viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 9.5h20" />
    </svg>
  ),
};

const COLORS = ["var(--c-red)", "var(--c-lime)", "var(--c-salmon)"];

const STACK_ROW_1 = [
  { name: "Next.js", icon: "nextjs" },
  { name: "React", icon: "react" },
  { name: "TypeScript", icon: "typescript" },
  { name: "Node.js", icon: "nodejs" },
  { name: "Tailwind CSS", icon: "tailwind" },
  { name: "Vercel", icon: "vercel" },
];

const STACK_ROW_2 = [
  { name: "Cloudflare", icon: "cloudflare" },
  { name: "Resend", icon: "resend" },
  { name: "PostgreSQL", icon: "postgresql" },
  { name: "Supabase", icon: "supabase" },
  { name: "Stripe", icon: "stripe" },
];

function toLogoItems(items: typeof STACK_ROW_1, colorOffset: number): LogoItem[] {
  return items.map((t, i) => ({
    node: (
      <span className="nxr-dwh-tech-pill nxr-glass-edge">
        <span className="nxr-glass-edge-content nxr-dwh-tech-pill-inner">
          <span className="nxr-dwh-tech-icon" style={{ color: COLORS[(i + colorOffset) % COLORS.length] }}>
            {ICONS[t.icon]}
          </span>
          <span className="nxr-dwh-tech-name">{t.name}</span>
        </span>
      </span>
    ),
    ariaLabel: t.name,
  }));
}

export default function DwhTechStack() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  // Home-identity dynamic per-line bow on the title (rides the reveal's
  // word spans; the CSS tilt lives in the perspective-planes rule groups).
  useCurvedWords(sectionRef, ".nxr-section-h2", "left", [reducedMotion], {
    bowOnly: true,
    useExistingWords: true,
  });

  useGSAP(
    () => {
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const section = sectionRef.current;
      if (!section) return;

      const q = gsap.utils.selector(section);
      const rows = q(".nxr-dwh-tech-row");

      if (prefersReduced) {
        gsap.set(rows, { visibility: "visible" });
        return;
      }

      gsap.set(rows[0] ?? [], { opacity: 0, x: -80 });
      gsap.set(rows[1] ?? [], { opacity: 0, x: 80 });
      gsap.set(rows, { visibility: "visible" });

      gsap.to(rows, {
        opacity: 1,
        x: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-dwh-tech" className="nxr-dwh-tech" ref={sectionRef}>
      <div className="nxr-dwh-tech-inner nxr-reveal">
        <h2 className="nxr-section-h2" ref={titleRef}>
          Construido con las herramientas
          <br />
          <span className="nxr-gradient-text-lime">que de verdad importan.</span>
        </h2>
      </div>

      <div className="nxr-dwh-tech-row">
        <LogoLoop
          logos={toLogoItems(STACK_ROW_1, 0)}
          speed={60}
          direction="left"
          gap={20}
          fadeOut
          pauseOnHover
          scaleOnHover
          ariaLabel="Tecnologías de frontend y despliegue"
        />
      </div>
      <div className="nxr-dwh-tech-row">
        <LogoLoop
          logos={toLogoItems(STACK_ROW_2, 1)}
          speed={60}
          direction="right"
          gap={20}
          fadeOut
          pauseOnHover
          scaleOnHover
          ariaLabel="Tecnologías de backend e infraestructura"
        />
      </div>
    </section>
  );
}
