"use client";

import { useEffect, useRef, useState } from "react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useGlassPanels } from "@/hooks/useGlassPanels";
import { useCurvedWords } from "@/hooks/useCurvedWords";

const PASOS = [
  {
    title: "Diagnóstico",
    desc: "Analizamos tu negocio, procesos y objetivos para identificar dónde la tecnología genera más impacto.",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    detail: [
      "Auditoría técnica y de negocio",
      "Entrevistas con los equipos implicados",
      "Informe de oportunidades priorizado",
    ],
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5L21 21" />
      </svg>
    ),
  },
  {
    title: "Estrategia",
    desc: "Diseñamos la hoja de ruta técnica: qué construir, en qué orden y con qué tecnologías.",
    color: "var(--c-salmon)",
    bg: "rgba(255,157,125,.15)",
    detail: ["Roadmap técnico por fases", "Stack y arquitectura definidos", "Estimación de tiempos y costes"],
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 16l5.447-2.724A1 1 0 0021 19.382V8.618a1 1 0 00-1.447-.894L15 10m0 10V10" />
      </svg>
    ),
  },
  {
    title: "Desarrollo",
    desc: "Construimos con sprints cortos y entregas frecuentes para que veas el avance desde el primer día.",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    detail: ["Sprints de 1-2 semanas", "Demo funcional en cada entrega", "Canal directo de feedback"],
    icon: (
      <svg viewBox="0 0 24 24">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: "Lanzamiento",
    desc: "Desplegamos, probamos en producción real y nos aseguramos de que todo funciona antes de abrir al público.",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    detail: [
      "Pruebas en entorno real",
      "Checklist de rendimiento y seguridad",
      "Acompañamiento el día del lanzamiento",
    ],
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4.5 16.5c-1.5 1.5-1.5 4.5 0 4.5s4.5-1.5 4.5-3L21 6a3 3 0 00-3-3L6 15c-1.5 0-3 1.5-1.5 1.5" />
      </svg>
    ),
  },
  {
    title: "Evolución",
    desc: "Monitorizamos, optimizamos y seguimos construyendo contigo. No desaparecemos tras el lanzamiento.",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    detail: ["Monitorización continua", "Iteración basada en datos reales", "Soporte y mejoras a largo plazo"],
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 12a9 9 0 109 9" />
        <path d="M3 12V6M3 12H9" />
        <path d="M21 12v6M21 12H15" />
      </svg>
    ),
  },
];

