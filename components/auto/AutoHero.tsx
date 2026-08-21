"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { recorridoPin } from "@/lib/scrollRitmo";

gsap.registerPlugin(ScrollTrigger);

/**
 * REGLA DE ORO (AGENTS.md): la animación REPRESENTA el servicio.
 *
 * Aquí la historia es literalmente un flujo de automatización montándose y
 * echándose a andar: llega un pedido, se leen sus datos, una IA decide qué es
 * y salen tres acciones a la vez (CRM, aviso al cliente, factura). Quien mira
 * sin leer una palabra ve un editor tipo n8n construyéndose solo y ejecutando
 * —que es exactamente lo que se vende en esta página.
 *
 * POR QUÉ NO LLEVA UN `<Canvas>` PROPIO, teniendo AGENTS.md el 3D por defecto:
 * el mismo motivo por el que el hero de /seo tampoco lo lleva. La profundidad
 * la da la perspectiva CSS del contenedor (el panel entra tumbado y se
 * asienta) y detrás sigue estando la escena WebGL global, que es la que pone
 * el volumen de la página. Un segundo canvas aquí sumaría otra cadena de
 * render en móvil justo después de la ronda de trabajo que se fue en bajar el
 * coste del cristal, y la escena que pide esta página —un diagrama de nodos
 * con texto legible— es de las pocas que el DOM hace MEJOR que el 3D: el texto
 * queda nítido a cualquier tamaño, es seleccionable y accesible.
 *
 * Geometría: los extremos de cada conexión son los MISMOS puntos fraccionales
 * del viewBox (400×230, `preserveAspectRatio: none`) en los que se centran los
 * nodos del DOM (left/top en % + translate(-50%,-50%)). Así las líneas llegan
 * al centro de cada nodo con cualquier proporción de panel, sin recalcular
 * nada al redimensionar. Es la misma técnica de la card de automatización de
 * la home (FlowAnim en Servicios.tsx).
 */

// x/y en unidades del viewBox 400×230, para poder escribir a la vez el `d` de
// las conexiones y el left/top de los nodos desde los MISMOS números.
const VB_W = 400;
const VB_H = 230;

type Nodo = {
  k: string;
  x: number;
  y: number;
  tono?: "trigger" | "ia";
  icon: React.ReactNode;
};

const NODOS: Nodo[] = [
  {
    k: "n0",
    x: 42,
    y: 115,
    tono: "trigger",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" />
      </svg>
    ),
  },
  {
    k: "n1",
    x: 152,
    y: 115,
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    k: "n2",
    x: 258,
    y: 115,
    tono: "ia",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
        <path d="M18.5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9z" />
      </svg>
    ),
  },
  {
    k: "n3",
    x: 360,
    y: 36,
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19a5.5 5.5 0 0111 0" />
        <path d="M16 8.5h5M16 12h4" />
      </svg>
    ),
  },
  {
    k: "n4",
    x: 360,
    y: 115,
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M20.5 12a8.5 8.5 0 01-12.6 7.4L3.5 20.5l1.2-4.3A8.5 8.5 0 1120.5 12z" />
        <path d="M8.5 10.5c.6 2 2.4 3.8 4.4 4.4l1.2-1.4 2 1.1-.7 1.7c-2.9.5-6.6-2.9-7.3-6.4l1.7-.8 1.1 2-1.2 1.2" />
      </svg>
    ),
  },
  {
    k: "n5",
    x: 360,
    y: 194,
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M6 2h9l4 4v14.5l-2.3-1.4-2.3 1.4-2.3-1.4L9.8 20.5 7.5 19.1 6 20V2z" />
        <path d="M15 2v4h4M9.5 10h6M9.5 14h4" />
      </svg>
    ),
  },
];

// Mismos puntos, escritos como curvas: entrada recta por el tronco y tres
// salidas que se abren desde el nodo de IA.
const CONEXIONES = [
  "M42,115 L152,115",
  "M152,115 L258,115",
  "M258,115 C305,115 313,36 360,36",
  "M258,115 L360,115",
  "M258,115 C305,115 313,194 360,194",
];

