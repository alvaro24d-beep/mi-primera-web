"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGlassPanels } from "@/hooks/useGlassPanels";
import type { AiaDrive, AiaLayout } from "./aia/AgentScene";

gsap.registerPlugin(ScrollTrigger);

// Heaviest JS on the route — separate chunk, after hydration (same reasoning
// as DesarrolloWebHero's HeroScene).
const AgentScene = dynamic(() => import("./aia/AgentScene"), { ssr: false });

// /agentes-ia hero, RECONSTRUIDO (V16.0): a pinned, scroll-scrubbed
// re-enactment of an AI agent resolving a real request end to end (golden
// rule: the animation SHOWS the service). The layout is now a PIPELINE the
// eye reads in order — customer chat → agent core → tools — laid out by ONE
// CSS grid (desktop: three columns with the core column as the space between;
// mobile: one flex column), so every gap is a grid gap and nothing is
// absolutely positioned against anything else: overlap is impossible by
// construction and proportions are owned by minmax()/clamp() in the CSS.
//
// The GSAP timeline lives here in the DOM tree (per AGENTS.md) and drives:
//   1. DOM: conversation, tool chips, facet labels, closing CTA.
//   2. WebGL (components/aia/AgentScene): core chip, beams, pulses — via the
//      plain-object `driveRef` read by useFrame (contract unchanged).
// Chat panel, tool chips and CTA are volumetric-glass anchors rendered by the
// GLOBAL SceneCanvas (useGlassPanels) — `nxr-aia-hero` is in its alwaysIds.

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
            <span className="nxr-aia-chat-name">Agente de Nexora</span>
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

function Cta({ onCta }: { onCta?: (e: React.MouseEvent) => void }) {
  return (
    <a className="nxr-aia-cta" href="#nxr-contacto" onClick={onCta}>
      <span className="nxr-aia-cta-inner">
        Quiero mi agente
        <svg viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </a>
  );
}

