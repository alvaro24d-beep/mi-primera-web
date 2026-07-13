"use client";

import { useRef } from "react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useCurvedWords } from "@/hooks/useCurvedWords";

const FILA_1 = [
  { name: "OpenAI GPT-4", cat: "IA & LLMs", color: "#A8F04A" },
  { name: "n8n", cat: "Automatización", color: "#EF3D0D" },
  { name: "Supabase", cat: "Base de datos", color: "#A8F04A" },
  { name: "Claude AI", cat: "IA & LLMs", color: "#FF9D7D" },
  { name: "WordPress", cat: "CMS", color: "#EF3D0D" },
  { name: "React", cat: "Frontend", color: "#A8F04A" },
  { name: "Node.js", cat: "Backend", color: "#FF9D7D" },
  { name: "Stripe", cat: "Pagos", color: "#EF3D0D" },
  { name: "Pinecone", cat: "Vector DB", color: "#A8F04A" },
  { name: "WhatsApp API", cat: "Mensajería", color: "#FF9D7D" },
];

const FILA_2 = [
  { name: "PostgreSQL", cat: "Base de datos", color: "#A8F04A" },
  { name: "Gemini", cat: "IA & LLMs", color: "#EF3D0D" },
  { name: "Hostinger VPS", cat: "Infraestructura", color: "#FF9D7D" },
  { name: "Tailwind CSS", cat: "Frontend", color: "#A8F04A" },
  { name: "EasyPanel", cat: "DevOps", color: "#EF3D0D" },
  { name: "Redis", cat: "Caché", color: "#FF9D7D" },
  { name: "Firecrawl", cat: "Scraping", color: "#A8F04A" },
  { name: "Gmail API", cat: "Mensajería", color: "#EF3D0D" },
  { name: "Google Sheets", cat: "Datos", color: "#FF9D7D" },
  { name: "ManyChat", cat: "Automatización", color: "#A8F04A" },
];

function TechRow({ items }: { items: typeof FILA_1 }) {
  return (
    <>
      {items.map((t, i) => (
        <div className="nxr-tech-card" key={`${t.name}-${i}`}>
          <div className="nxr-tech-card-dot" style={{ background: t.color }}></div>
          <div>
            <div className="nxr-tech-card-name">{t.name}</div>
            <div className="nxr-tech-card-cat">{t.cat}</div>
          </div>
        </div>
      ))}
    </>
  );
}

export default function Tech() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);

  // Header paragraph curves like the concave backdrop (see useCurvedWords) —
  // it sits on the right half of the screen, so its right edge wraps forward.
  useCurvedWords(sectionRef, ".nxr-tech-header-right", "right");

  // Dynamic per-line bow on the (gradient) title too — see Proceso.tsx.
  useCurvedWords(sectionRef, ".nxr-section-h2", "left", [], { bowOnly: true, useExistingWords: true });

  return (
    <section id="nxr-tech" ref={sectionRef}>
      <div className="nxr-tech-inner nxr-reveal">
        <div className="nxr-tech-header">
          <div>
            <h2 className="nxr-section-h2" ref={titleRef}>
              Las herramientas
              <br />
              que <span className="nxr-gradient-text-salmon">hacen la magia.</span>
            </h2>
          </div>
          <p className="nxr-tech-header-right">
            Trabajamos con el stack más avanzado del mercado. No usamos tecnología por moda — cada herramienta está
            aquí porque resuelve un problema real mejor que cualquier alternativa.
          </p>
        </div>
      </div>

      <div className="nxr-marquee-wrap nxr-reveal">
        <div className="nxr-marquee-track">
          <TechRow items={FILA_1} />
          <TechRow items={FILA_1} />
        </div>
      </div>

      <div className="nxr-marquee-spacer"></div>

      <div className="nxr-marquee-wrap nxr-reveal">
        <div className="nxr-marquee-track nxr-marquee-track-rev">
          <TechRow items={FILA_2} />
          <TechRow items={FILA_2} />
        </div>
      </div>

      <div className="nxr-tech-strip">
        <div className="nxr-tech-strip-card nxr-reveal nxr-reveal-delay-1">
          <div className="nxr-tech-strip-num">
            20<span>+</span>
          </div>
          <div className="nxr-tech-strip-label">Tecnologías dominadas en producción real</div>
        </div>
        <div className="nxr-tech-strip-card nxr-reveal nxr-reveal-delay-2">
          <div className="nxr-tech-strip-num">
            100<span>%</span>
          </div>
          <div className="nxr-tech-strip-label">Proyectos entregados en plazo acordado</div>
        </div>
        <div className="nxr-tech-strip-card nxr-reveal nxr-reveal-delay-3">
          <div className="nxr-tech-strip-num">
            3<span>x</span>
          </div>
          <div className="nxr-tech-strip-label">ROI medio en el primer año de implantación</div>
        </div>
        <div className="nxr-tech-strip-card nxr-reveal nxr-reveal-delay-4">
          <div className="nxr-tech-strip-num">
            24<span>/7</span>
          </div>
          <div className="nxr-tech-strip-label">Sistemas funcionando sin intervención humana</div>
        </div>
      </div>
    </section>
  );
}
