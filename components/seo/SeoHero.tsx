"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { SeoDrive } from "./SerpScene";

gsap.registerPlugin(ScrollTrigger);

// La escena WebGL queda fuera del critical path igual que en las demás
// páginas: dynamic + ssr:false (ver CLAUDE.md, "Never statically import").
const SerpSceneLazy = dynamic(() => import("./SerpScene"), { ssr: false });

// REGLA DE ORO (AGENTS.md): la animación REPRESENTA el servicio. Aquí la
// historia es literal — una página de resultados de Google donde TU
// resultado escala posiciones hasta el #1 mientras las métricas suben; el
// terreno de barras 3D del fondo (SerpScene) asciende contigo. Un visitante
// entiende "esto es SEO" sin leer nada.

const COMPETIDORES = [
  { dominio: "inmobiliaria-lopez.com", titulo: "Reformas y obras en Madrid — Presupuestos" },
  { dominio: "obrasgarcia.es", titulo: "Empresa de reformas | Obras García" },
  { dominio: "reformasexpres.com", titulo: "Reformas express — Pide tu presupuesto" },
  { dominio: "empresa-reformas.net", titulo: "Reformas económicas en Madrid centro" },
];

const TUYO = { dominio: "tunegocio.es", titulo: "Reformas integrales en Madrid | Tu Negocio" };

function SerpRow({ r, tuyo }: { r: { dominio: string; titulo: string }; tuyo?: boolean }) {
  return (
    <article className={`nxr-seo-row${tuyo ? " is-tuyo" : ""}`}>
      <span className="nxr-seo-row-fav" aria-hidden="true" />
      <div className="nxr-seo-row-main">
        <span className="nxr-seo-row-url">{r.dominio}</span>
        <span className="nxr-seo-row-title">{r.titulo}</span>
        <span className="nxr-seo-row-desc" aria-hidden="true">
          <i />
          <i />
        </span>
      </div>
      {tuyo && <span className="nxr-seo-row-badge">TÚ</span>}
    </article>
  );
}

function SerpStats() {
  return (
    <div className="nxr-seo-stats">
      <div className="nxr-seo-stat">
        <span className="nxr-seo-stat-label">Impresiones</span>
        <span className="nxr-seo-stat-val nxr-seo-stat-imp">0</span>
      </div>
      <div className="nxr-seo-stat">
        <span className="nxr-seo-stat-label">Clics</span>
        <span className="nxr-seo-stat-val nxr-seo-stat-clics">0</span>
      </div>
      <div className="nxr-seo-stat">
        <span className="nxr-seo-stat-label">CTR</span>
        <span className="nxr-seo-stat-val nxr-seo-stat-ctr">0%</span>
      </div>
      <svg className="nxr-seo-spark" viewBox="0 0 120 36" aria-hidden="true">
        <polyline
          className="nxr-seo-spark-line"
          points="2,32 18,30 32,26 46,27 60,20 74,16 88,14 102,7 118,3"
          fill="none"
        />
      </svg>
    </div>
  );
}