export default function AgentesIaHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const driveRef = useRef<AiaDrive>({ core: 0, read: 0, t0: 0, t1: 0, t2: 0, reply: 0 });
  const layoutRef = useRef<AiaLayout>({ ready: false, core: { x: 0, y: 0 }, chat: { x: 0, y: 0 }, tools: [] });
  const reducedMotion = useReducedMotion();

  // Volumetric fluid glass from the global SceneCanvas on the story's
  // surfaces (anchors stay transparent DOM shells — the mesh IS the glass).
  useGlassPanels(sectionRef, ".nxr-aia-chat", "#10141c", [reducedMotion]);
  useGlassPanels(sectionRef, ".nxr-aia-tool", "#12161c", [reducedMotion]);
  useGlassPanels(sectionRef, ".nxr-aia-cta", "#141018", [reducedMotion]);

  const goContacto = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("nxr-contacto");
    if (!el) return;
    const lenis = (window as unknown as { __nxrLenis?: { scrollTo: (t: HTMLElement, o?: object) => void } }).__nxrLenis;
    if (lenis) lenis.scrollTo(el, { offset: -10 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;

      const q = gsap.utils.selector(section);
      const head = q(".nxr-aia-head")[0] as HTMLElement | undefined;
      const canvasWrap = q(".nxr-aia-canvas-wrap")[0] as HTMLElement | undefined;
      const chat = q(".nxr-aia-chat")[0] as HTMLElement | undefined;
      const tools = q(".nxr-aia-tool") as HTMLElement[];
      const checks = q(".nxr-aia-tool-check") as HTMLElement[];
      const msgIn = q(".nxr-aia-msg-in")[0] as HTMLElement | undefined;
      const typing = q(".nxr-aia-typing")[0] as HTMLElement | undefined;
      const msgOut = q(".nxr-aia-msg-out")[0] as HTMLElement | undefined;
      const badge = q(".nxr-aia-badge")[0] as HTMLElement | undefined;
      const cta = q(".nxr-aia-cta")[0] as HTMLElement | undefined;
      const facetsPanel = q(".nxr-aia-facets-panel")[0] as HTMLElement | undefined;
      const labels = q(".nxr-aia-facet-label");
      const coreSpot = q(".nxr-aia-core-spot")[0] as HTMLElement | undefined;
      const mobile = window.innerWidth < 768;

      // Same Safari/Chrome `100lvh` disagreement fix as DesarrolloWebHero:
      // one real innerHeight measurement drives the mobile stage height.
      if (mobile) section.style.setProperty("--aia-vh", `${window.innerHeight}px`);

      // ---- Measure beam anchor points for the WebGL scene. offsetLeft/Top
      // chains ignore transforms, so this reads REST positions even when
      // called mid-scrub (fonts.ready / resize re-runs).
      const centerOf = (el: HTMLElement) => {
        let x = el.offsetWidth / 2;
        let y = el.offsetHeight / 2;
        let node: HTMLElement | null = el;
        while (node && node !== stage) {
          x += node.offsetLeft;
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        return { x, y };
      };
      const measure = () => {
        if (!chat || !coreSpot || tools.length < 3) return;
        const isMobileNow = window.innerWidth < 768;
        const chatC = centerOf(chat);
        const l = layoutRef.current;
        l.core = centerOf(coreSpot);
        // Beams land on the EDGE facing the core. Desktop pipeline is
        // horizontal (chat | core | tools): chat's right edge, each tool's
        // left edge. Mobile pipeline is vertical (chat / core / tools):
        // chat's bottom edge, and each tool's top edge AT ITS ICON (x =
        // left + 30) so the three beams land staggered instead of piling
        // onto the same centre line.
        l.chat = isMobileNow
          ? { x: chatC.x, y: chatC.y + chat.offsetHeight / 2 - 4 }
          : { x: chatC.x + chat.offsetWidth / 2 + 4, y: chatC.y };
        l.tools = tools.map((el) => {
          const c = centerOf(el);
          return isMobileNow
            ? { x: c.x - el.offsetWidth / 2 + 30, y: c.y - el.offsetHeight / 2 - 4 }
            : { x: c.x - el.offsetWidth / 2 - 4, y: c.y };
        });
        l.ready = true;
        window.dispatchEvent(new Event("nxr-aia-layout"));
      };
      measure();
      document.fonts?.ready.then(measure).catch(() => {});
      window.addEventListener("resize", measure, { passive: true });

      // ---- Title intro: big at mid-height, then exits STRAIGHT UP while
      // the pipeline rises in (same family gesture as /desarrollo-web V15.88).
      const S = mobile ? 1.2 : 1.6;
      const vh = window.innerHeight;
      const restTop = head ? parseFloat(getComputedStyle(head).top) || 44 : 44;
      const hh = head ? head.offsetHeight : 120;
      const y0 = vh / 2 - restTop - (hh * S) / 2;
      if (head) gsap.set(head, { transformOrigin: "left top", scale: S, y: y0 });

      // ---- Hidden start states. The same waiting poses also exist as a CSS
      // floor (see globals.css) so no init race can ever paint the resolved
      // scene — these inline sets simply take over from it.
      gsap.set(canvasWrap ?? [], { opacity: 0 });
      gsap.set(chat ?? [], { opacity: 0, y: 36 });
      gsap.set(msgIn ?? [], { opacity: 0, y: 14, filter: "blur(8px)" });
      gsap.set(typing ?? [], { opacity: 0 });
      gsap.set(msgOut ?? [], { opacity: 0, y: 14, filter: "blur(8px)" });
      gsap.set(badge ?? [], { opacity: 0, scale: 0.85, y: 8 });
      gsap.set(tools, { opacity: 0, y: mobile ? 18 : 0, x: mobile ? 0 : 26, scale: 0.92 });
      gsap.set(checks, { opacity: 0, scale: 0.5 });
      gsap.set(cta ?? [], { opacity: 0, y: 16 });
      gsap.set(facetsPanel ?? [], { opacity: 0, y: 24 });
      gsap.set(labels, { opacity: 0, filter: "blur(10px)" });
      gsap.set(q(".nxr-aia-scene"), { visibility: "visible" });
      gsap.set(facetsPanel ?? [], { visibility: "visible" });

      const d = driveRef.current;
      d.core = d.read = d.t0 = d.t1 = d.t2 = d.reply = 0;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => (window.innerWidth < 768 ? "+=460%" : "+=540%"),
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // ===== PHASE A — the title hands the stage to the pipeline =====
      tl.to(head ?? {}, { y: -(restTop + hh * S + vh * 0.08), duration: 1.15, ease: "power2.in" }, 0);
      tl.to(canvasWrap ?? {}, { opacity: 1, duration: 0.6 }, 0.6);
      tl.to(chat ?? {}, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.85);
      tl.to(facetsPanel ?? {}, { opacity: 1, y: 0, duration: 0.5 }, 1.15);
      if (labels[0]) tl.to(labels[0], { opacity: 1, filter: "blur(0px)", duration: 0.4 }, 1.25);

      // ===== PHASE B — the customer writes =====
      tl.to(msgIn ?? {}, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power2.out" }, 1.5);

      // ===== PHASE C — the agent reads & thinks =====
      tl.to(typing ?? {}, { opacity: 1, duration: 0.35 }, 2.05);
      tl.to(d, { core: 1, duration: 0.8, ease: "power2.inOut" }, 2.1);
      tl.to(d, { read: 1, duration: 1.0, ease: "none" }, 2.25);
      crossfadeFacet(tl, labels, 0, 1, 2.3);

      // ===== PHASE D — tools fan out, one beat each =====
      const toolKeys = ["t0", "t1", "t2"] as const;
      tools.forEach((tool, i) => {
        const at = 3.05 + i * 0.55;
        tl.to(tool, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, at);
        tl.to(d, { [toolKeys[i]]: 1, duration: 0.6, ease: "none" }, at + 0.12);
        if (checks[i]) tl.to(checks[i], { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, at + 0.5);
      });
      crossfadeFacet(tl, labels, 1, 2, 3.15);

      // ===== PHASE E — the reply closes the loop =====
      crossfadeFacet(tl, labels, 2, 3, 4.6);
      tl.to(typing ?? {}, { opacity: 0, duration: 0.3 }, 4.65);
      tl.to(d, { reply: 1, duration: 0.8, ease: "power1.inOut" }, 4.65);
      tl.to(msgOut ?? {}, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "power2.out" }, 4.75);
      tl.to(badge ?? {}, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }, 5.3);

      // ===== PHASE F — the CTA is the story's closing beat =====
      tl.to(cta ?? {}, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" }, 5.6);

      // Hold — the resolved gestión is what's on screen at pin end.
      tl.to({}, { duration: 0.5 }, 6.1);

      // Idle breathing for the chat panel (independent of scroll; offset
      // chains ignore it, so beam anchors stay put).
      gsap.to(chat ?? [], { yPercent: -1.2, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1 });

      // Client-nav race (Bug-Log-Pin-Nace-Con-Scroll-Viejo): this effect runs
      // BEFORE the template's scroll reset, so the ScrollTrigger can be born
      // at the OLD page's scroll (progress ≈ 1 → resolved scene) and the
      // scrub would visibly chase back to 0. One frame later — scroll already
      // reset — complete the scrub's internal tween instantly.
      requestAnimationFrame(() => {
        const st = tl.scrollTrigger;
        if (!st) return;
        st.update();
        const scrubTween = typeof st.getTween === "function" ? st.getTween() : null;
        if (scrubTween) scrubTween.progress(1);
      });

      return () => window.removeEventListener("resize", measure);
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  if (reducedMotion) {
    return (
      <section key="static" id="nxr-aia-hero" className="nxr-aia-hero nxr-aia-static">
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
          <Cta onCta={goContacto} />
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
        <div className="nxr-aia-canvas-wrap">
          <AgentScene drive={driveRef} layout={layoutRef} />
        </div>
        <div className="nxr-aia-scene">
          {/* THE pipeline: one grid owns every actor. Desktop areas
                chat | core | tools   (CTA in a second row under the chat)
              Mobile: single flex column chat → core → tools → cta. The
              core slot is a real in-flow box the ghost core-spot centres
              in — the WebGL chip renders exactly there on every viewport. */}
          <div className="nxr-aia-flow">
            <ChatPanel />
            <div className="nxr-aia-core-slot" aria-hidden="true">
              <div className="nxr-aia-core-spot" />
            </div>
            <Tools />
            <Cta onCta={goContacto} />
          </div>
        </div>
        <div className="nxr-aia-overlay">
          <div className="nxr-aia-head">
            <h1 className="nxr-aia-h1">
              Agentes que trabajan por ti,
              <br />
              <span className="nxr-gradient-text-lime">a todas horas.</span>
            </h1>
          </div>
          <div className="nxr-aia-facets-panel nxr-glass-edge">
            <div className="nxr-glass-edge-content nxr-aia-facets-inner">
              {FACETS.map((f, i) => (
                <div key={f.title} className="nxr-aia-facet-label">
                  <span className="nxr-aia-facet-num" style={{ color: f.color }}>
                    0{i + 1}
                  </span>
                  <div>
                    <div className="nxr-aia-facet-title">{f.title}</div>
                    <div className="nxr-aia-facet-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Progressive blur crossfade between stacked facet labels (same gesture as
// /desarrollo-web so the service pages read as one family).
function crossfadeFacet(tl: gsap.core.Timeline, labels: Element[], from: number, to: number, at: number) {
  if (labels[from]) tl.to(labels[from], { opacity: 0, filter: "blur(10px)", duration: 0.5, ease: "power1.inOut" }, at);
  if (labels[to]) tl.to(labels[to], { opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power1.inOut" }, at);
}