class Spark {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  life: number;
  decay: number;
  color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 2 + 1;
    this.speedX = (Math.random() - 0.3) * 3;
    this.speedY = (Math.random() - 0.5) * 4;
    this.life = 1;
    this.decay = Math.random() * 0.03 + 0.015;
    this.color = Math.random() > 0.4 ? "#a8f04a" : "#ef3d0d";
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= this.decay;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.life;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function Proceso() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pasoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tiltRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Volumetric fluid-glass behind each step card (flat variant of the
  // Servicios identity). The anchors are the buttons themselves — which is
  // also why the old pointer-tilt below is gone: a CSS-rotated anchor
  // reports an inflated axis-aligned rect, so the mesh would "breathe"
  // under the cursor while the glass stayed unrotated.
  useGlassPanels(sectionRef, ".nxr-paso-card", "#141018", []);

  // Header paragraph curves like the concave backdrop (see useCurvedWords) —
  // it sits on the right half of the screen, so its right edge wraps forward.
  useCurvedWords(sectionRef, ".nxr-proceso-header-right", "right");

  useEffect(() => {
    const track = trackRef.current;
    const progress = progressRef.current;
    const canvas = canvasRef.current;
    if (!track || !progress || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pasos = pasoRefs.current.filter(Boolean) as HTMLDivElement[];
    const totalPasos = pasos.length;
    let isMobile = window.innerWidth <= 900;
    let particles: Spark[] = [];
    let lastWidth = 0;

    function resizeCanvas() {
      canvas!.width = track!.offsetWidth;
      canvas!.height = track!.offsetHeight;
      isMobile = window.innerWidth <= 900;
    }
    window.addEventListener("resize", resizeCanvas, { passive: true });
    resizeCanvas();

    function emitSparks(targetX: number, count: number) {
      if (isMobile) return;
      const targetY = 28;
      for (let i = 0; i < count; i++) {
        particles.push(new Spark(targetX, targetY));
      }
    }

    let rafId = 0;
    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const currentWidth = parseFloat(progress!.style.width) || 0;
      const offsetLeft = progress!.offsetLeft;
      const currentTipX = offsetLeft + currentWidth;

      if (Math.abs(currentWidth - lastWidth) > 0.5 && currentWidth > 0) {
        emitSparks(currentTipX, 2);
      }
      lastWidth = currentWidth;

      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
          particles.splice(i, 1);
        } else {
          particles[i].draw(ctx!);
        }
      }
      rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);

    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("nxr-paso-active");
            else entry.target.classList.remove("nxr-paso-active");
          });
        },
        { threshold: 0, rootMargin: "0px 0px -45% 0px" }
      );
      pasos.forEach((paso) => io!.observe(paso));
    }

    function onScroll() {
      if (isMobile) return;

      const rect = track!.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.7;
      const end = vh * 0.3;
      const p = Math.max(0, Math.min(1, (start - rect.top) / (start - end + rect.height * 0.2)));

      const maxW = track!.offsetWidth * 0.8 - 8;
      const calculatedWidth = p * maxW;
      progress!.style.width = `${calculatedWidth}px`;

      pasos.forEach((paso, i) => {
        const threshold = (i / (totalPasos - 1)) * 0.9;
        if (p >= threshold) paso.classList.add("nxr-paso-active");
        else paso.classList.remove("nxr-paso-active");
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    // (The old pointer-driven CSS tilt on each card was removed with the move
    // to real volumetric glass: the tilting button is now the MESH ANCHOR,
    // and a CSS-rotated anchor reports an inflated axis-aligned rect that
    // made the glass swim under the cursor. Servicios remains the only
    // section with hover-tilt, where mesh and content rotate together.)

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io?.disconnect();
      particles = [];
    };
  }, []);

  return (
    <section id="nxr-proceso" ref={sectionRef}>
      <div className="nxr-proceso-inner">
        <div className="nxr-proceso-header nxr-reveal">
          <div>
            <p className="nxr-section-label">Cómo trabajamos</p>
            <h2 className="nxr-section-h2" ref={titleRef}>
              Un proceso claro,
              <br />
              <span className="nxr-gradient-text-lime">sin sorpresas.</span>
            </h2>
          </div>
          <p className="nxr-proceso-header-right">
            Cada proyecto sigue la misma metodología: entender bien antes de construir, construir rápido y mejorar
            siempre. Sin reuniones infinitas, sin presupuestos que se disparan. Toca cada paso para ver el detalle.
          </p>
        </div>

        <div className="nxr-proceso-track" ref={trackRef}>
          <div id="nxr-proceso-progress" ref={progressRef}></div>
          <canvas id="nxr-proceso-sparks" ref={canvasRef}></canvas>
          {PASOS.map((p, i) => {
            const isOpen = expanded === i;
            const titleId = `nxr-paso-title-${i}`;
            const detailId = `nxr-paso-detail-${i}`;
            return (
              <div
                className="nxr-paso"
                key={p.title}
                ref={(el) => {
                  pasoRefs.current[i] = el;
                }}
              >
                <div className="nxr-paso-num">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                </div>

                <div className="nxr-paso-tilt">
                  <button
                    type="button"
                    className="nxr-paso-card"
                    ref={(el) => {
                      tiltRefs.current[i] = el;
                    }}
                    aria-expanded={isOpen}
                    aria-controls={detailId}
                    onClick={() => setExpanded((cur) => (cur === i ? null : i))}
                  >
                    <div className="nxr-paso-icon" style={{ background: p.bg, color: p.color }}>
                      {p.icon}
                    </div>
                    <div className="nxr-paso-title" id={titleId}>
                      {p.title}
                    </div>
                    <p className="nxr-paso-desc">{p.desc}</p>
                    <svg className={`nxr-paso-chevron${isOpen ? " nxr-open" : ""}`} viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  <div
                    id={detailId}
                    className={`nxr-paso-detail${isOpen ? " nxr-open" : ""}`}
                    role="region"
                    aria-labelledby={titleId}
                  >
                    <div className="nxr-paso-detail-inner">
                      <ul className="nxr-paso-detail-list">
                        {p.detail.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