export default function SeoHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  // Puente scroll→escena (patrón del ref de AGENTS.md): GSAP escribe el
  // progreso en este objeto plano estable; SerpScene lo lee en su useFrame
  // para el dolly/altura. useState-initializer y no useRef para poder
  // pasarlo como prop sin leer .current durante el render (regla
  // react-hooks/refs).
  const [drive] = useState<SeoDrive>(() => ({ p: 0 }));

  // Igual que --dwh-vh en DesarrolloWebHero: Safari y Chrome discrepan sobre
  // 100lvh en móvil, así que la altura del stage se ancla a esta variable
  // (viva en resize — seguro porque ScrollTrigger ignora los resizes de
  // toolbar vía ignoreMobileResize).
  useEffect(() => {
    const set = () => document.documentElement.style.setProperty("--seo-vh", `${window.innerHeight}px`);
    set();
    window.addEventListener("resize", set, { passive: true });
    return () => window.removeEventListener("resize", set);
  }, []);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;

      const q = gsap.utils.selector(section);
      const head = q(".nxr-seo-head")[0] as HTMLElement | undefined;
      const canvasWrap = q(".nxr-seo-canvas-wrap")[0] as HTMLElement | undefined;
      const serpWrap = q(".nxr-seo-serp-wrap")[0] as HTMLElement | undefined;
      const rows = q(".nxr-seo-row") as HTMLElement[];
      const tuyo = rows.find((r) => r.classList.contains("is-tuyo"));
      const rivales = rows.filter((r) => !r.classList.contains("is-tuyo"));
      const ranks = q(".nxr-seo-rank") as HTMLElement[];
      const stamp = q(".nxr-seo-stamp")[0] as HTMLElement | undefined;
      const spark = q(".nxr-seo-spark-line")[0] as unknown as SVGPolylineElement | undefined;
      const statImp = q(".nxr-seo-stat-imp")[0] as HTMLElement | undefined;
      const statClics = q(".nxr-seo-stat-clics")[0] as HTMLElement | undefined;
      const statCtr = q(".nxr-seo-stat-ctr")[0] as HTMLElement | undefined;
      const queryEl = q(".nxr-seo-query")[0] as HTMLElement | undefined;

      // La query se teclea carácter a carácter atada al scrub (mismo
      // mecanismo de spans pre-renderizados del typewriter del hero de la
      // home: visibility por carácter, cero reflow).
      const twChars: HTMLElement[] = [];
      if (queryEl) {
        const text = queryEl.textContent ?? "";
        queryEl.textContent = "";
        for (const ch of text) {
          const s = document.createElement("span");
          s.className = "nxr-zp-tw";
          s.textContent = ch === " " ? " " : ch;
          queryEl.appendChild(s);
          twChars.push(s);
        }
      }

      // CSS floor (receta de Bug-Log-Pin-Nace-Con-Scroll-Viejo): la SERP
      // permanece oculta por CSS hasta que este efecto fija su estado
      // inicial — sin flash del estado final en navegaciones cliente.
      gsap.set(serpWrap ?? {}, { visibility: "visible", autoAlpha: 0 });
      gsap.set(canvasWrap ?? {}, { opacity: 0 });

      const vh = () => window.innerHeight;
      // Altura de fila + gap, medida (function-based + invalidateOnRefresh:
      // los intercambios de posición son transforms exactos de N filas).
      const rowH = () => (rows[0] ? rows[0].offsetHeight + 10 : 74);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => (window.innerWidth < 768 ? "+=300%" : "+=340%"),
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      tl.eventCallback("onUpdate", () => {
        drive.p = tl.progress();
      });

      // ===== A — el titular sale recto hacia arriba (autoAlpha incluido:
      // el scrollhint vive en el mismo contenedor y sin fade se quedaba
      // pegado al borde superior durante todo el pin) =====
      tl.to(head ?? {}, { y: () => -vh() * 0.9, autoAlpha: 0, duration: 1.1, ease: "power2.in" }, 0);
      tl.to(canvasWrap ?? {}, { opacity: 1, duration: 0.7 }, 0.45);

      // ===== B — la SERP entra con perspectiva y se asienta =====
      tl.fromTo(
        serpWrap ?? {},
        { autoAlpha: 0, y: () => vh() * 0.55, rotateX: 24, scale: 0.88 },
        { autoAlpha: 1, y: 0, rotateX: 3, scale: 1, duration: 1.2, ease: "power2.out" },
        0.7
      );

      // ===== C — la búsqueda se teclea =====
      const twProxy = { n: 0 };
      let twShown = -1;
      tl.to(
        twProxy,
        {
          n: twChars.length,
          duration: 0.7,
          ease: "none",
          onUpdate: () => {
            const k = Math.round(twProxy.n);
            if (k === twShown) return;
            twShown = k;
            twChars.forEach((c, i) => c.classList.toggle("nxr-zp-tw-on", i < k));
          },
        },
        1.2
      );

      // ===== D — los resultados aparecen (tú, el último) =====
      tl.fromTo(
        rows,
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.11, ease: "power2.out" },
        1.95
      );
      tl.fromTo(
        q(".nxr-seo-stats"),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
        2.35
      );

      // ===== E — LA ESCALADA: tu fila intercambia posición con cada rival,
      // una a una, hasta el #1; las métricas suben con cada puesto. =====
      if (tuyo && rivales.length === 4) {
        for (let k = 0; k < 4; k++) {
          const at = 2.7 + k * 0.55;
          tl.to(tuyo, { y: () => -rowH() * (k + 1), duration: 0.5, ease: "power2.inOut" }, at);
          tl.to(rivales[3 - k], { y: () => rowH(), duration: 0.5, ease: "power2.inOut" }, at);
        }
      }
      const nums = { imp: 0, clics: 0, ctr: 0 };
      tl.to(
        nums,
        {
          imp: 12400,
          clics: 1840,
          ctr: 14.8,
          duration: 2.1,
          ease: "power1.in",
          onUpdate: () => {
            if (statImp) statImp.textContent = Math.round(nums.imp).toLocaleString("es-ES");
            if (statClics) statClics.textContent = Math.round(nums.clics).toLocaleString("es-ES");
            if (statCtr) statCtr.textContent = `${nums.ctr.toFixed(1).replace(".", ",")}%`;
          },
        },
        2.7
      );
      if (spark) {
        const len = spark.getTotalLength();
        tl.fromTo(
          spark,
          { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 2.1, ease: "none" },
          2.7
        );
      }

      // ===== F — coronación: el #1 se enciende y cae el sello =====
      tl.to(
        tuyo ?? {},
        {
          borderColor: "rgba(168, 240, 74, 0.55)",
          backgroundColor: "rgba(168, 240, 74, 0.07)",
          boxShadow: "0 0 34px rgba(168, 240, 74, 0.22)",
          duration: 0.35,
        },
        4.85
      );
      if (ranks[0]) tl.to(ranks[0], { color: "#a8f04a", duration: 0.35 }, 4.85);
      tl.fromTo(
        stamp ?? {},
        { autoAlpha: 0, scale: 0.2, rotate: -18 },
        { autoAlpha: 1, scale: 1, rotate: -8, duration: 0.5, ease: "back.out(2.2)" },
        5.0
      );

      // Hold final: lo que queda en pantalla al soltar el pin es el #1.
      tl.to({}, { duration: 0.5 }, 5.5);

      // Respiración idle de la SERP, independiente del scroll.
      gsap.to(q(".nxr-seo-float"), { yPercent: -1.6, duration: 3.8, ease: "sine.inOut", yoyo: true, repeat: -1 });

      // Navegación cliente: catch-up instantáneo del scrub un frame después
      // del montaje (receta completa en Bug-Log-Pin-Nace-Con-Scroll-Viejo).
      requestAnimationFrame(() => {
        const st = tl.scrollTrigger;
        if (!st) return;
        st.update();
        const scrubTween = typeof st.getTween === "function" ? st.getTween() : null;
        if (scrubTween) scrubTween.progress(1);
      });
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  if (reducedMotion) {
    // Alternativa estática: el estado FINAL de la historia (tu resultado ya
    // en el #1), sin pin ni canvas.
    return (
      <section key="static" id="nxr-seo-hero" ref={sectionRef} className="nxr-seo-static">
        <div className="nxr-seo-head">
          <h1 className="nxr-seo-h1">
            Que te encuentren
            <br />
            <span className="nxr-gradient-text-lime">en Google.</span>
          </h1>
          <p className="nxr-seo-sub">
            Posicionamos tu negocio donde buscan tus clientes: en los primeros resultados.
          </p>
        </div>
        <div className="nxr-seo-serp-wrap is-static">
          <div className="nxr-seo-serp nxr-glass-edge">
            <div className="nxr-glass-edge-content nxr-seo-serp-inner">
              <div className="nxr-seo-serp-top">
                <span className="nxr-seo-dot" />
                <span className="nxr-seo-dot" />
                <span className="nxr-seo-dot" />
                <div className="nxr-seo-searchbar">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M16.5 16.5L21 21" />
                  </svg>
                  <span className="nxr-seo-query">reformas integrales madrid</span>
                </div>
              </div>
              <div className="nxr-seo-serp-body">
                <div className="nxr-seo-ranks">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className="nxr-seo-rank" style={n === 1 ? { color: "var(--c-lime)" } : undefined}>
                      {n}
                    </span>
                  ))}
                </div>
                <div className="nxr-seo-rows">
                  <SerpRow r={TUYO} tuyo />
                  {COMPETIDORES.map((r) => (
                    <SerpRow key={r.dominio} r={r} />
                  ))}
                </div>
              </div>
              <SerpStats />
            </div>
            <span className="nxr-seo-stamp">POSICIÓN #1</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section key="animated" id="nxr-seo-hero" ref={sectionRef}>
      <div className="nxr-seo-stage" ref={stageRef}>
        <div className="nxr-seo-canvas-wrap" aria-hidden="true">
          <SerpSceneLazy drive={drive} />
        </div>

        <div className="nxr-seo-head">
          <h1 className="nxr-seo-h1">
            Que te encuentren
            <br />
            <span className="nxr-gradient-text-lime">en Google.</span>
          </h1>
          <p className="nxr-seo-sub">
            Posicionamos tu negocio donde buscan tus clientes: en los primeros resultados.
          </p>
          <span className="nxr-seo-scrollhint">Baja para subir posiciones</span>
        </div>

        <div className="nxr-seo-serp-wrap">
          <div className="nxr-seo-float">
            <div className="nxr-seo-serp nxr-glass-edge">
              <div className="nxr-glass-edge-content nxr-seo-serp-inner">
                <div className="nxr-seo-serp-top">
                  <span className="nxr-seo-dot" />
                  <span className="nxr-seo-dot" />
                  <span className="nxr-seo-dot" />
                  <div className="nxr-seo-searchbar">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M16.5 16.5L21 21" />
                    </svg>
                    <span className="nxr-seo-query">reformas integrales madrid</span>
                  </div>
                </div>
                <div className="nxr-seo-serp-body">
                  <div className="nxr-seo-ranks">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className="nxr-seo-rank">
                        {n}
                      </span>
                    ))}
                  </div>
                  <div className="nxr-seo-rows">
                    {COMPETIDORES.map((r) => (
                      <SerpRow key={r.dominio} r={r} />
                    ))}
                    <SerpRow r={TUYO} tuyo />
                  </div>
                </div>
                <SerpStats />
              </div>
              <span className="nxr-seo-stamp">POSICIÓN #1</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