// Recorridos completos (tronco + una salida) para los pulsos: un paquete de
// datos entra por el disparador y sale por una de las tres ramas.
const RUTAS = [
  "M42,115 L152,115 L258,115 C305,115 313,36 360,36",
  "M42,115 L152,115 L258,115 L360,115",
  "M42,115 L152,115 L258,115 C305,115 313,194 360,194",
];

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

function Nodo({ n, t }: { n: Nodo; t: (k: string) => string }) {
  return (
    <div
      className={`nxr-auto-node${n.tono ? ` -${n.tono}` : ""}`}
      style={{ left: pct(n.x, VB_W), top: pct(n.y, VB_H) }}
    >
      <span className="nxr-auto-node-ico">{n.icon}</span>
      <span className="nxr-auto-node-txt">
        <b>{t(`${n.k}t`)}</b>
        <small>{t(`${n.k}s`)}</small>
      </span>
    </div>
  );
}

/**
 * Pulsos SMIL: viajan por las rutas completas sin coste de JS ni de rAF, y el
 * navegador los pausa solo cuando la pestaña no está visible. Van dentro de un
 * grupo con opacidad 0 que la línea de tiempo enciende cuando el flujo ya está
 * montado — el SMIL corre desde el principio, pero no se ve hasta entonces.
 */
function Pulsos() {
  const cfg = [
    { ruta: 0, dur: "2.4s", begin: "0s", r: 3.4, lima: false },
    { ruta: 1, dur: "2.1s", begin: "0.7s", r: 3, lima: true },
    { ruta: 2, dur: "2.6s", begin: "1.3s", r: 3.2, lima: false },
    { ruta: 1, dur: "2.3s", begin: "1.9s", r: 2.8, lima: true },
  ];
  return (
    <g className="nxr-auto-pulses">
      {cfg.map((c, i) => (
        <circle key={i} className={`nxr-auto-pulse${c.lima ? " -lime" : ""}`} r={c.r}>
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.06;0.9;1"
            dur={c.dur}
            begin={c.begin}
            repeatCount="indefinite"
          />
          <animateMotion dur={c.dur} begin={c.begin} repeatCount="indefinite" path={RUTAS[c.ruta]} />
        </circle>
      ))}
    </g>
  );
}

function PanelInterior({ t, estatico }: { t: (k: string) => string; estatico: boolean }) {
  return (
    <>
      <div className="nxr-auto-bar">
        <span className="nxr-auto-file">{t("archivo")}</span>
        <span className="nxr-auto-live">
          <i />
          {t("activo")}
        </span>
      </div>

      <div className="nxr-auto-canvas">
        {/* El PLANO es el sistema de coordenadas compartido: el SVG lo cubre
            entero y los nodos se posicionan en % de ESTE mismo cuadro. El
            acolchado del lienzo que lo envuelve es lo que deja sitio a los
            nodos de los extremos para asomar sin salirse del panel. */}
        <div className="nxr-auto-plane">
          <svg className="nxr-auto-svg" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden="true">
            {CONEXIONES.map((d, i) => (
              <path key={i} className="nxr-auto-conn" d={d} />
            ))}
            {!estatico && <Pulsos />}
          </svg>
          {NODOS.map((n) => (
            <Nodo key={n.k} n={n} t={t} />
          ))}
        </div>
      </div>

      <div className="nxr-auto-stats">
        <span className="nxr-auto-stat">
          <b className="nxr-auto-ejec">{estatico ? "1.284" : "0"}</b>
          {t("ejec")}
        </span>
        <span className="nxr-auto-stat">
          <b className="nxr-auto-horas">{estatico ? "96 h" : "0 h"}</b>
          {t("horas")}
        </span>
        <span className="nxr-auto-stat -ok">
          <b>0</b>
          {t("errores")}
        </span>
      </div>
    </>
  );
}

