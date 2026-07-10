"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCardDisturbance } from "@/store/useCardDisturbance";
import { useServiciosCardsRegistry } from "@/store/useServiciosCardsRegistry";

gsap.registerPlugin(ScrollTrigger);

function Web3DAnim() {
  return (
    <div className="anim-web3d">
      <div className="anim-web3d-stage">
        <div className="anim-web3d-glow"></div>
        <div className="anim-web3d-browser">
          <div className="anim-web3d-topbar">
            <div className="anim-web3d-dot"></div>
            <div className="anim-web3d-dot"></div>
            <div className="anim-web3d-dot"></div>
          </div>
          <div className="anim-web3d-body">
            <div className="anim-web3d-scroll">
              <div className="anim-web3d-line accent"></div>
              <div className="anim-web3d-line w80"></div>
              <div className="anim-web3d-line w60"></div>
              <div className="anim-web3d-cards">
                <div className="anim-web3d-cardmini"></div>
                <div className="anim-web3d-cardmini"></div>
                <div className="anim-web3d-cardmini"></div>
              </div>
              <div className="anim-web3d-line w40"></div>
              <div className="anim-web3d-line w80"></div>
              <div className="anim-web3d-line w60"></div>
              <div className="anim-web3d-cards">
                <div className="anim-web3d-cardmini"></div>
                <div className="anim-web3d-cardmini"></div>
                <div className="anim-web3d-cardmini"></div>
              </div>
              <div className="anim-web3d-line w40"></div>
            </div>
          </div>
        </div>
        <div className="anim-web3d-layer -code">
          <svg viewBox="0 0 24 24">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <div className="anim-web3d-layer -perf">
          <div>
            <div className="anim-web3d-perf-num">98</div>
            <div className="anim-web3d-perf-label">Performance</div>
          </div>
        </div>
        <div className="anim-web3d-cursor">
          <svg viewBox="0 0 24 24">
            <path d="M4,2 L4,20 L9,15.5 L12,22 L15,20.5 L12,14 L18,14 Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ChatAnim() {
  return (
    <div className="anim-chat">
      <div className="anim-chat-msg left">
        <div className="anim-chat-avatar">🙋</div>
        <div className="anim-chat-bubble">¿Cuándo vence mi suscripción?</div>
      </div>
      <div className="anim-chat-msg right">
        <div className="anim-chat-avatar">🤖</div>
        <div className="anim-chat-bubble system">
          <svg className="anim-chat-db-icon" viewBox="0 0 24 24">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
          </svg>
          Consultando base de datos…
        </div>
      </div>
      <div className="anim-chat-msg right">
        <div className="anim-chat-avatar">🤖</div>
        <div className="anim-chat-bubble">
          Tu plan Pro vence el 15 de enero. ¿Quieres renovarlo ahora con un 20% de descuento?
        </div>
      </div>
      <div className="anim-chat-msg left">
        <div className="anim-chat-avatar">🙋</div>
        <div className="anim-chat-bubble">Sí, renuévalo. ¡Gracias!</div>
      </div>
    </div>
  );
}

function FlowAnim() {
  return (
    <div className="anim-auto3d">
      <div className="anim-auto3d-stage">
        <div className="anim-auto3d-glow"></div>
        <div className="anim-auto3d-panel">
          <svg className="anim-flow-svg" viewBox="0 0 240 100" preserveAspectRatio="xMidYMid meet">
            <g className="anim-flow-node-l">
              <rect x="4" y="8" width="58" height="38" rx="8" fill="rgba(255,157,125,.04)" stroke="rgba(255,157,125,.15)" strokeWidth="1" />
              <text x="33" y="24" textAnchor="middle" fill="rgba(255,157,125,.25)" fontSize="13" fontWeight="700" fontFamily="sans-serif">Gmail</text>
              <text x="33" y="38" textAnchor="middle" fill="rgba(255,255,255,.12)" fontSize="10" fontFamily="sans-serif">Trigger</text>
            </g>
            <g className="anim-flow-node-l">
              <rect x="4" y="58" width="58" height="38" rx="8" fill="rgba(255,157,125,.04)" stroke="rgba(255,157,125,.15)" strokeWidth="1" />
              <text x="33" y="74" textAnchor="middle" fill="rgba(255,157,125,.25)" fontSize="13" fontWeight="700" fontFamily="sans-serif">CRM</text>
              <text x="33" y="88" textAnchor="middle" fill="rgba(255,255,255,.12)" fontSize="10" fontFamily="sans-serif">Lead</text>
            </g>

            <path className="anim-flow-conn-l" d="M62,27 C88,27 88,50 94,50" />
            <path className="anim-flow-conn-l" d="M62,77 C88,77 88,50 94,50" />

            <g className="anim-flow-node-c">
              <rect x="94" y="14" width="52" height="72" rx="10" fill="rgba(255,157,125,.06)" stroke="rgba(255,157,125,.2)" strokeWidth="1.5" />
              <rect x="107" y="28" width="26" height="22" rx="4" fill="none" stroke="var(--c-salmon)" strokeWidth="1.4" />
              <circle cx="114" cy="38" r="3" fill="var(--c-salmon)" opacity="0.85" />
              <circle cx="126" cy="38" r="3" fill="var(--c-salmon)" opacity="0.85" />
              <rect x="111" y="44" width="18" height="3" rx="1.5" fill="var(--c-salmon)" opacity="0.6" />
              <line x1="120" y1="28" x2="120" y2="24" stroke="var(--c-salmon)" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="120" cy="23" r="2" fill="var(--c-salmon)" />
              <text x="120" y="76" textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize="10" fontFamily="sans-serif">Agente IA</text>
            </g>

            <path className="anim-flow-conn-r" d="M146,50 C152,50 152,27 178,27" />
            <path className="anim-flow-conn-r" d="M146,50 C152,50 152,77 178,77" />

            <g className="anim-flow-node-r">
              <rect x="178" y="8" width="58" height="38" rx="8" fill="rgba(255,157,125,.04)" stroke="rgba(255,157,125,.15)" strokeWidth="1" />
              <text x="207" y="24" textAnchor="middle" fill="rgba(255,157,125,.25)" fontSize="13" fontWeight="700" fontFamily="sans-serif">Factura</text>
              <text x="207" y="38" textAnchor="middle" fill="rgba(255,255,255,.12)" fontSize="10" fontFamily="sans-serif">Auto</text>
            </g>
            <g className="anim-flow-node-r">
              <rect x="178" y="58" width="58" height="38" rx="8" fill="rgba(255,157,125,.04)" stroke="rgba(255,157,125,.15)" strokeWidth="1" />
              <text x="207" y="74" textAnchor="middle" fill="rgba(255,157,125,.25)" fontSize="13" fontWeight="700" fontFamily="sans-serif">Slack</text>
              <text x="207" y="88" textAnchor="middle" fill="rgba(255,255,255,.12)" fontSize="10" fontFamily="sans-serif">Notificar</text>
            </g>

            <circle className="anim-flow-particle" r="3.5">
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.92;1" dur="2s" repeatCount="indefinite" begin="1.2s" />
              <animateMotion dur="2s" repeatCount="indefinite" begin="1.2s" path="M62,27 C88,27 88,50 94,50 C152,50 152,27 178,27" />
            </circle>
            <circle className="anim-flow-particle" r="3">
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.92;1" dur="2.2s" repeatCount="indefinite" begin="2.1s" />
              <animateMotion dur="2.2s" repeatCount="indefinite" begin="2.1s" path="M62,77 C88,77 88,50 94,50 C152,50 152,77 178,77" />
            </circle>
          </svg>
        </div>
        <div className="anim-auto3d-chip -mail">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        </div>
        <div className="anim-auto3d-chip -bolt">
          <svg viewBox="0 0 24 24">
            <path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z" />
          </svg>
        </div>
        <div className="anim-auto3d-chip -check">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12l3 3 5-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function SeoAnim() {
  return (
    <div className="anim-gsc">
      <div className="anim-gsc-metrics">
        <div className="anim-gsc-metric -active">
          <span className="anim-gsc-metric-dot" style={{ background: "var(--c-lime)" }}></span>
          <span className="anim-gsc-metric-val">3.482</span>
          <span className="anim-gsc-metric-label">Clics totales</span>
        </div>
        <div className="anim-gsc-metric">
          <span className="anim-gsc-metric-dot" style={{ background: "var(--c-salmon)" }}></span>
          <span className="anim-gsc-metric-val">86,4K</span>
          <span className="anim-gsc-metric-label">Impresiones</span>
        </div>
        <div className="anim-gsc-metric">
          <span className="anim-gsc-metric-dot" style={{ background: "rgba(255,255,255,0.25)" }}></span>
          <span className="anim-gsc-metric-val">4,0%</span>
          <span className="anim-gsc-metric-label">CTR medio</span>
        </div>
        <div className="anim-gsc-metric">
          <span className="anim-gsc-metric-dot" style={{ background: "rgba(255,255,255,0.25)" }}></span>
          <span className="anim-gsc-metric-val">2,8</span>
          <span className="anim-gsc-metric-label">Posición</span>
        </div>
      </div>
      <div className="anim-gsc-chart">
        <svg viewBox="0 0 260 90" preserveAspectRatio="none">
          <defs>
            <linearGradient id="nxr-gsc-grad-lime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--c-lime)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--c-lime)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="nxr-gsc-grad-salmon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--c-salmon)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--c-salmon)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="anim-gsc-grid">
            <line x1="0" y1="8" x2="260" y2="8" />
            <line x1="0" y1="28" x2="260" y2="28" />
            <line x1="0" y1="48" x2="260" y2="48" />
            <line x1="0" y1="68" x2="260" y2="68" />
          </g>
          <path className="anim-gsc-area-impr" d="M0,55 L26,50 L52,52 L78,40 L104,44 L130,32 L156,36 L182,24 L208,28 L234,18 L260,20 L260,80 L0,80 Z" />
          <path className="anim-gsc-area-clicks" d="M0,68 L26,64 L52,66 L78,56 L104,58 L130,46 L156,50 L182,38 L208,34 L234,24 L260,16 L260,80 L0,80 Z" />
          <line className="anim-gsc-cursor" x1="234" y1="10" x2="234" y2="80" />
          <path className="anim-gsc-line-impr" d="M0,55 L26,50 L52,52 L78,40 L104,44 L130,32 L156,36 L182,24 L208,28 L234,18 L260,20" />
          <path className="anim-gsc-line-clicks" d="M0,68 L26,64 L52,66 L78,56 L104,58 L130,46 L156,50 L182,38 L208,34 L234,24 L260,16" />
          <circle className="anim-gsc-dot" cx="234" cy="24" r="3.5" />
          <g className="anim-gsc-axis">
            <text x="2" y="88">1 jun</text>
            <text x="112" y="88">15 jun</text>
            <text x="228" y="88">30 jun</text>
          </g>
        </svg>
      </div>
      <div className="anim-gsc-legend">
        <div className="anim-gsc-legend-item">
          <span className="anim-gsc-legend-dot" style={{ background: "var(--c-lime)" }}></span>
          Clics
        </div>
        <div className="anim-gsc-legend-item">
          <span className="anim-gsc-legend-dot" style={{ background: "var(--c-salmon)" }}></span>
          Impresiones
        </div>
      </div>
    </div>
  );
}

function AppAnim() {
  return (
    <div className="anim-app">
      <div className="anim-app-phone">
        <div className="anim-app-phone-bar">
          <div className="anim-app-phone-notch"></div>
        </div>
        <div className="anim-app-phone-body">
          <div className="anim-app-row accent"></div>
          <div className="anim-app-row" style={{ width: "80%" }}></div>
          <div className="anim-app-row" style={{ width: "60%" }}></div>
          <div className="anim-app-row" style={{ width: "90%" }}></div>
          <div className="anim-app-row" style={{ width: "70%" }}></div>
        </div>
      </div>
      <div className="anim-app-stats">
        <div className="anim-app-stat">
          <span className="anim-app-stat-label">Usuarios activos</span>
          <span className="anim-app-stat-val" data-target="2840">0</span>
          <div className="anim-app-stat-bar-wrap">
            <div className="anim-app-stat-bar-fill" style={{ width: "78%" }}></div>
          </div>
        </div>
        <div className="anim-app-stat">
          <span className="anim-app-stat-label">Uptime</span>
          <span className="anim-app-stat-val">99.9%</span>
          <div className="anim-app-stat-bar-wrap">
            <div className="anim-app-stat-bar-fill" style={{ width: "99%", background: "var(--c-lime)" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CARDS = [
  {
    tag: "Desarrollo web",
    title: "Webs que convierten visitas en clientes.",
    desc: "Diseñamos y desarrollamos sitios web a medida con rendimiento real, experiencia de usuario cuidada y arquitectura pensada para escalar. Sin plantillas. Sin límites.",
    pills: ["Landing pages", "Portales corporativos", "E-commerce", "Plataformas SaaS"],
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    anim: <Web3DAnim />,
    cta: "Quiero mi web",
    href: "/desarrollo-web/",
  },
  {
    tag: "Agentes IA",
    title: "Agentes que trabajan por ti, 24/7.",
    desc: "Asistentes inteligentes conectados a tus herramientas que atienden clientes, gestionan citas y ejecutan tareas sin intervención humana.",
    pills: ["WhatsApp", "Web chat", "Email", "CRM"],
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M16.9 16.9l1.5 1.5M5.6 18.4l1.4-1.4M16.9 7.1l1.5-1.5" />
      </svg>
    ),
    anim: <ChatAnim />,
    cta: "Activar mi agente",
    href: "/agentes-ia/",
  },
  {
    tag: "Automatizaciones",
    title: "Flujos que eliminan el trabajo repetitivo.",
    desc: "Conectamos tus apps y automatizamos procesos con n8n para que tu equipo dedique su tiempo a lo que importa.",
    pills: ["n8n", "CRM", "Facturación", "Reportes"],
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 3L3 8.5v7L12 21l9-5.5v-7L12 3z" />
        <path d="M12 12l9-3.5M12 12L3 8.5M12 12v9" />
      </svg>
    ),
    anim: <FlowAnim />,
    cta: "Automatizar ahora",
    href: "/automatizaciones/",
  },
  {
    tag: "SEO & Posicionamiento",
    title: "Visibilidad real en Google.",
    desc: "Estrategia SEO técnica y de contenido para que tus clientes te encuentren cuando te necesitan.",
    pills: ["SEO técnico", "Contenido", "Local SEO", "Auditorías"],
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5L21 21" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
    anim: <SeoAnim />,
    cta: "Subir posiciones",
    href: "/seo-posicionamiento/",
  },
  {
    tag: "Apps & Software",
    title: "Software a medida para tu negocio.",
    desc: "Desarrollamos aplicaciones web y móviles que resuelven el problema exacto de tu empresa, integradas con tu ecosistema actual.",
    pills: ["Web apps", "APIs REST", "Integraciones", "Dashboards"],
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
    anim: <AppAnim />,
    cta: "Crear mi app",
    href: "/apps-software/",
  },
];

// Per-card material/curvature config for the real R3F glass mesh rendered in
// SceneCanvas.tsx (components/scene/VolumetricCard.tsx) — colors echo each
// card's existing accent (see the `:nth-child` icon colors below) so the
// glass itself is faintly tinted, not just its icon. curveX/curveY are
// deliberately strong on BOTH axes (not just one) so the bulge reads as a
// true convex dome even head-on/at rest, not just a cylindrical highlight —
// small per-card jitter so no two cards curve identically.
const CARD_STYLES = [
  { color: "#1c0f0a", material: "glass" as const, curveX: 0.13, curveY: 0.11 },
  { color: "#0e150a", material: "glass" as const, curveX: 0.14, curveY: 0.1 },
  { color: "#160f0a", material: "glass" as const, curveX: 0.12, curveY: 0.12 },
  { color: "#0e150a", material: "glass" as const, curveX: 0.13, curveY: 0.12 },
  { color: "#1c0f0a", material: "glass" as const, curveX: 0.12, curveY: 0.11 },
];

// The glass "screen", alche.studio-style: holds ONLY the service's
// mini-animation (always playing, never behind a hover).
function GlassCard({ c }: { c: (typeof CARDS)[number] }) {
  return (
    <div className="nxr-srv-card">
      <div className="nxr-srv-inner">
        <div className="nxr-srv-anim">{c.anim}</div>
      </div>
    </div>
  );
}

// The flat text block — tag, title, description, feature pills, CTA
// bottom-right. In the animated reel these are stacked in a FIXED
// bottom-left overlay and crossfaded (fade + blur) by updateSpiral as each
// card passes the centre; in the reduced-motion static list they flow
// under their card normally.
function Caption({ c }: { c: (typeof CARDS)[number] }) {
  return (
    <div className="nxr-srv-caption">
      <span className="nxr-srv-tag">{c.tag}</span>
      <h3 className="nxr-srv-title">{c.title}</h3>
      <p className="nxr-srv-desc">{c.desc}</p>
      <div className="nxr-srv-pills">
        {c.pills.map((p) => (
          <span key={p} className="nxr-srv-pill">
            {p}
          </span>
        ))}
      </div>
      <div className="nxr-srv-cta-wrap">
        <a href={c.href} className="nxr-srv-cta nxr-glass-edge">
          <span className="nxr-glass-edge-content">{c.cta}</span>
          <svg className="nxr-glass-edge-content" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default function Servicios() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const reducedMotion = useReducedMotion();

  // ---- Registers each card's DOM anchor with the registry so its real R3F
  // mesh (rendered in the global SceneCanvas, mounted above {children} in
  // app/layout.tsx — outside this component's own tree) can dock itself to
  // the anchor's live position. The measuring itself happens INSIDE the
  // scene's frame loop (see CardSlot in components/scene/
  // ServiciosCardsLayer.tsx) — same-frame reads, so the glass can never
  // trail its text by a frame during fast scrolling, which used to show up
  // on mobile as the card visibly "stretching"/jumping while flying off.
  // Depends on `reducedMotion`: useReducedMotion() renders the SSR-matching
  // (non-reduced) branch first and flips right after mount if the media
  // query actually prefers reduced motion — without this dependency, the
  // registered anchors would keep pointing at the now-unmounted animated
  // branch's cards forever, leaving every mesh permanently hidden.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const anchors = Array.from(section.querySelectorAll<HTMLElement>(".nxr-srv-card"));

    anchors.forEach((anchor, i) => {
      useServiciosCardsRegistry.getState().setStyle(i, CARD_STYLES[i] ?? CARD_STYLES[0]);
      useServiciosCardsRegistry.getState().setAnchor(i, anchor);
    });

    return () => {
      anchors.forEach((_, i) => useServiciosCardsRegistry.getState().clear(i));
    };
  }, [reducedMotion]);

  // ---- Horizontal pinned-scroll "spiral" reel (same pin+scrub mechanism as
  // ProcesoReel.tsx) plus physical cursor-tilt-with-inertia, both writing
  // into each card's registry `transform` slot (read every frame by CardSlot
  // in components/scene/ServiciosCardsLayer.tsx) instead of a CSS transform —
  // the actual glass object being animated is the R3F mesh, not this DOM
  // element. Cards travel along a diagonal arc as the track scrubs left
  // (entering low from the bottom-right, exiting high at the top-left),
  // never rotating themselves. Hovering also pushes this card's screen
  // position into the shared disturbance store so the ambient canvas
  // ripples nearby. Kept as its own effect, separate from the per-card
  // mini-animation behaviors below (chat auto-loop, flow hover, app
  // count-up), which are unrelated content demos and untouched by this
  // redesign.
  useGSAP(
    () => {
      const section = sectionRef.current;
      const sticky = stickyRef.current;
      const content = contentRef.current;
      const track = trackRef.current;
      // Reduced motion (or the static fallback render below, which never
      // attaches these pin-only refs) intentionally no-ops here — cards stay
      // at their identity transform, set once below.
      if (!section || !sticky || !content || !track) return;

      const q = gsap.utils.selector(section);
      // Slides are the reel's layout unit (just the glass now); cards are
      // the glass zones inside them (mesh anchors, yaw); captions live in
      // the fixed bottom-left overlay, index-matched to the slides.
      const slides = q(".nxr-srv-slide") as HTMLElement[];
      const cards = q(".nxr-srv-card") as HTMLElement[];
      const captions = q(".nxr-servicios-captions .nxr-srv-caption") as HTMLElement[];

      // One live transform per card, owned by the hover-tilt quickTo
      // instances below. The scroll-driven spiral yaw and the idle drift are
      // kept in their OWN arrays and summed at push time — if they all wrote
      // live[i].rotationY the hover's elastic return-to-zero would erase the
      // spiral's yaw (and vice versa) whenever they overlapped.
      const live = cards.map(() => ({ x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, scale: 1 }));
      const scrollYaw = cards.map(() => 0);
      const scrollZ = cards.map(() => 0);
      const idleYaw = cards.map(() => 0);
      const idlePitch = cards.map(() => 0);
      const inners = cards.map((card) => card.querySelector<HTMLElement>(".nxr-srv-inner"));

      // Single writer for BOTH renderings of a card: the R3F glass mesh (via
      // the registry) and the DOM content (via a matching CSS rotation on
      // `.nxr-srv-inner`). The sticky container carries `perspective: 1000px`
      // with its origin at the viewport centre — the exact same pinhole
      // camera as components/scene/PixelCamera.tsx (distance 1000, 1px = 1
      // world unit at z=0) — so the CSS projection of the rotated content and
      // the WebGL projection of the mesh coincide and the text reads as
      // printed ON the glass instead of floating flat above it. rotationX is
      // negated for the DOM: CSS's y-axis points down, so the same numeric
      // rotation about X tips the top edge away in CSS but toward the viewer
      // in three.js; rotationY needs no flip.
      const push = (i: number) => {
        const rotX = live[i].rotationX + idlePitch[i];
        const rotY = live[i].rotationY + scrollYaw[i] + idleYaw[i];
        const z = live[i].z + scrollZ[i];
        useServiciosCardsRegistry.getState().setTransform(i, { ...live[i], rotationX: rotX, rotationY: rotY, z });
        const inner = inners[i];
        if (inner) gsap.set(inner, { rotationX: -rotX, rotationY: rotY, z, scale: live[i].scale });
      };

      gsap.set(content, { opacity: 0, scale: 0.92 });
      gsap.to(content, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: section, start: "top 90%", toggleActions: "play none none none" },
      });

      // Track x runs from startX (FIRST card a bit right of centre — it must
      // arrive AT the centre with the first bit of scroll, not start there
      // and get passed accidentally the moment the pin engages) to endX
      // (LAST card exactly centred at full scroll). The pin distance
      // (`amount`) therefore includes that entry offset.
      const cardWidth = () => slides[0]?.offsetWidth ?? 0;
      const cardStep = () => (slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : 0);
      // The track's UNTRANSFORMED left edge (its rect minus its current GSAP
      // x). The track is nested inside `.nxr-servicios-content`, whose
      // horizontal padding shifts the whole reel right — centring math
      // anchored to the sticky's own width silently inherited that shift
      // and left every "centred" card sitting one padding to the right.
      const trackBaseLeft = () => {
        const currentX = Number(gsap.getProperty(track, "x")) || 0;
        return track.getBoundingClientRect().left - currentX;
      };
      const centredX = () => window.innerWidth / 2 - cardWidth() / 2 - trackBaseLeft();
      // Mobile: the first card starts FULLY OFF-SCREEN to the right (centre
      // offset > half viewport + half card), so arriving at the section
      // shows only the heading and the card slides in from the side as you
      // scroll. Desktop keeps the partial peek.
      const entryOffset = () =>
        window.innerWidth <= 900
          ? window.innerWidth * 0.5 + cardWidth() * 0.5 + 24
          : Math.min(sticky.clientWidth * 0.24, 340);
      const startX = () => centredX() + entryOffset();
      const amount = () => entryOffset() + Math.max(0, track.scrollWidth - cardWidth());
      const endX = () => startX() - amount();

      // Smaller arc on phones: the stretched glass there nearly fills the
      // space between heading and captions, so a tall arc would ride the
      // departing card into either overlay.
      const ARC_AMPLITUDE = window.innerWidth <= 900 ? 28 : 55;
      // Half-angle of the carousel drum: how far a card has turned by the
      // time it reaches the viewport edge. Bigger angle = tighter cylinder
      // (smaller radius), cards sweep BACK faster and face the axis harder.
      const MAX_YAW_DEG = window.innerWidth <= 900 ? 30 : 40;
      const THETA_MAX = (MAX_YAW_DEG * Math.PI) / 180;

      // Helical trajectory on a REAL cylinder, bottom-right → top-left: the
      // cards ride the surface of a vertical-axis drum whose radius R is
      // derived from the viewport (a card reaching the screen edge, lateral
      // offset = halfW, has swept THETA_MAX around the axis: R = halfW /
      // sin(THETA_MAX)). Each card's normalized lateral offset nx maps to
      // its drum angle θ, which drives everything coherently:
      //   yaw:  rotationY = θ — the face points AT the drum's axis, exactly
      //         0° when centred/readable (no Z-roll anywhere);
      //   z:    −R·(1−cosθ) — true depth recession (mesh position AND DOM
      //         translateZ under the shared perspective:1000 camera, so
      //         both project identically): passing cards genuinely sweep
      //         backwards around the drum, shrinking by perspective alone —
      //         no fake scale falloff;
      //   y arc: the helix's vertical climb, right/entering low, left/
      //         exiting high.
      // `y` applies via transform only — the anchor's measured rect (what
      // VolumetricCard's geometry is sized from) never changes except by
      // real translation, avoiding a per-scrub-frame geometry rebuild. The
      // fixed bottom-left captions crossfade here too: each caption's
      // visibility follows how close ITS card is to the drum's front (fully
      // legible inside |nx| < 0.2, dissolved — faded, blurred, slightly
      // dropped — past |nx| ≈ 0.55), so one text softly hands over to the
      // next as the cards pass.
      const updateSpiral = () => {
        const stickyRect = sticky.getBoundingClientRect();
        const centerX = stickyRect.left + stickyRect.width / 2;
        const halfW = stickyRect.width / 2;
        const drumR = halfW / Math.sin(THETA_MAX);
        slides.forEach((slide, i) => {
          const r = slide.getBoundingClientRect();
          const slideCenterX = r.left + r.width / 2;
          const nx = gsap.utils.clamp(-1.6, 1.6, (slideCenterX - centerX) / halfW);

          gsap.set(slide, { y: ARC_AMPLITUDE * nx });

          const cap = captions[i];
          if (cap) {
            const vis = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0.55, 0.2, 0, 1, Math.abs(nx)));
            gsap.set(cap, {
              opacity: vis,
              filter: `blur(${((1 - vis) * 5).toFixed(2)}px)`,
              y: (1 - vis) * 14,
              pointerEvents: vis > 0.5 ? "auto" : "none",
            });
          }

          const theta = gsap.utils.clamp(-1.1, 1.1, nx) * THETA_MAX;
          scrollYaw[i] = (theta * 180) / Math.PI;
          scrollZ[i] = -drumR * (1 - Math.cos(theta));
          push(i);
        });
      };

      gsap.set(track, { x: startX() });

      // ---- Snap: when scrolling rests inside the pin, glide the scroll so
      // the card nearest the centre settles EXACTLY centred — cards feel
      // like they select themselves as you pass them. Implemented as our
      // OWN rAF loop writing per-frame absolute positions through
      // `lenis.scrollTo(..., immediate)`. Both obvious alternatives fail
      // with Lenis in the loop (verified empirically): ScrollTrigger's
      // native `snap` writes raw scroll that Lenis re-emits, which
      // ScrollTrigger reads back as "user scrolled" and kills its own snap
      // tween on the first tick; and a single duration-based
      // lenis.scrollTo() glide silently loses the tug-of-war with Lenis'
      // internal lerp state. Per-frame immediate writes keep Lenis'
      // internal position in sync by construction. Any real user input
      // (wheel/touch) cancels the glide immediately.
      let snapRaf = 0;
      let snapTimer = 0;
      const glideTo = (target: number) => {
        cancelAnimationFrame(snapRaf);
        const from = window.scrollY;
        const dist = target - from;
        if (Math.abs(dist) < 1) return;
        const t0 = performance.now();
        const dur = Math.min(500, Math.max(220, Math.abs(dist)));
        // After the ease completes, keep re-writing the exact target until
        // the scroll has verifiably CONVERGED (stable within 1px for a few
        // consecutive frames, up to a bounded number of holds): Lenis can
        // still be lerping toward a stale internal target from the
        // scrolling that preceded the snap, and a single final write loses
        // to it — observed as the settled card drifting tens of px off
        // centre after the glide "finished".
        let holdFrames = 40;
        let stableFrames = 0;
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          const y = from + dist * eased;
          const lenis = window.__nxrLenis;
          if (lenis) lenis.scrollTo(y, { immediate: true });
          else window.scrollTo(0, y);
          if (t < 1) {
            snapRaf = requestAnimationFrame(tick);
            return;
          }
          stableFrames = Math.abs(window.scrollY - target) <= 1 ? stableFrames + 1 : 0;
          if (stableFrames < 5 && holdFrames-- > 0) snapRaf = requestAnimationFrame(tick);
        };
        snapRaf = requestAnimationFrame(tick);
      };
      // Analytic mapping helpers, all from the live scroll position (never
      // from measured card rects — those carry the scrub tween's settling
      // lag and would aim glides at a moving target): card i sits centred
      // once progress = (entryOffset + i·step)/total, now that startX/endX
      // are anchored to the track's real layout origin via trackBaseLeft().
      const pOf = (i: number) => {
        const total = amount();
        const step = cardStep();
        return total && step ? (entryOffset() + i * step) / total : 0;
      };
      const progressNow = (st: ScrollTrigger) => (window.scrollY - st.start) / (st.end - st.start);
      const scrollAt = (st: ScrollTrigger, p: number) => st.start + p * (st.end - st.start);
      const nearestIdx = (p: number) => {
        let bi = 0;
        let bd = Infinity;
        for (let i = 0; i < cards.length; i++) {
          const d = Math.abs(p - pOf(i));
          if (d < bd) {
            bd = d;
            bi = i;
          }
        }
        return bi;
      };

      const trySnap = () => {
        const st = tl.scrollTrigger;
        if (!st || !st.isActive) return;
        const total = amount();
        if (!total || !cardStep()) return;
        const progress = progressNow(st);
        const bestP = pOf(nearestIdx(progress));
        // Pixel-precise: skip only when already within ~1.5px of centre.
        if (Math.abs(progress - bestP) * total < 1.5) return;
        glideTo(scrollAt(st, bestP));
      };
      const cancelSnap = () => {
        cancelAnimationFrame(snapRaf);
        window.clearTimeout(snapTimer);
      };
      window.addEventListener("wheel", cancelSnap, { passive: true });
      window.addEventListener("touchstart", cancelSnap, { passive: true });

      const tl = gsap.timeline({
        scrollTrigger: {
          // The STICKY is the trigger (not the section): the section has
          // vertical padding above the sticky, and triggering on it pinned
          // the sticky ~60px below the viewport top for the whole reel.
          trigger: sticky,
          start: "top top",
          end: () => `+=${amount()}`,
          // 0.5 (not 1): Lenis already smooths the scroll itself, so a full
          // second of extra scrub lag doubled up into rubber-banding —
          // most visible as cards sliding back into place when re-entering
          // the section from below.
          scrub: 0.5,
          pin: sticky,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: () => {
            updateSpiral();
            window.clearTimeout(snapTimer);
            // Short idle window so cards "click" into selection as you
            // pass them rather than long after the scroll stops. The
            // glide's own writes re-enter here, but converge: once within
            // 1.5px, trySnap no-ops.
            snapTimer = window.setTimeout(trySnap, 140);
          },
          onRefresh: () => {
            gsap.set(track, { x: startX() });
            updateSpiral();
          },
        },
      });
      tl.fromTo(track, { x: startX }, { x: endX, ease: "none" }, 0);

      updateSpiral();

      const cleanups: Array<() => void> = [];
      cleanups.push(() => {
        window.removeEventListener("wheel", cancelSnap);
        window.removeEventListener("touchstart", cancelSnap);
        cancelSnap();
      });

      // ---- Mobile pagination: ONE card per swipe. A flick's inertia would
      // otherwise fly past several cards; instead, on touchend we glide to
      // exactly one step from the card that was current at touchstart (or
      // just finish centring that card if it hadn't arrived yet — e.g. the
      // very first swipe, which brings the off-screen first card in). At
      // the reel's ends, swiping outward is left alone so the user can
      // leave the section naturally. glideTo's per-frame immediate writes
      // also neutralise Lenis' leftover touch inertia each frame.
      if (window.innerWidth <= 900) {
        let touchIdx = 0;
        let touchY = 0;
        let touchInPin = false;
        const onTouchStart = (e: TouchEvent) => {
          const st = tl.scrollTrigger;
          touchInPin = !!st?.isActive;
          if (!st || !touchInPin) return;
          touchY = e.touches[0]?.clientY ?? 0;
          touchIdx = nearestIdx(progressNow(st));
        };
        const onTouchEnd = (e: TouchEvent) => {
          const st = tl.scrollTrigger;
          if (!touchInPin || !st?.isActive) return;
          touchInPin = false;
          const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
          const p = progressNow(st);
          const eps = 0.02;
          let targetIdx: number | null = null;
          if (dy > 25) {
            if (p < pOf(touchIdx) - eps) targetIdx = touchIdx;
            else if (touchIdx < cards.length - 1) targetIdx = touchIdx + 1;
          } else if (dy < -25) {
            if (p > pOf(touchIdx) + eps) targetIdx = touchIdx;
            else if (touchIdx > 0) targetIdx = touchIdx - 1;
          }
          if (targetIdx !== null) glideTo(scrollAt(st, pOf(targetIdx)));
        };
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchend", onTouchEnd, { passive: true });
        cleanups.push(() => {
          window.removeEventListener("touchstart", onTouchStart);
          window.removeEventListener("touchend", onTouchEnd);
        });
      }

      // Idle micro-drift (±2° yaw / ±1.1° pitch, per-card phase offsets):
      // keeps the environment reflections crawling across the convex face
      // even when the user isn't scrolling or hovering. Without it, a domed
      // card facing the camera dead-on renders a perfectly static highlight
      // and is indistinguishable from a flat one — motion of the reflection
      // IS the depth cue. Gated to the section being on screen so it costs
      // nothing while the user is elsewhere on the page.
      let sectionVisible = false;
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          sectionVisible = self.isActive;
        },
      });
      const idleTick = () => {
        if (!sectionVisible) return;
        const t = gsap.ticker.time;
        cards.forEach((_, i) => {
          idleYaw[i] = 2 * Math.sin(t * 0.55 + i * 1.7);
          idlePitch[i] = 1.1 * Math.sin(t * 0.38 + i * 2.4);
          push(i);
        });
      };
      gsap.ticker.add(idleTick);
      cleanups.push(() => gsap.ticker.remove(idleTick));

      cards.forEach((card, i) => {
        // ---- Cursor tilt with inertia: NOT a flat instant rotateX/rotateY —
        // quickTo gives it weight (0.9s, no snap). Hovering also pushes this
        // card's position into the shared disturbance store so the ambient
        // canvas ripples nearby.
        const rotX = gsap.quickTo(live[i], "rotationX", { duration: 0.9, ease: "power2.out", onUpdate: () => push(i) });
        const rotY = gsap.quickTo(live[i], "rotationY", { duration: 0.9, ease: "power2.out", onUpdate: () => push(i) });
        const liftZ = gsap.quickTo(live[i], "z", { duration: 0.9, ease: "power2.out", onUpdate: () => push(i) });

        let decayTween: gsap.core.Tween | null = null;

        const onMove = (e: MouseEvent) => {
          const r = card.getBoundingClientRect();
          const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
          const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;

          rotY(nx * 9);
          rotX(-ny * 7);
          liftZ(18);

          decayTween?.kill();
          useCardDisturbance.getState().setPoint(i, e.clientX / window.innerWidth, e.clientY / window.innerHeight, 0.8);
        };

        const onLeave = () => {
          // Slow return with a slight overshoot — never an instant snap.
          gsap.to(live[i], { rotationX: 0, rotationY: 0, z: 0, duration: 1.1, ease: "elastic.out(1, 0.6)", onUpdate: () => push(i) });

          decayTween?.kill();
          const r = card.getBoundingClientRect();
          const cx = (r.left + r.width / 2) / window.innerWidth;
          const cy = (r.top + r.height / 2) / window.innerHeight;
          const proxy = { strength: 0.8 };
          decayTween = gsap.to(proxy, {
            strength: 0,
            duration: 0.7,
            ease: "power2.out",
            onUpdate: () => useCardDisturbance.getState().setPoint(i, cx, cy, proxy.strength),
            onComplete: () => useCardDisturbance.getState().clearPoint(i),
          });
        };

        card.addEventListener("mousemove", onMove);
        card.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          card.removeEventListener("mousemove", onMove);
          card.removeEventListener("mouseleave", onLeave);
          decayTween?.kill();
          useCardDisturbance.getState().clearPoint(i);
        });
      });

      return () => cleanups.forEach((fn) => fn());
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const cards = Array.from(section.querySelectorAll<HTMLElement>(".nxr-srv-card"));

    function animCount(el: Element | null, target: number, suffix = "", duration = 1800) {
      if (!el) return;
      const start = Date.now();
      function frame() {
        const p = Math.min((Date.now() - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * ease);
        (el as HTMLElement).textContent = val + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      frame();
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    const card2 = cards[1];
    if (card2) {
      function loopChatAuto(card: HTMLElement) {
        const msgs = Array.from(card.querySelectorAll<HTMLElement>(".anim-chat-msg"));
        if (!msgs.length) return;
        msgs.forEach((m) => {
          m.style.transition = "none";
          m.style.opacity = "0";
          m.style.transform = "translateY(6px)";
        });
        timers.push(
          setTimeout(() => {
            msgs.forEach((m, i) => {
              timers.push(
                setTimeout(() => {
                  m.style.transition = "opacity .4s, transform .4s";
                  m.style.opacity = "1";
                  m.style.transform = "translateY(0)";
                }, i * 700)
              );
            });
            timers.push(setTimeout(() => loopChatAuto(card), msgs.length * 700 + 1800));
          }, 50)
        );
      }
      timers.push(setTimeout(() => loopChatAuto(card2), 300));
    }

    // The anims are the glass card's ONLY content now (no hover text-swap),
    // so every demo self-loops on all devices — the hover-triggered variants
    // (flow build on mouseenter, app count-up on hover) are gone with the
    // layout that motivated them.
    {
      const instant = (els: HTMLElement[], styles: Partial<CSSStyleDeclaration>) => {
        els.forEach((el) => {
          el.style.transition = "none";
          Object.assign(el.style, styles);
        });
      };
      const restore = (els: HTMLElement[]) => {
        els.forEach((el) => {
          el.style.transition = "";
        });
      };

      function loopFlow(card: HTMLElement) {
        const nodesL = Array.from(card.querySelectorAll<HTMLElement>(".anim-flow-node-l"));
        const connsL = Array.from(card.querySelectorAll<HTMLElement>(".anim-flow-conn-l"));
        const nodeC = card.querySelector<HTMLElement>(".anim-flow-node-c");
        const connsR = Array.from(card.querySelectorAll<HTMLElement>(".anim-flow-conn-r"));
        const nodesR = Array.from(card.querySelectorAll<HTMLElement>(".anim-flow-node-r"));

        nodesL.forEach((n) => {
          n.style.transition = "none";
          n.classList.remove("vis");
        });
        connsL.forEach((c) => {
          c.style.transition = "none";
          c.classList.remove("vis");
        });
        if (nodeC) {
          nodeC.style.transition = "none";
          nodeC.classList.remove("vis");
        }
        connsR.forEach((c) => {
          c.style.transition = "none";
          c.classList.remove("vis");
        });
        nodesR.forEach((n) => {
          n.style.transition = "none";
          n.classList.remove("vis");
        });

        card.querySelector(".anim-flow-svg")?.getBoundingClientRect();

        timers.push(
          setTimeout(() => {
            nodesL.forEach((n) => {
              n.style.transition = "";
              n.classList.add("vis");
            });
            timers.push(
              setTimeout(() => {
                connsL.forEach((c) => {
                  c.style.transition = "";
                  c.classList.add("vis");
                });
                timers.push(
                  setTimeout(() => {
                    if (nodeC) {
                      nodeC.style.transition = "";
                      nodeC.classList.add("vis");
                    }
                    timers.push(
                      setTimeout(() => {
                        connsR.forEach((c) => {
                          c.style.transition = "";
                          c.classList.add("vis");
                        });
                        timers.push(
                          setTimeout(() => {
                            nodesR.forEach((n) => {
                              n.style.transition = "";
                              n.classList.add("vis");
                            });
                            timers.push(setTimeout(() => loopFlow(card), 2500));
                          }, 500)
                        );
                      }, 400)
                    );
                  }, 600)
                );
              }, 450)
            );
          }, 50)
        );
      }

      function loopSeo(card: HTMLElement) {
        const lines = Array.from(card.querySelectorAll<HTMLElement>(".anim-gsc-line-clicks, .anim-gsc-line-impr"));
        const areas = Array.from(card.querySelectorAll<HTMLElement>(".anim-gsc-area-clicks, .anim-gsc-area-impr"));
        const dot = card.querySelector<HTMLElement>(".anim-gsc-dot");
        const cursor = card.querySelector<HTMLElement>(".anim-gsc-cursor");

        instant(lines, { strokeDashoffset: "340" } as Partial<CSSStyleDeclaration>);
        instant(areas, { opacity: "0" });
        if (dot) {
          dot.style.transition = "none";
          dot.style.opacity = "0";
        }
        if (cursor) {
          cursor.style.transition = "none";
          cursor.style.opacity = "0";
        }

        card.querySelector(".anim-gsc-chart")?.getBoundingClientRect();

        restore(lines);
        restore(areas);
        lines.forEach((l) => (l.style.strokeDashoffset = "0"));
        areas.forEach((a) => (a.style.opacity = "1"));
        if (dot) {
          dot.style.transition = "";
          dot.style.opacity = "1";
        }
        if (cursor) {
          cursor.style.transition = "";
          cursor.style.opacity = "1";
        }

        timers.push(setTimeout(() => loopSeo(card), 4200));
      }

      function loopApp(card: HTMLElement) {
        const rows = Array.from(card.querySelectorAll<HTMLElement>(".anim-app-row"));
        const bars = Array.from(card.querySelectorAll<HTMLElement>(".anim-app-stat-bar-fill"));
        const sv = card.querySelector<HTMLElement>(".anim-app-stat-val[data-target]");
        instant(rows, { opacity: "0", transform: "translateX(-4px)" });
        instant(bars, { transform: "scaleX(0)" });
        if (sv) sv.textContent = "0";
        card.querySelector(".anim-app-phone-body")?.getBoundingClientRect();
        restore(rows);
        restore(bars);
        rows.forEach((r) => {
          r.style.opacity = "1";
          r.style.transform = "translateX(0)";
        });
        bars.forEach((b) => (b.style.transform = "scaleX(1)"));
        if (sv) animCount(sv, 2840, "", 2000);
        timers.push(setTimeout(() => loopApp(card), 4500));
      }

      timers.push(
        setTimeout(() => {
          if (cards[2]) loopFlow(cards[2]);
          if (cards[3]) loopSeo(cards[3]);
          if (cards[4]) loopApp(cards[4]);
        }, 300)
      );
    }

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  if (reducedMotion) {
    // See ProcesoReel.tsx for why this needs a distinct `key`: GSAP's
    // pin-spacer, inserted outside React's tracking, corrupts reconciliation
    // if React tries to diff into it instead of fully remounting. `sectionRef`
    // stays attached (the rect-tracking effect above needs it so the R3F
    // meshes still render, statically, behind this static layout) — only the
    // pin-only refs (sticky/content/track) are omitted, which is what makes
    // the useGSAP effect above no-op.
    return (
      <section key="static" id="nxr-servicios" ref={sectionRef} className="nxr-servicios-static">
        <div className="nxr-servicios-inner">
          <div className="nxr-reveal">
            <p className="nxr-section-label">Servicios</p>
            <h2 className="nxr-section-h2" ref={titleRef}>
              Todo lo que tu negocio necesita para{" "}
              <span className="nxr-gradient-text-salmon">crecer en la era de la IA.</span>
            </h2>
          </div>
          <div className="nxr-servicios-static-list">
            {CARDS.map((c) => (
              <div key={c.href} className="nxr-srv-slide">
                <GlassCard c={c} />
                <Caption c={c} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="nxr-servicios" ref={sectionRef}>
      <div className="nxr-servicios-sticky" ref={stickyRef}>
        <div className="nxr-servicios-content" ref={contentRef}>
          <div className="nxr-servicios-head nxr-reveal">
            <p className="nxr-section-label">Servicios</p>
            <h2 className="nxr-section-h2" ref={titleRef}>
              Todo lo que tu negocio necesita para{" "}
              <span className="nxr-gradient-text-salmon">crecer en la era de la IA.</span>
            </h2>
          </div>

          {/*
            Each `.nxr-srv-slide` is one reel item: the `.nxr-srv-card`
            glass "screen" (holding ONLY the mini-anim; its live rect is
            what positions/sizes the R3F mesh — see components/scene/
            ServiciosCardsLayer.tsx) plus the flat `.nxr-srv-caption` below
            it with the real, crawlable text content and CTA. The track is
            horizontally scrubbed by scroll (see useGSAP above) while each
            slide additionally arcs in Y; the glass alone carries the
            cover-flow yaw.
          */}
          <div className="nxr-servicios-track" ref={trackRef}>
            {CARDS.map((c) => (
              <div key={c.href} className="nxr-srv-slide">
                <GlassCard c={c} />
              </div>
            ))}
          </div>

          {/* Fixed bottom-left caption stack: all five captions occupy the
              same grid cell; updateSpiral crossfades (opacity + blur) each
              one as its card passes through the reel's centre. */}
          <div className="nxr-servicios-captions">
            {CARDS.map((c) => (
              <Caption key={c.href} c={c} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
