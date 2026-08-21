"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGlassPanels } from "@/hooks/useGlassPanels";
import SiriSplash from "./aia/SiriSplash";

gsap.registerPlugin(ScrollTrigger);

// /agentes-ia hero (V16.0, PODADO en V16.98): a pinned, scroll-scrubbed
// re-enactment of an AI agent resolving a real request end to end (golden
// rule: the animation SHOWS the service). ONE CSS grid lays out the
// pipeline — customer chat | tools (desktop) / columna única (mobile) — so
// overlap is impossible by construction.
//
// V16.98 ("quita los dibujos del circuito… muy cutres" / "quita el botón"):
// fuera el canvas AgentScene entero (núcleo-chip + haces + pulsos) con su
// maquinaria de medición de anclas, y fuera el CTA "Quiero mi agente". La
// historia la cuentan el chat y las herramientas solos. Antes del titular,
// un SPLASH de entrada (onda Siri, components/aia/SiriSplash.tsx) aparece
// ~1s con fundido difuminado y da paso al h1; y un indicador "Desliza"
// acompaña la animación pineada. Chat y tools siguen siendo anclas de
// cristal del SceneCanvas global (`nxr-aia-hero` está en alwaysIds).

const FACETS = [
  { title: "Escucha", desc: "Entiende a tus clientes en lenguaje natural, por web o WhatsApp.", color: "var(--c-salmon)" },
  { title: "Decide", desc: "Razona la petición y elige qué herramienta usar en cada paso.", color: "var(--c-lime)" },
  { title: "Actúa", desc: "Consulta tu agenda, registra al cliente y envía la confirmación. Solo.", color: "var(--c-red)" },
  { title: "Resuelve", desc: "Cierra la gestión y responde en segundos, a cualquier hora del día.", color: "var(--c-lime)" },
];

const TOOLS = [
  {
    title: "Agenda",
    status: "Mañana 20:00 · libre",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M3 9h18M8 2v4M16 2v4M8 14h3" />
      </svg>
    ),
  },
  {
    title: "CRM",
    status: "Cliente registrado",
    color: "var(--c-salmon)",
    bg: "rgba(255,157,125,.12)",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    title: "Confirmación",
    status: "WhatsApp enviado",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
];

const MSG_IN = "Hola 👋 ¿Tenéis mesa para 4 mañana a las 20:00?";
const MSG_OUT = "¡Sí! Mesa para 4 reservada mañana a las 20:00 ✅ Te acabo de enviar la confirmación por WhatsApp.";

const AgentAvatar = (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M16.9 16.9l1.5 1.5M5.6 18.4l1.4-1.4M16.9 7.1l1.5-1.5" />
  </svg>
);

function ChatPanel({ static: isStatic }: { static?: boolean }) {
  return (
    <div className="nxr-aia-chat">
      <div className="nxr-aia-chat-inner">
        <div className="nxr-aia-chat-head">
          <span className="nxr-aia-chat-avatar">{AgentAvatar}</span>
          <span className="nxr-aia-chat-id">
            <span className="nxr-aia-chat-name">Agente de arcfine</span>
            <span className="nxr-aia-chat-online">
              <i />
              En línea · responde al momento
            </span>
          </span>
        </div>
        <div className="nxr-aia-msg nxr-aia-msg-in">
          {MSG_IN}
          <span className="nxr-aia-msg-meta">21:47</span>
        </div>
        {/* The typing indicator OVERLAYS the reply's slot (absolute inside
            it): they crossfade with zero layout shift, so the panel height
            never changes mid-scrub and the glass mesh never chases it. The
            slot is sized BY the reply message itself (it's in flow) — the
            panel is exactly as tall as its resolved content, no dead space. */}
        <div className="nxr-aia-reply-slot">
          {!isStatic && (
            <div className="nxr-aia-typing" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          )}
          <div className="nxr-aia-msg nxr-aia-msg-out">
            {MSG_OUT}
            <span className="nxr-aia-msg-meta">21:47 ✓✓</span>
          </div>
        </div>
        <div className="nxr-aia-badge">
          <svg viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Gestión completada en 8 segundos
        </div>
      </div>
    </div>
  );
}