export default function AutoHero() {
  const t = useTranslations("auto.hero");
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Igual que --seo-vh / --dwh-vh: Safari y Chrome discrepan sobre 100lvh en
  // móvil, así que la altura del stage se ancla a esta variable. Viva en
  // resize, que es seguro porque ScrollTrigger ignora los resizes de toolbar
  // (ignoreMobileResize en SmoothScroll).
  useEffect(() => {
    const set = () => document.documentElement.style.setProperty("--auto-vh", `${window.innerHeight}px`);
    set();
    window.addEventListener("resize", set, { passive: true });
    return () => {
      window.removeEventListener("resize", set);
      // Se escribe en <html>, que PERSISTE entre rutas: sin este
      // removeProperty seguiría viva —y congelada— en el resto del sitio.
      document.documentElement.style.removeProperty("--auto-vh");
    };
  }, []);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;

      const q = gsap.utils.selector(section);
      const head = q(".nxr-auto-head")[0] as HTMLElement | undefined;
      const wrap = q(".nxr-auto-wrap")[0] as HTMLElement | undefined;
      const nodos = q(".nxr-auto-node") as HTMLElement[];
      const conns = q(".nxr-auto-conn") as unknown as SVGPathElement[];
      const pulsos = q(".nxr-auto-pulses")[0] as unknown as SVGGElement | undefined;
      const live = q(".nxr-auto-live")[0] as HTMLElement | undefined;
      const sello = q(".nxr-auto-stamp")[0] as HTMLElement | undefined;
      const fileEl = q(".nxr-auto-file")[0] as HTMLElement | undefined;
      const ejecEl = q(".nxr-auto-ejec")[0] as HTMLElement | undefined;
      const horasEl = q(".nxr-auto-horas")[0] as HTMLElement | undefined;

      // El nombre del flujo se teclea con el mecanismo compartido de spans por
      // carácter (visibility, cero reflow) — el mismo del titular de la home y
      // del hero de /seo.
      const twChars: HTMLElement[] = [];
      if (fileEl) {
        const texto = fileEl.textContent ?? "";
        fileEl.textContent = "";
        for (const ch of texto) {
          const s = document.createElement("span");
          s.className = "nxr-zp-tw";
          s.textContent = ch === " " ? " " : ch;
          fileEl.appendChild(s);
          twChars.push(s);
        }
      }

      // Suelo CSS (receta de Bug-Log-Pin-Nace-Con-Scroll-Viejo): el panel está
      // oculto por CSS hasta que este efecto fija su estado inicial, así no hay
      // flash del estado final en navegaciones de cliente.
      gsap.set(wrap ?? {}, { visibility: "visible", autoAlpha: 0 });
      gsap.set(nodos, { autoAlpha: 0, scale: 0.6 });
      gsap.set(pulsos ?? {}, { autoAlpha: 0 });
      const largos = conns.map((c) => c.getTotalLength());
      conns.forEach((c, i) => gsap.set(c, { strokeDasharray: largos[i], strokeDashoffset: largos[i] }));

      const vh = () => window.innerHeight;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: recorridoPin("autoHero"),
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // ===== A — el titular sale recto hacia arriba =====
      tl.to(head ?? {}, { y: () => -vh() * 0.9, autoAlpha: 0, duration: 1.1, ease: "power2.in" }, 0);

      // ===== B — el editor entra tumbado y se asienta =====
      tl.fromTo(
        wrap ?? {},
        { autoAlpha: 0, y: () => vh() * 0.55, rotateX: 22, scale: 0.88 },
        { autoAlpha: 1, y: 0, rotateX: 3, scale: 1, duration: 1.2, ease: "power2.out" },
        0.7
      );

      // ===== C — se teclea el nombre del flujo =====
      const twProxy = { n: 0 };
      let twShown = -1;
      tl.to(
        twProxy,
        {
          n: twChars.length,
          duration: 0.6,
          ease: "none",
          onUpdate: () => {
            const k = Math.round(twProxy.n);
            if (k === twShown) return;
            twShown = k;
            twChars.forEach((c, i) => c.classList.toggle("nxr-zp-tw-on", i < k));
          },
        },
        1.25
      );

      // ===== D — el flujo se monta nodo a nodo: disparador, tronco y las tres
      // salidas abriéndose a la vez =====
      const pop = (i: number, at: number) =>
        tl.to(nodos[i] ?? {}, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, at);
      const draw = (i: number, at: number, dur = 0.4) =>
        tl.to(conns[i] ?? {}, { strokeDashoffset: 0, duration: dur, ease: "power1.inOut" }, at);

      pop(0, 1.9);
      draw(0, 2.15);
      pop(1, 2.4);
      draw(1, 2.6);
      pop(2, 2.85);
      draw(2, 3.15, 0.5);
      draw(3, 3.15, 0.5);
      draw(4, 3.15, 0.5);
      pop(3, 3.55);
      pop(4, 3.65);
      pop(5, 3.75);

      // ===== E — EN MARCHA: los paquetes empiezan a circular, el indicador se
      // enciende y los contadores suben =====
      tl.to(pulsos ?? {}, { autoAlpha: 1, duration: 0.3 }, 4.15);
      if (live) tl.to(live, { autoAlpha: 1, duration: 0.3 }, 4.15);
      const nums = { ejec: 0, horas: 0 };
      tl.to(
        nums,
        {
          ejec: 1284,
          horas: 96,
          duration: 1.5,
          ease: "power1.out",
          onUpdate: () => {
            if (ejecEl) ejecEl.textContent = Math.round(nums.ejec).toLocaleString("es-ES");
            if (horasEl) horasEl.textContent = `${Math.round(nums.horas)} h`;
          },
        },
        4.2
      );

      // ===== F — el sello: lo que queda en pantalla al soltar el pin =====
      tl.fromTo(
        sello ?? {},
        { autoAlpha: 0, scale: 0.2, rotate: -18 },
        { autoAlpha: 1, scale: 1, rotate: -8, duration: 0.5, ease: "back.out(2.2)" },
        5.35
      );
      tl.to({}, { duration: 0.5 }, 5.85);

      // Respiración idle, independiente del scroll (igual que la SERP de /seo).
      gsap.to(q(".nxr-auto-float"), { yPercent: -1.6, duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1 });

      // Navegación de cliente: catch-up instantáneo del scrub un frame después
      // del montaje (Bug-Log-Pin-Nace-Con-Scroll-Viejo).
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
    // Alternativa estática: el estado FINAL de la historia —el flujo ya
    // montado y con sus cifras—, sin pin y sin pulsos.
    return (
      <section key="static" id="nxr-auto-hero" ref={sectionRef} className="nxr-auto-static">
        <div className="nxr-auto-head">
          <h1 className="nxr-auto-h1">
            {t("h1a")}
            <br />
            <span className="nxr-gradient-text-lime">{t("h1b")}</span>
          </h1>
          <p className="nxr-auto-sub">{t("sub")}</p>
        </div>
        <div className="nxr-auto-wrap is-static">
          <div className="nxr-auto-panel">
            <PanelInterior t={t} estatico />
            <span className="nxr-auto-stamp">{t("sello")}</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section key="animated" id="nxr-auto-hero" ref={sectionRef}>
      <div className="nxr-auto-stage" ref={stageRef}>
        <div className="nxr-auto-head">
          <h1 className="nxr-auto-h1">
            {t("h1a")}
            <br />
            <span className="nxr-gradient-text-lime">{t("h1b")}</span>
          </h1>
          <p className="nxr-auto-sub">{t("sub")}</p>
        </div>

        <div className="nxr-auto-wrap">
          <div className="nxr-auto-float">
            <div className="nxr-auto-panel">
              <PanelInterior t={t} estatico={false} />
              <span className="nxr-auto-stamp">{t("sello")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
