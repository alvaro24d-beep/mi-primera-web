"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useCurvedWords } from "@/hooks/useCurvedWords";
import { useGlassPanels } from "@/hooks/useGlassPanels";
import { useTextScramble } from "@/hooks/useTextScramble";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// V16.33 — los dos carruseles infinitos se sustituyen por la ESFERA DE
// HERRAMIENTAS: los mismos chips, distribuidos en una esfera 3D (fibonacci)
// que gira lentamente y, conforme se hace scroll con la sección pineada, se
// abre, se despliega y se APLANA hasta quedar en una retícula ordenada.

const TOOLS = [
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

const GOLDEN_ANGLE = 2.399963229728653;

export default function Tech() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const driftRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // The 4 stat cards become real volumetric fluid-glass meshes (same as
  // Intro/Proceso/Contacto — GlassPanelsLayer renders them; the DOM card is
  // just a transparent content shell + legibility scrim, see globals.css).
  // The sphere CHIPS stay CSS glass — see the comment on .nxr-tech-card.
  // `nxr-tech` is in SceneCanvas's observed-ids list; without that the
  // meshes would never be visible.
  useGlassPanels(sectionRef, ".nxr-tech-strip-card", "#12141c", [reducedMotion]);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      const stage = stageRef.current;
      const wrap = sphereRef.current;
      const drift = driftRef.current;
      if (!section || !stage || !wrap || !drift) return;
      const cards = Array.from(wrap.querySelectorAll<HTMLElement>(".nxr-tech-card"));
      if (!cards.length) return;
      const N = cards.length;

      // Estado del motor: p (0 esfera → 1 retícula plana) lo mueve un tween
      // POR TIEMPO (auto-play al centrar la esfera; V16.54 — antes lo escribía
      // el scrub del pin y "no quedaba fluido que se ralentizara al pasar").
      // rot avanza en el ticker y su influencia se desvanece con p.
      const state = { p: 0, rot: 0 };
      let sphereGeo: Array<{ yf: number; rf: number; lon: number }> = [];
      let gridGeo: Array<{ x: number; y: number }> = [];
      let R = 200;
      let measured = false;

      // Toda la geometría se recalcula en cada refresh de ScrollTrigger
      // (resize incluido) — nunca por frame: el render solo compone
      // transforms desde valores cacheados.
      const measure = () => {
        const W = wrap.clientWidth;
        const H = wrap.clientHeight;
        if (!W || !H) return;
        const isMobile = window.innerWidth <= 768;
        R = Math.min(W, H) * (isMobile ? 0.46 : 0.4);
        sphereGeo = Array.from({ length: N }, (_, i) => {
          const yf = 1 - (2 * (i + 0.5)) / N;
          return { yf, rf: Math.sqrt(Math.max(0, 1 - yf * yf)), lon: i * GOLDEN_ANGLE };
        });
        let maxW = 0;
        let maxH = 0;
        cards.forEach((c) => {
          maxW = Math.max(maxW, c.offsetWidth);
          maxH = Math.max(maxH, c.offsetHeight);
        });
        const cols = isMobile ? 3 : 5;
        const gap = isMobile ? 8 : 14;
        // En móvil la celda usa el ancho DISPONIBLE (los chips compactos
        // caben de sobra) para que la retícula nunca desborde el viewport.
        const cellW = isMobile ? Math.min(maxW + gap, (W - gap) / cols) : maxW + gap;
        const cellH = maxH + gap;
        const rows = Math.ceil(N / cols);
        gridGeo = Array.from({ length: N }, (_, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const inRow = Math.min(cols, N - r * cols);
          return { x: (c - (inRow - 1) / 2) * cellW, y: (r - (rows - 1) / 2) * cellH };
        });
        measured = true;
      };

      const ease = gsap.parseEase("power2.inOut");
      const render = () => {
        if (!measured) return;
        const e = ease(state.p);
        // Sin deriva (V16.54): la sección ya no está pineada, así que la
        // esfera/retícula viven centradas en su wrap y el disparo del
        // aplanado ocurre justo cuando ese centro está en el centro del
        // viewport — la retícula final queda centrada sin mover los chips.
        for (let i = 0; i < N; i++) {
          const s = sphereGeo[i];
          const lon = s.lon + state.rot;
          const x3 = R * s.rf * Math.sin(lon);
          const z3 = R * s.rf * Math.cos(lon);
          const y3 = R * s.yf * 0.82;
          // Profundidad 0 (detrás) → 1 (delante): escala/opacidad venden la
          // esfera sin 3D real por chip (billboard, texto siempre legible).
          const d = (z3 / R + 1) / 2;
          const ss = 0.62 + 0.48 * d;
          const so = 0.28 + 0.72 * d;
          const g = gridGeo[i];
          const x = x3 + (g.x - x3) * e;
          const y = y3 + (g.y - y3) * e;
          const sc = ss + (1 - ss) * e;
          const op = so + (1 - so) * e;
          const card = cards[i];
          card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(3)})`;
          card.style.opacity = op.toFixed(3);
          card.style.zIndex = String(200 + Math.round(z3));
        }
      };

      // APLANADO AUTOMÁTICO por TIEMPO (no scrubbeado): timeline en pausa que
      // se reproduce cuando la esfera llega al CENTRO del viewport (start
      // "center center" sobre el propio wrap). Así el scroll pasa fluido por
      // la sección — ya no se ralentiza. Se rebobina si vuelves a subir por
      // encima del centro, de modo que la animación puede volver a verse.
      const flat = gsap
        .timeline({ paused: true })
        .to(state, { p: 1, duration: 1.35, ease: "power2.inOut", onUpdate: render });
      ScrollTrigger.create({
        trigger: wrap,
        start: "center center",
        end: "bottom top",
        onEnter: () => flat.play(),
        onLeaveBack: () => flat.reverse(),
        onRefresh: () => {
          measure();
          render();
        },
      });

      // Giro idle de la esfera: solo con la sección cerca del viewport (IO)
      // y con influencia (1-p) — plana, deja de girar y el ticker no pinta.
      // El mismo IO alimenta .nxr-tech-far: a >120px del viewport los 20
      // chips siguen dentro del interest rect del compositor y cada
      // backdrop-filter paga su render pass por frame — apagados hasta que
      // la sección se acerca (globals.css), con 120px de colchón para que
      // el cambio nunca sea visible.
      let near = false;
      const io = new IntersectionObserver(([entry]) => {
        near = entry.isIntersecting;
        stage.classList.toggle("nxr-tech-far", !entry.isIntersecting);
      }, { rootMargin: "120px" });
      io.observe(stage);
      const spin = () => {
        if (!near || state.p > 0.995) return;
        state.rot += 0.0042 * (1 - state.p);
        render();
      };
      gsap.ticker.add(spin);

      measure();
      render();

      return () => {
        gsap.ticker.remove(spin);
        io.disconnect();
      };
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  // Split composition per breakpoint — see the twin comment in Proceso.tsx.
  // Safe to plane the header directly: the reveal lives on .nxr-tech-inner.
  useCurvedWords(sectionRef, ".nxr-tech-header", "left", [], {
    onlyBelow: 901,
    splitIgnore: ".nxr-section-h2",
  });
  useCurvedWords(sectionRef, ".nxr-tech-header-right", "right", [], { onlyAbove: 901 });
  // Scramble entrance on the section paragraph (the Intro-paragraph effect,
  // sitewide per request). AFTER the curved-words calls: reuses their spans.
  useTextScramble(sectionRef, ".nxr-tech-header-right");
  useCurvedWords(sectionRef, ".nxr-section-h2", "left", [], {
    onlyAbove: 901,
    bowOnly: true,
    useExistingWords: true,
  });

  return (
    <section id="nxr-tech" ref={sectionRef}>
      <div className="nxr-tech-stage" ref={stageRef}>
        <div className="nxr-tech-drift" ref={driftRef}>
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
                Trabajamos con el stack más avanzado del mercado. No usamos tecnología por moda — cada herramienta
                está aquí porque resuelve un problema real mejor que cualquier alternativa.
              </p>
            </div>
          </div>

          <div className={`nxr-tech-sphere-wrap${reducedMotion ? " is-static" : ""}`} ref={sphereRef}>
            {TOOLS.map((t) => (
              <div className="nxr-tech-card" key={t.name}>
                <div className="nxr-tech-card-dot" style={{ background: t.color }}></div>
                <div>
                  <div className="nxr-tech-card-name">{t.name}</div>
                  <div className="nxr-tech-card-cat">{t.cat}</div>
                </div>
              </div>
            ))}
          </div>
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