function Tools() {
  return (
    <div className="nxr-aia-tools">
      {TOOLS.map((t) => (
        <div key={t.title} className="nxr-aia-tool">
          <span className="nxr-aia-tool-inner">
            <span className="nxr-aia-tool-icon" style={{ color: t.color, background: t.bg }}>
              {t.icon}
            </span>
            <span className="nxr-aia-tool-txt">
              <span className="nxr-aia-tool-title">{t.title}</span>
              <span className="nxr-aia-tool-status">{t.status}</span>
            </span>
            <span className="nxr-aia-tool-check">
              <svg viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AgentesIaHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // El splash Siri vive solo durante la entrada; al desmontarlo se libera
  // su contexto WebGL (ver SiriSplash.tsx).
  const [splashDone, setSplashDone] = useState(false);
  const reducedMotion = useReducedMotion();

  // Volumetric fluid glass from the global SceneCanvas on the story's
  // surfaces (anchors stay transparent DOM shells — the mesh IS the glass).
  useGlassPanels(sectionRef, ".nxr-aia-chat", "#10141c", [reducedMotion]);
  useGlassPanels(sectionRef, ".nxr-aia-tool", "#12161c", [reducedMotion]);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;

      const q = gsap.utils.selector(section);
      const head = q(".nxr-aia-head")[0] as HTMLElement | undefined;
      const chat = q(".nxr-aia-chat")[0] as HTMLElement | undefined;
      const tools = q(".nxr-aia-tool") as HTMLElement[];
      const checks = q(".nxr-aia-tool-check") as HTMLElement[];
      const msgIn = q(".nxr-aia-msg-in")[0] as HTMLElement | undefined;
      const typing = q(".nxr-aia-typing")[0] as HTMLElement | undefined;
      const msgOut = q(".nxr-aia-msg-out")[0] as HTMLElement | undefined;
      const badge = q(".nxr-aia-badge")[0] as HTMLElement | undefined;
      const mobile = window.innerWidth < 768;

      // Same Safari/Chrome `100lvh` disagreement fix as DesarrolloWebHero:
      // one real innerHeight measurement drives the mobile stage height.
      if (mobile) section.style.setProperty("--aia-vh", `${window.innerHeight}px`);

      // ---- Title intro: big at mid-height, then exits STRAIGHT UP while
      // the pipeline rises in (same family gesture as /desarrollo-web V15.88).
      // Escala ADAPTATIVA y RE-AJUSTABLE (V16.97, "que se vea bien en el
      // viewport"): la 1.6 fija proyectaba el titular a 1843px en un
      // viewport de 1280 (medido: se cortaba "por ti,"). El tope pasa a ser
      // el que hace caber la LÍNEA más ancha del h1 con margen — y se
      // recalcula cuando cargan las fuentes (medir con el fallback, más
      // estrecho que Rajdhani, daba una escala optimista que luego
      // desbordaba). El tween de salida es function-based y el refresh del
      // ScrollTrigger lo re-captura.
      const h1El = q(".nxr-aia-h1")[0] as HTMLElement | undefined;
      const vh = window.innerHeight;
      const restTop = head ? parseFloat(getComputedStyle(head).top) || 44 : 44;
      let hh = head ? head.offsetHeight : 120;
      let S = 1;
      const fitTitle = () => {
        if (!head) return;
        let textW = 600;
        if (h1El) {
          const rg = document.createRange();
          rg.selectNodeContents(h1El);
          // Los rects del Range incluyen la escala ya aplicada al head en
          // re-ejecuciones — dividir por ella devuelve el ancho de layout.
          const curScale = (gsap.getProperty(head, "scaleX") as number) || 1;
          const w = rg.getBoundingClientRect().width / curScale;
          if (w) textW = w;
        }
        hh = head.offsetHeight;
        S = Math.min(mobile ? 1.2 : 1.6, Math.max(1, (window.innerWidth - (mobile ? 40 : 120)) / textW));
        gsap.set(head, { transformOrigin: "left top", scale: S, y: vh / 2 - restTop - (hh * S) / 2 });
      };
      fitTitle();

      // ---- Hidden start states. The same waiting poses also exist as a CSS
      // floor (see globals.css) so no init race can ever paint the resolved
      // scene — these inline sets simply take over from it.
      gsap.set(chat ?? [], { opacity: 0, y: 36 });
      gsap.set(msgIn ?? [], { opacity: 0, y: 14, filter: "blur(8px)" });
      gsap.set(typing ?? [], { opacity: 0 });
      gsap.set(msgOut ?? [], { opacity: 0, y: 14, filter: "blur(8px)" });
      gsap.set(badge ?? [], { opacity: 0, scale: 0.85, y: 8 });
      gsap.set(tools, { opacity: 0, y: mobile ? 18 : 0, x: mobile ? 0 : 26, scale: 0.92 });
      gsap.set(checks, { opacity: 0, scale: 0.5 });
      gsap.set(q(".nxr-aia-scene"), { visibility: "visible" });

      // ---- SPLASH de entrada (V17.1, "por la derecha… se para en el
      // centro… se va por la izquierda"): la onda Siri ENTRA desde la
      // derecha de la pantalla, se detiene en el centro ~1s y SALE por la
      // izquierda; el titular llega entonces también DESDE LA DERECHA, y
      // con él el indicador "Desliza". Timeline por TIEMPO (no scrubbeada);
      // el scrub posee la y del head — aquí solo x/opacity/filter, sin
      // conflicto. Al terminar, React desmonta el canvas del splash y
      // libera su contexto WebGL.
      const splashEl = q(".nxr-aia-splash")[0] as HTMLElement | undefined;
      if (splashEl && head) {
        const vw = window.innerWidth;
        gsap.set(head, { opacity: 0, x: vw * 0.18, filter: "blur(14px)" });
        const intro = gsap.timeline({ onComplete: () => setSplashDone(true) });
        intro
          .fromTo(
            splashEl,
            { opacity: 0, x: vw * 0.55, filter: "blur(14px)" },
            { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out" }
          )
          // Pausa en el centro: 0.7s (V17.3, "un pelín menos" que el 1s).
          .to(splashEl, { opacity: 0, x: -vw * 0.55, filter: "blur(14px)", duration: 0.55, ease: "power3.in" }, 1.3)
          .to(head, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.65, ease: "power3.out" }, 1.55)
          .to(q(".nxr-scrollcue"), { autoAlpha: 1, duration: 0.4 }, 1.75);
      }

      // REPRODUCCIÓN POR TIEMPO, NO POR SCROLL (V18.55, "que se ejecuten
      // suavemente al llegar a la sección sin tener que hacer scroll").
      //
      // Antes esto era una timeline `scrub` sobre un `pin`: la escena solo
      // avanzaba mientras el visitante empujaba el scroll, y la sección
      // retenía 3,5 pantallas de recorrido para poder contarla entera. Ahora
      // se dispara sola al entrar y se reproduce a su propio ritmo.
      //
      // `once: true` y no `toggleActions`: es una secuencia con desenlace —el
      // agente resuelve la gestión— y rebobinarla al salir dejaría la escena a
      // medias en pantalla. Se reproduce una vez y se queda en su estado
      // final, que es exactamente lo que debe verse al terminar.
      //
      // timeScale 1.35 porque las duraciones estaban escritas para el scrub,
      // donde el reparto importa más que el reloj: tal cual, la secuencia
      // completa pasaba de seis segundos y se hacía lenta viéndola sola.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 60%",
          once: true,
          invalidateOnRefresh: true,
        },
      });
      tl.timeScale(1.35);

      // ===== PHASE A — the title hands the stage to the pipeline =====
      tl.to(head ?? {}, { y: () => -(restTop + hh * S + vh * 0.08), duration: 1.15, ease: "power2.in" }, 0);
      // Re-ajuste del título con las fuentes reales cargadas (ver fitTitle).
      document.fonts?.ready
        .then(() => {
          fitTitle();
          tl.scrollTrigger?.refresh();
        })
        .catch(() => {});
      tl.to(chat ?? {}, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.85);

      // ===== PHASE B — the customer writes =====
      tl.to(msgIn ?? {}, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power2.out" }, 1.5);

      // ===== PHASE C — the agent reads & thinks =====
      tl.to(typing ?? {}, { opacity: 1, duration: 0.35 }, 2.05);

      // ===== PHASE D — tools fan out, one beat each =====
      tools.forEach((tool, i) => {
        const at = 3.05 + i * 0.55;
        tl.to(tool, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, at);
        if (checks[i]) tl.to(checks[i], { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, at + 0.5);
      });

      // ===== PHASE E — the reply closes the loop =====
      tl.to(typing ?? {}, { opacity: 0, duration: 0.3 }, 4.65);
      tl.to(msgOut ?? {}, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "power2.out" }, 4.75);
      tl.to(badge ?? {}, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }, 5.3);
      tl.to(q(".nxr-scrollcue"), { autoAlpha: 0, duration: 0.35 }, 5.5);

      // Hold — the resolved gestión is what's on screen at pin end.
      tl.to({}, { duration: 0.5 }, 6.1);

      // Idle breathing for the chat panel (independent of scroll; offset
      // chains ignore it, so beam anchors stay put).
      gsap.to(chat ?? [], { yPercent: -1.2, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1 });

      // (Aquí vivía el parche del race de navegación cliente
      // —Bug-Log-Pin-Nace-Con-Scroll-Viejo—: el ScrollTrigger podía nacer con
      // el scroll de la página ANTERIOR, con la escena ya resuelta, y el scrub
      // se veía volver a cero. Sin scrub no hay tween interno que perseguir y
      // el problema desaparece por construcción: la timeline se dispara al
      // entrar y avanza sola.)
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  if (reducedMotion) {
    return (
      // ref OBLIGATORIO también aquí: useGlassPanels arranca desde
      // sectionRef y hace `if (!root) return`. Sin él, la rama de
      // reduced-motion dejaba el chat y las tools sin NINGUNA malla de
      // cristal (solo su scrim), que es el fallo "mesh apuntando a una rama
      // desmontada" que avisa CLAUDE.md. SeoHero/SeoPasos ya lo hacían bien.
      <section key="static" id="nxr-aia-hero" className="nxr-aia-hero nxr-aia-static" ref={sectionRef}>
        <div className="nxr-aia-head">
          <h1 className="nxr-aia-h1">
            Agentes que trabajan por ti,
            <br />
            <span className="nxr-gradient-text-lime">a todas horas.</span>
          </h1>
        </div>
        <div className="nxr-aia-flow">
          <ChatPanel static />
          <Tools />
        </div>
        <div className="nxr-aia-st-facets">
          {FACETS.map((f, i) => (
            <div key={f.title} className="nxr-aia-st-facet nxr-glass-edge">
              <span className="nxr-glass-edge-content">
                <span className="nxr-aia-facet-num" style={{ color: f.color }}>
                  0{i + 1}
                </span>
                <span className="nxr-aia-facet-title">{f.title}</span>
                <span className="nxr-aia-facet-desc">{f.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section key="animated" id="nxr-aia-hero" className="nxr-aia-hero" ref={sectionRef}>
      <div className="nxr-aia-stage" ref={stageRef}>
        {/* Splash de entrada: la onda Siri saluda ~1s y se disuelve dando
            paso al titular (timeline por tiempo en el useGSAP). */}
        {!splashDone && (
          <div className="nxr-aia-splash" aria-hidden="true">
            <SiriSplash />
          </div>
        )}
        <div className="nxr-aia-scene">
          {/* THE pipeline: one grid owns every actor — desktop
                chat | tools ; mobile: single flex column chat → tools. */}
          <div className="nxr-aia-flow">
            <ChatPanel />
            <Tools />
          </div>
        </div>
        {/* Indicador de scroll compartido (mismas clases que /desarrollo-web);
            el timeline lo enciende solo mientras corre la animación. */}
        <div className="nxr-scrollcue">
          <span className="nxr-scrollcue-wheel">
            <i />
          </span>
          <span className="nxr-scrollcue-txt">Desliza</span>
        </div>
        <div className="nxr-aia-overlay">
          <div className="nxr-aia-head">
            <h1 className="nxr-aia-h1">
              Agentes que trabajan por ti,
              <br />
              <span className="nxr-gradient-text-lime">a todas horas.</span>
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
