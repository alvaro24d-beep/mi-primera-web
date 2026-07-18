"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCurvedWords } from "@/hooks/useCurvedWords";
import { scrambleElement } from "@/hooks/useTextScramble";
import Link from "next/link";
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
      {/* Tilt wrapper: the caption CONTAINER spans nearly the full viewport
          on desktop (text left, CTA pinned right), so tilting IT threw the
          near (left) edge's projection off-screen. Only this ~620px text
          block rides the perspective plane; the CTA stays at normal depth. */}
      <div className="nxr-srv-caption-tilt">
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
      </div>
      <div className="nxr-srv-cta-wrap">
        <Link href={c.href} className="nxr-srv-cta nxr-glass-edge">
          <span className="nxr-glass-edge-content">{c.cta}</span>
          {/* Flecha ↗ (arriba-derecha), estilo lucide arrow-up-right: la
              diagonal + la esquina superior derecha — el gesto "abrir"
              de la referencia alche.studio ("More Works ↗"). */}
          <svg className="nxr-glass-edge-content" viewBox="0 0 24 24">
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </Link>
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

  // Mobile only: the per-service caption text curves like every other text
  // block. The WHOLE tilt block is one geometry sheet — targeting
  // tag/title/desc as separate elements gave each its own pivot/width and
  // they visibly sat on DIFFERENT planes ("tiene que verse exactamente en
  // el mismo plano de perspectiva cada parte"). The pills' words are split
  // but excluded from the bow: bowing text inside a pill shifts it out of
  // its rounded border. The block-level tilt stays with the CSS rule;
  // desktop keeps its separately-tuned flat look.
  useCurvedWords(sectionRef, ".nxr-srv-caption-tilt", "left", [reducedMotion], {
    bowOnly: true,
    onlyBelow: 901,
    exclude: ".nxr-srv-pills",
    // Keeps this section's tuned bow while the sitewide MOBILE profile was
    // softened to 0.04 ("reduce la distorsión dinámica... excepto Servicios").
    fan: 0.07,
  });

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
  // never rotating themselves. Kept as its own effect, separate from the
  // per-card mini-animation behaviors below (chat auto-loop, flow hover,
  // app count-up), which are unrelated content demos and untouched by this
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

      // ---- Section-title moment, split across TWO drivers on one
      // viewport-FIXED element (see .nxr-servicios-head CSS):
      //  1) APPROACH scrub (below): fades the phrase in while the sticky is
      //     still climbing to the top — i.e. while Intro's cards are still
      //     visible above ("que empiece a salir cuando aún las cards de
      //     intro están arriba"). Fixed positioning = zero travel even
      //     though the page is scrolling.
      //  2) The pin timeline's PROLOGUE (buildTl below): long hold, then
      //     the fade-out that overlaps the first card's materialization.
      // The handoff is clean by construction: the approach range ends
      // exactly where the pin starts, and the pin timeline never touches
      // opacity before its fade-out — whatever the approach wrote (1) just
      // persists.
      const headTitle = q(".nxr-servicios-head .nxr-section-h2")[0] as HTMLElement | undefined;
      if (headTitle) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: sticky,
              // Starts while the previous section's cards still occupy the
              // upper ~70% of the screen; fully bright the moment the pin
              // engages.
              start: "top 70%",
              end: "top top",
              scrub: 0.5,
            },
          })
          .fromTo(
            headTitle,
            { opacity: 0, filter: "blur(18px)" },
            { opacity: 1, filter: "blur(0px)", ease: "none" }
          );
      }

      // One live transform per card, owned by the hover-tilt quickTo
      // instances below. The scroll-driven spiral yaw and the idle drift are
      // kept in their OWN arrays and summed at push time — if they all wrote
      // live[i].rotationY the hover's elastic return-to-zero would erase the
      // spiral's yaw (and vice versa) whenever they overlapped.
      const live = cards.map(() => ({ x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, scale: 1 }));
      const scrollYaw = cards.map(() => 0);
      const scrollZ = cards.map(() => 0);
      // Desktop-only extra foreshortening on top of the natural perspective
      // shrink from scrollZ: derived from the SAME theta driving yaw/z (not
      // an independent falloff), so it reads as "the card's face turning
      // away" rather than a separate cosmetic shrink — this is what sells
      // cards receding back around the drum instead of merely sliding
      // sideways across the screen (mobile keeps its prior, untouched feel).
      const scrollScale = cards.map(() => 1);
      // Spiral-tail dissolve, BOTH sides and BOTH platforms (was a desktop
      // exit-only fade): past the immediate neighbour a card leaves the
      // linear lane and rides the helix's return arc — it stops tracking the
      // track's x, climbs/sinks harder, recedes in z and fades to nothing.
      // Cards therefore vanish INTO DEPTH behind the reel instead of sliding
      // off the left edge, and entering ones materialize from that same
      // depth instead of walking in from the right edge ("no salen del
      // lateral, salen de detrás siguiendo la espiral").
      const tailFade = cards.map(() => 1);
      const idleYaw = cards.map(() => 0);
      const idlePitch = cards.map(() => 0);
      const inners = cards.map((card) => card.querySelector<HTMLElement>(".nxr-srv-inner"));

      // Ambient mouse tilt, shared equally by every card regardless of
      // whether the cursor is actually over any given one — a small "the
      // whole reel reacts to you" cue, distinct from the per-card hover
      // tilt below (which only fires for the card directly under the
      // pointer). Target updates instantly on mousemove; the actual value
      // eases toward it inside idleTick below (already running every frame
      // while the section is visible), so it reads as a soft, weighted
      // reaction rather than snapping.
      const mouseTarget = { nx: 0, ny: 0 };
      const mouseCurrent = { nx: 0, ny: 0 };
      const MOUSE_MAX_YAW = 4;
      const MOUSE_MAX_PITCH = 2.5;
      const onWindowMouseMove = (e: MouseEvent) => {
        mouseTarget.nx = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseTarget.ny = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("mousemove", onWindowMouseMove, { passive: true });

      // Hover tilt target, eased toward every frame in idleTick below — the
      // SAME per-frame lerp handles both the cursor pulling a card toward it
      // AND the card settling back to neutral on mouseleave (target just
      // becomes {0,0,0}), so entering and leaving are the exact same motion
      // instead of the old mismatch (quickTo's fast-start ease snapping
      // toward the cursor on entry vs. a slow elastic-out easing back on
      // leave).
      const hoverTarget = cards.map(() => ({ rotX: 0, rotY: 0, z: 0 }));
      const HOVER_SMOOTH = 0.06;

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
        const rotX = live[i].rotationX + idlePitch[i] + mouseCurrent.ny * -MOUSE_MAX_PITCH;
        const rotY = live[i].rotationY + scrollYaw[i] + idleYaw[i] + mouseCurrent.nx * MOUSE_MAX_YAW;
        const z = live[i].z + scrollZ[i];
        const scale = live[i].scale * scrollScale[i];
        const opacity = tailFade[i];
        useServiciosCardsRegistry.getState().setTransform(i, { ...live[i], rotationX: rotX, rotationY: rotY, z, scale, opacity });
        const inner = inners[i];
        if (inner) gsap.set(inner, { rotationX: -rotX, rotationY: rotY, z, scale, opacity });
      };

      // NO one-shot content entrance (the old opacity/scale 0.92→1 tween on
      // section approach): with the runway gone the pin starts ~1 viewport
      // after the section top, so that tween was still mid-flight when the
      // first cards materialized — its scale shrank every card's measured
      // rect, ServiciosCardsLayer's dims gate (±1px) saw a mismatch and
      // HID the meshes: content without glass, glass popping in late ("las
      // cards salen bugeadas"). The spiral materialization IS the entrance
      // now; the content container starts at identity, nothing to animate.

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
      // Rest position of the FIRST card: exactly at the spiral tail's END
      // (opacity 0) on both platforms, so NOTHING is visible in the reel
      // during the pre-pin approach — any card visible there inevitably
      // reads as "riding up with the page" (the sticky block is still in
      // normal flow), which survived the previous half-dissolved attempt
      // ("se sigue viendo subir por abajo"). The very first pixel of pin
      // scroll starts materializing it from the helix's depth instead.
      // TAIL_END is declared below but only read when this is CALLED (first
      // use: the gsap.set(track) after the constants), so no TDZ issue.
      const entryOffset = () => cardStep() * (TAIL_END + 0.02);
      // PROLOGUE: scroll distance at the very start of the pin where the
      // track holds still and the title overlay plays its whole blur moment
      // (replaces the old 165vh/70vh runway above the sticky — the pin, and
      // with it the section, now starts as soon as the sticky reaches the
      // top: "que la sección empiece antes").
      // Desktop 1.4 (antes 1.7 — "reduce un poco el scroll para pasar la
      // frase"). Móvil DE VUELTA a 1.35: la bajada a 1.1 (V15.79) rompió la
      // entrada de las cards en teléfono real dos veces seguidas ("no salen
      // del lado... sigue mal, antes funcionaba bien") — todo el sistema de
      // primera llegada (muro + snap + cap de flick a 1.35 pantallas) estaba
      // afinado contra esta geometría, y 1.35 es el único valor validado en
      // dispositivo real. No volver a bajarlo sin re-validar en teléfono
      // físico, no solo en el arnés emulado.
      const PROLOGUE = () => Math.round(window.innerHeight * (isDesktopUI ? 1.4 : 1.35));
      const startX = () => centredX() + entryOffset();
      // Pin distance = prologue + actual track travel; the track only moves
      // during the post-prologue stretch (1px of scroll = 1px of x, as
      // before).
      const moveAmount = () => entryOffset() + Math.max(0, track.scrollWidth - cardWidth());
      const amount = () => PROLOGUE() + moveAmount();
      const endX = () => startX() - moveAmount();

      // Smaller arc on phones: the stretched glass there nearly fills the
      // space between heading and captions, so a tall arc would ride the
      // departing card into either overlay. Desktop's is deliberately much
      // taller than the drum angle alone needs, so the helix's climb reads
      // clearly instead of looking like a flat horizontal strip.
      const isDesktopUI = window.innerWidth > 900;
      const ARC_AMPLITUDE = isDesktopUI ? 130 : 28;
      // Half-angle of the carousel drum: how far a card has turned by the
      // time it reaches the viewport edge. Bigger angle = tighter cylinder
      // (smaller radius), cards sweep BACK faster and face the axis harder.
      // Mobile's is deliberately mild: the neighbouring cards need to stay
      // VISIBLY peeking in at the edges (see `.nxr-srv-slide`'s narrower
      // mobile width in globals.css) — too tight a drum pulls their
      // projected position toward centre via perspective foreshortening
      // faster than they travel off-screen, making them fade from view
      // well before the raw anchor rect would otherwise be culled.
      const MAX_YAW_DEG = isDesktopUI ? 58 : 18;
      const THETA_MAX = (MAX_YAW_DEG * Math.PI) / 180;
      // Spiral-tail range, in CARD-STEP units (distance between adjacent
      // slides), applied on BOTH sides (enter/exit) and BOTH platforms.
      // Beyond TAIL_START the card peels off the linear lane: it pulls back
      // toward the drum's axis (never crossing the screen edge), gains extra
      // depth and vertical drift along the helix (exit climbs, entry sits
      // lower), and dissolves — fully gone by TAIL_END.
      // CARD-STEPS, not the nx half-viewport units: on desktop one step ≈
      // 1.08·halfW so both scales roughly agree, but on MOBILE one step ≈
      // 1.5·halfW — the first version measured the tail in nx and silently
      // put the resting neighbours (±1 step = nx ±1.5) INSIDE the dissolve,
      // wiping out the edge peek ("en móvil se tienen que ver un poco las
      // cards que están a los lados"). In step units the neighbour is 1.0 by
      // definition on every viewport, so TAIL_START > 1 keeps its peek fully
      // opaque and the dissolve happens across the SECOND step out.
      const TAIL_START = isDesktopUI ? 0.9 : 1.05;
      // Mobile 1.9: smoother than the original 1.75 (dissolve spans ~0.85
      // steps ≈ 250px) but STRICTLY under TAIL_START + 1.0. The 2.3 attempt
      // ("entrada más suave") made the dissolve span MORE than one card-step
      // — so card N+1 began materializing at the edge park while card N was
      // still fading in there itself: on arrival the first card appeared,
      // and "the same card" immediately re-appeared behind it and turned
      // out to be Agentes IA ("sale otra más que no debería estar"). With
      // the span < 1 step, the park hosts at most ONE materializing card at
      // any moment, by construction.
      const TAIL_END = isDesktopUI ? 1.35 : 1.9;
      // Extra z recession (px) at full tail, on top of the drum's own.
      const TAIL_DEPTH = isDesktopUI ? 260 : 140;
      // Extra vertical drift (px) at full tail, continuing the helix pitch.
      const TAIL_CLIMB = isDesktopUI ? 110 : 60;
      // SOFT park: fraction of the beyond-the-park travel the card KEEPS.
      // The hard park (factor 0) froze the exiting card at the peek slot and
      // its whole dissolve read as a static fade on mobile ("hace como un
      // desvanecimiento fijo, quiero que se mueva"). With a residual drift
      // the card keeps gliding outward while it climbs/recedes/fades —
      // motion all the way through. Calibrated against the screen edge: on
      // mobile (peek sliver ≈ 39px, max overshoot 0.9 steps ≈ 266px), 0.15
      // puts opacity at ~0.03 exactly when the last pixels would touch the
      // edge — it still never visibly leaves through the side. Desktop has
      // ~270px of margin at its park, so 0.2 is nowhere near the edge.
      const PARK_DRIFT = isDesktopUI ? 0.2 : 0.15;

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
      // Runs BOTH on ScrollTrigger updates AND on every ticker frame while
      // the section is visible (see idleTick): the pin's scrub tween keeps
      // easing the track for up to ~0.5s AFTER the scroll itself has
      // stopped, and with rect-derived values only recomputed on scroll
      // events, that whole tail played out with FROZEN yaw/arc/caption
      // states which then jumped to their settled values at once ("pega un
      // salto de golpe para terminar de posicionarse"). Per-frame recompute
      // keeps everything glued to the live rects through the tail, so the
      // card eases into its centred state continuously. Does NOT push —
      // callers do (idleTick already pushes every card every visible frame).
      const lastNx = slides.map(() => NaN);
      // Caption-desc scramble bookkeeping: each service paragraph plays the
      // Intro-style scramble entrance every time ITS caption takes over
      // (visibility crossing up through 0.55 — the same threshold the
      // pointer-events gate uses). Cached lookups: this runs per frame.
      const lastCapVis = captions.map(() => 0);
      const capDescs = captions.map((c) => c.querySelector<HTMLElement>(".nxr-srv-desc"));
      // Style-write caches (perf pass: Servicios measured 13fps at CPU×3 —
      // the reel was re-writing every style every frame): captions only
      // rewrite when their quantized visibility moved, zIndex/pointerEvents
      // only on real change.
      const lastCapShown = captions.map(() => -1);
      const lastZ = slides.map(() => -1);
      const lastPE = slides.map(() => "");
      // DEDUPE guard: updateSpiral runs from BOTH the pin's onUpdate (via
      // Lenis' rAF) and idleTick (gsap ticker) — the same browser frame ran
      // the whole rect-read + style-write pass TWICE. One pass per ~frame.
      let lastSpiralAt = 0;
      const updateSpiral = () => {
        const nowMs = performance.now();
        if (nowMs - lastSpiralAt < 4) return;
        lastSpiralAt = nowMs;
        // ---- READ pass: every layout read happens BEFORE any style write.
        // The previous shape interleaved them per slide (read rect → write
        // styles → read next rect), so each subsequent read forced a
        // synchronous reflow against the just-dirtied styles — one layout
        // per SLIDE per frame instead of one per frame, the top main-thread
        // cost in the 13fps CPU×3 profile of this section.
        const stickyRect = sticky.getBoundingClientRect();
        const centerX = stickyRect.left + stickyRect.width / 2;
        const halfW = stickyRect.width / 2;
        const drumR = halfW / Math.sin(THETA_MAX);
        const stepPx = cardStep() || halfW;
        const slideReads = slides.map((slide) => ({
          r: slide.getBoundingClientRect(),
          slideX: Number(gsap.getProperty(slide, "x")) || 0,
        }));

        // ---- COMPUTE + WRITE pass (no more layout reads below).
        slides.forEach((slide, i) => {
          const { r, slideX } = slideReads[i];
          // Base lane position: the rect minus the slide's OWN tail x-pull
          // below — nx must come from the track's layout alone, or the pull
          // would feed back into the very offset that computes it.
          const slideCenterX = r.left + r.width / 2 - slideX;
          const nxRaw = (slideCenterX - centerX) / halfW;
          const nx = gsap.utils.clamp(-1.6, 1.6, nxRaw);
          // Tail distance in CARD-STEP units (see TAIL_START/TAIL_END).
          const steps = Math.abs(slideCenterX - centerX) / stepPx;

          const theta = gsap.utils.clamp(-1.1, 1.1, nx) * THETA_MAX;
          // Mobile EXIT side: no tail at all — the departing card slides out
          // through the left edge as a rigid carousel, keeping its step
          // distance to the card on its right ("quiero que desaparezca
          // yéndose por la izquierda... como un carrusel"; supersedes the
          // earlier dissolve-behind ending there). The ENTRY side keeps the
          // materialization tail on every device; desktop keeps both sides.
          const tailActive = isDesktopUI || nxRaw > 0;
          // Tail parameter: 0 on the lane, 1 fully dissolved. Squared where
          // it feeds motion so the card PEELS off the lane smoothly instead
          // of kinking at the threshold; linear for the fade itself.
          const tail = tailActive
            ? gsap.utils.clamp(0, 1, (steps - TAIL_START) / (TAIL_END - TAIL_START))
            : 0;
          const tail2 = tail * tail;
          scrollYaw[i] = (theta * 180) / Math.PI;
          scrollZ[i] = -drumR * (1 - Math.cos(theta)) - TAIL_DEPTH * tail2;
          scrollScale[i] = isDesktopUI ? Math.cos(theta) : 1;
          tailFade[i] = 1 - tail;

          // Slide/caption style writes only when this slide actually moved —
          // at rest the per-frame recompute above costs rect reads only.
          // GATE ON THE UNCLAMPED VALUE. The clamped nx pins far cards at
          // ±1.6, so while a big instant scroll write (first-arrival wall,
          // snap glide, refresh) had the scrub dragging the track hundreds
          // of px, their "nx didn't change" — this gate skipped the park-x
          // rewrite and a STALE pull (computed for the old base position)
          // shoved them across the viewport while the per-frame tailFade
          // (never gated, never clamped) was fading them IN: THE ghost card
          // crossing the screen on mobile arrival ("sale otra card y cambia
          // a la de agentes ia"). Caught live in the Playwright repro log:
          // slide 1 at left=-134, opacity 0.73, mid catch-up.
          if (Math.abs(nxRaw - lastNx[i]) < 0.0004) return;
          lastNx[i] = nxRaw;

          gsap.set(slide, {
            // SOFT park at the neighbour's slot (1 card-step from centre):
            // beyond it the card cancels most of the track's x — keeping
            // PARK_DRIFT of the overshoot as residual outward glide — and
            // plays the tail (climb, depth, dissolve) while still visibly
            // moving. Full-cancel (hard park) made mobile exits read as a
            // static fade; no cancel at all made the dissolve happen
            // off-screen on mobile (screen narrower than one step). The
            // drift factor is edge-calibrated in PARK_DRIFT's comment.
            x: tailActive
              ? -Math.sign(nx) * Math.max(0, Math.abs(slideCenterX - centerX) - stepPx) * (1 - PARK_DRIFT)
              : 0,
            y: ARC_AMPLITUDE * nx + Math.sign(nx) * tail2 * TAIL_CLIMB,
          });
          // Depth-correct DOM painting (WebGL sorts by real z; the DOM needs
          // this hint — slides are flex items, so z-index applies without
          // position) + hover shielding for near-invisible tails. Written
          // DIRECTLY and only on real change: these mutate rarely, and the
          // per-frame gsap.set of identical values was measurable style
          // churn.
          const zi = 50 - Math.round(Math.abs(nx) * 10);
          if (zi !== lastZ[i]) {
            lastZ[i] = zi;
            slide.style.zIndex = String(zi);
          }
          const pe = tail > 0.5 ? "none" : "auto";
          if (pe !== lastPE[i]) {
            lastPE[i] = pe;
            slide.style.pointerEvents = pe;
          }

          const cap = captions[i];
          if (cap) {
            const vis = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0.55, 0.2, 0, 1, Math.abs(nx)));
            // Scramble the service paragraph as its caption takes over
            // ("los párrafos de servicios" join the Intro entrance).
            if (vis >= 0.55 && lastCapVis[i] < 0.55) {
              const d = capDescs[i];
              if (d) scrambleElement(d);
            }
            lastCapVis[i] = vis;
            // Quantized to 2% steps and only written on change: the blur()
            // filter string + opacity + transform on 5 captions EVERY frame
            // was a top style-churn source in the 13fps profile; a 0.02
            // opacity step is invisible through the crossfade.
            const visQ = Math.round(vis * 50) / 50;
            if (visQ !== lastCapShown[i]) {
              lastCapShown[i] = visQ;
              gsap.set(cap, {
                opacity: visQ,
                filter: `blur(${((1 - visQ) * 5).toFixed(1)}px)`,
                y: (1 - visQ) * 14,
                pointerEvents: visQ > 0.5 ? "auto" : "none",
              });
            }
          }
        });
      };
      // Same double-caller dedupe as updateSpiral (onUpdate + idleTick hit
      // this in the same browser frame): 5 × (registry mutation + gsap.set
      // of a 3D transform on the inner) once per frame, not twice.
      let lastPushAt = 0;
      const pushAll = () => {
        const nowMs = performance.now();
        if (nowMs - lastPushAt < 4) return;
        lastPushAt = nowMs;
        for (let i = 0; i < cards.length; i++) push(i);
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
      // Mobile: whether the reel has already presented its first card. A
      // hard flick from Intro carries Lenis' syncTouch inertia straight
      // through the prologue and can OVERSHOOT past card 0 — the idle snap
      // then corrected to whatever card was nearest with its short ease-out,
      // which read as a stray card sweeping through before the first one
      // settled ("sale otra súper rápido y se pasa sola"). Until this flag
      // flips, the first settle is always card 0, on the long soft
      // page-style glide.
      let presentedFirst = false;
      // Finger currently on screen (mobile): the first-arrival wall's soft
      // brake must NOT re-aim Lenis while a drag is live — syncTouch sets
      // the target to the finger position every move, and re-aiming it at
      // card 0's centre each onUpdate makes the two targets ping-pong every
      // frame (visible jitter). Brake only once the finger lifts.
      let fingerDown = false;
      // `page` = mobile one-card-per-swipe pagination (touchend). Those
      // glides take over from a live finger gesture, and the default
      // ease-OUT cubic starts at PEAK velocity — an instant speed/direction
      // change at the moment of release that read as the card "snapping into
      // place" ("se posiciona de manera brusca"). Paging glides instead use
      // ease-in-out (starts at ZERO velocity, accelerates, lands soft — the
      // motion reads as a continuation of the swipe) over a longer budget.
      // Desktop idle-snap keeps the ease-out: there the glide starts from
      // rest after ~140ms of no scrolling, where a fast start feels
      // responsive, not abrupt.
      const glideTo = (target: number, page = false) => {
        cancelAnimationFrame(snapRaf);
        const from = window.scrollY;
        const dist = target - from;
        if (Math.abs(dist) < 1) return;
        const t0 = performance.now();
        // Page cap 1200 (was 750): one-step pages (~300px) keep their old
        // feel via the floor, but LONG settles — the first card gliding in
        // from the prologue/an overshot flick — get a real time budget
        // instead of whipping across ("que posicionar la primera card en el
        // centro vaya mucho más suave").
        const dur = page
          ? Math.min(1200, Math.max(480, Math.abs(dist) * 1.4))
          : Math.min(500, Math.max(220, Math.abs(dist)));
        // After the ease completes, keep re-writing the exact target until
        // the scroll has verifiably CONVERGED (stable within 1px for a few
        // consecutive frames, up to a bounded number of holds): Lenis can
        // still be lerping toward a stale internal target — or, with
        // syncTouch, playing out a flick's inertia tail — and a single
        // final write loses to it, leaving the card off centre with the
        // caption half-crossfaded. ~1.5s of holds outlasts the tail.
        let holdFrames = 90;
        let stableFrames = 0;
        const tick = (now: number) => {
          // Abort the moment the scroll is no longer inside this pin's
          // RANGE: a PROGRAMMATIC scroll (header anchor links, in-page
          // navigation — anything that isn't wheel/touch, which cancelSnap
          // already covers) can jump away mid-glide, and without this check
          // the glide's per-frame immediate writes would drag the page right
          // back to the card it was centring. Deliberately a raw start/end
          // comparison rather than `st.isActive`: isActive is ScrollTrigger
          // bookkeeping updated on ITS schedule, and reading it from inside
          // this rAF (between Lenis write and ScrollTrigger.update) proved
          // flaky enough to kill legitimate glides.
          const st = tl.scrollTrigger;
          if (!st || window.scrollY < st.start - 4 || window.scrollY > st.end + 4) return;
          const t = Math.min(1, (now - t0) / dur);
          const eased = page
            ? t < 0.5
              ? 4 * t * t * t
              : 1 - Math.pow(-2 * t + 2, 3) / 2
            : 1 - Math.pow(1 - t, 3);
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
      //
      // The geometry is a SNAPSHOT frozen in buildTl (i.e. at every
      // ScrollTrigger refresh — the same moment the pin's own start/end
      // freeze), NOT the live PROLOGUE()/amount() closures. On a real phone
      // the address bar hides during scroll and window.innerHeight GROWS
      // ~8% while ignoreMobileResize (deliberately) keeps the pin's range
      // frozen — live reads made pOf() drift against the actual timeline
      // mapping, so every pagination glide/snap landed ~30px off centre
      // once the toolbar was away ("al rato de scrolearla se bugea").
      // Desktop-emulated viewports never resize mid-scroll, which is why
      // no wheel/touch stress harness ever reproduced it.
      let snapPro = 0;
      let snapEntry = 0;
      let snapStep = 0;
      let snapAmount = 0;
      const pOf = (i: number) =>
        snapAmount && snapStep ? (snapPro + snapEntry + i * snapStep) / snapAmount : 0;
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
        const total = snapAmount;
        if (!total || !snapStep) return;
        const progress = progressNow(st);
        // Never idle-snap while the phrase still HOLDS at full brightness
        // (< 0.85·pro — its fade-out starts exactly there, see buildTl):
        // the nearest card there is always card 0, and the glide would
        // fast-forward the whole title moment. Past that point the phrase
        // is already dissolving, and 0.98 left a DEAD ZONE (rest between
        // fade-start and 0.98·pro = phrase gone, card still hidden in the
        // tail, and nothing pulling it in — "las cards no salen del lado"
        // after the V15.79 prologue reduction made normal swipes land
        // there). Snapping from the fade zone glides card 0 in from the
        // side while the phrase finishes dissolving — the intended
        // handoff.
        if (progress * total < snapPro * 0.85) return;
        // First settle on mobile: force card 0 (unless the flick genuinely
        // sailed past card 1) and use the page-style ease-in-out glide —
        // see `presentedFirst` above.
        const firstSettle = window.innerWidth <= 900 && !presentedFirst;
        let idx = nearestIdx(progress);
        if (firstSettle) {
          presentedFirst = true;
          if (progress < pOf(1)) idx = 0;
        }
        const bestP = pOf(idx);
        const exact = scrollAt(st, bestP);
        // Within ~1.5px of centre a glide would be imperceptible: write the
        // exact position once and let the per-frame updateSpiral converge
        // everything from the real rects. This REPLACED the old forceSettle
        // (which zeroed yaw/arc/caption state directly): now that
        // updateSpiral re-derives those values every visible frame, a forced
        // zero got overwritten on the very next frame while the scrub tween
        // was still easing — a one-frame pop instead of a fix. Correcting
        // the residual at the SOURCE (the scroll position) keeps every
        // derived value consistent by construction; no residual tilt/blur
        // can survive because the resting rects themselves are exact.
        if (Math.abs(progress - bestP) * total < 1.5) {
          if (Math.abs(window.scrollY - exact) > 0.25) {
            const lenis = window.__nxrLenis;
            if (lenis) lenis.scrollTo(exact, { immediate: true });
            else window.scrollTo(0, exact);
          }
          return;
        }
        glideTo(exact, firstSettle);
      };
      const cancelSnap = () => {
        cancelAnimationFrame(snapRaf);
        window.clearTimeout(snapTimer);
      };
      window.addEventListener("wheel", cancelSnap, { passive: true });
      window.addEventListener("touchstart", cancelSnap, { passive: true });

      // Timeline children use PX as their time unit (1 unit = 1px of pin
      // scroll; total duration = amount()) and are REBUILT on every refresh:
      // fixed fractional positions would silently desync the prologue/track
      // proportions from the live pOf() math after a resize. Declared (with
      // the nullable tlRef) BEFORE the timeline: ScrollTrigger can fire
      // onRefresh SYNCHRONOUSLY while gsap.timeline() is still executing —
      // both `tl` and a later-declared const would be in their TDZ there.
      // That early call is a harmless no-op; the explicit buildTl() after
      // creation does the first real build.
      let tlRef: gsap.core.Timeline | null = null;
      const buildTl = () => {
        // Freeze the pagination/snap geometry HERE, in the same refresh
        // pass that recomputes the pin's start/end — pOf() and friends must
        // read these snapshots, never the live closures (see pOf above).
        // Assigned before the tlRef guard so even the creation-time refresh
        // (tlRef still null) leaves the snapshots valid.
        snapPro = PROLOGUE();
        snapEntry = entryOffset();
        snapStep = cardStep();
        snapAmount = amount();
        const t = tlRef;
        if (!t) return;
        t.clear();
        const pro = snapPro;
        if (headTitle) {
          // ONLY the fade-out lives in the pin timeline — the fade-in
          // belongs to the approach scrub above (so the phrase can appear
          // while Intro is still leaving), and everything before 0.85·pro
          // must leave opacity untouched at the approach's final value (1):
          // the whole prologue is the HOLD (≈145vh desktop / ≈115vh mobile
          // counting the approach — the ZoomParallax class of persistence).
          // The fade-out deliberately runs PAST the prologue into the first
          // stretch of track motion: the first card is already
          // materializing out of the helix while the phrase dissolves
          // ("que al desaparecer justo entre la primera card").
          t.to(
            headTitle,
            { opacity: 0, filter: "blur(18px)", ease: "none", duration: pro * 0.15 + snapEntry * 0.25 },
            pro * 0.85
          );
        }
        t.fromTo(track, { x: startX() }, { x: endX(), ease: "none", duration: moveAmount() }, pro);
      };

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
          onUpdate: (self) => {
            updateSpiral();
            pushAll();
            // First-arrival WALL (mobile): until the reel has presented
            // card 0 (presentedFirst flips in trySnap's firstSettle), a
            // flick's inertia must not carry the scroll past card 0's
            // centred position — the overshoot pulled card 1 toward centre
            // (caption crossfading to "Agentes IA") before the settle glid
            // back, reading as a phantom card. Immediate write-back each
            // update truncates the inertia exactly at centre; the wall
            // lifts after the first settle, so the next swipe pages to
            // card 1 normally.
            if (!presentedFirst && window.innerWidth <= 900) {
              const cap = pOf(0);
              const capY = scrollAt(self, cap);
              const lenis = window.__nxrLenis;
              // Soft brake FIRST: if the flick's inertia TARGET points past
              // card 0's centre but the position hasn't crossed yet, re-aim
              // Lenis at the centre with a lerp — the card decelerates in
              // from the side and lands centred, instead of the position
              // crossing and the hard clamp below teleporting it back
              // (which read as the card appearing without its side entry).
              if (lenis && !fingerDown && progressNow(self) <= cap && lenis.targetScroll > capY) {
                lenis.scrollTo(capY, { lerp: 0.12 });
              }
              if (progressNow(self) > cap) {
                if (lenis) lenis.scrollTo(capY, { immediate: true });
                else window.scrollTo(0, capY);
              }
            }
            window.clearTimeout(snapTimer);
            // Short idle window so cards "click" into selection as you
            // pass them rather than long after the scroll stops. The
            // glide's own writes re-enter here, but converge: once within
            // 1.5px, trySnap no-ops.
            snapTimer = window.setTimeout(trySnap, 140);
          },
          onRefresh: (self) => {
            buildTl();
            if (self.progress <= 0) {
              // Refresh landed above/at the pin start: park the track at
              // its rest position.
              gsap.set(track, { x: startX() });
            } else {
              // MID-PIN refresh — this happens in the wild: on a slow
              // mobile load the user is already inside the section when the
              // window "load" event fires ScrollTrigger.refresh(). The old
              // unconditional reset to startX() left the 0.5s scrub visibly
              // CHASING the real position — a stray card sweeping through
              // on its own before the first one settled ("sale otra súper
              // rápido y se pasa sola"). Rendering the rebuilt timeline at
              // the live progress right here leaves the scrub nothing to
              // chase. tlRef (nullable), not tl: the creation-time refresh
              // fires while gsap.timeline() is still executing.
              tlRef?.progress(self.progress);
            }
            updateSpiral();
            pushAll();
          },
        },
      });
      tlRef = tl;
      buildTl();
      // Reload landing mid-pin (browser scroll restoration): the creation-
      // time refresh ran before tlRef existed, so sync the fresh timeline to
      // the live progress now — otherwise the scrub visibly chases from 0.
      if (tl.scrollTrigger && tl.scrollTrigger.progress > 0) {
        tl.progress(tl.scrollTrigger.progress);
      }

      updateSpiral();
      pushAll();

      const cleanups: Array<() => void> = [];
      cleanups.push(() => {
        window.removeEventListener("wheel", cancelSnap);
        window.removeEventListener("touchstart", cancelSnap);
        cancelSnap();
      });

      // AUTHORITY CLAMP for the viewport-FIXED title. Its opacity has TWO
      // scrubbed drivers (approach fade-in + the pin timeline's fade-out);
      // on a normal continuous scroll they hand over cleanly, but an INSTANT
      // scroll jump (browser scroll restoration on reload, programmatic
      // teleports) sets both catch-up tweens racing over the same property —
      // and whichever writes LAST wins: caught live painting the phrase at
      // full opacity over the Contacto section. Whenever the scroll sits
      // outside the whole phrase-moment range, the title must be OFF —
      // enforced every ticker frame (cost: two property reads + a string
      // compare; the gsap.set only fires while a stray catch-up is writing).
      if (headTitle) {
        const clampTitle = () => {
          const st = tl.scrollTrigger;
          if (!st) return;
          const y = window.scrollY;
          const outside = y < st.start - window.innerHeight || y > st.end;
          if (outside && headTitle.style.opacity !== "0") {
            gsap.set(headTitle, { opacity: 0 });
          }
        };
        gsap.ticker.add(clampTitle);
        cleanups.push(() => gsap.ticker.remove(clampTitle));
      }

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
          fingerDown = true;
          const st = tl.scrollTrigger;
          touchInPin = !!st?.isActive;
          if (!st || !touchInPin) return;
          touchY = e.touches[0]?.clientY ?? 0;
          touchIdx = nearestIdx(progressNow(st));
        };
        const onTouchCancel = () => {
          fingerDown = false;
          touchInPin = false;
        };
        const onTouchEnd = (e: TouchEvent) => {
          fingerDown = false;
          const st = tl.scrollTrigger;
          if (!touchInPin || !st?.isActive) return;
          touchInPin = false;
          const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
          const p = progressNow(st);
          // Released while the phrase still holds at full brightness:
          // leave the scroll natural. Hijacking it into a glide-to-card-0
          // both fast-forwarded the phrase's hold AND swept the card
          // across the screen at glide speed (up to ~1600px in 750ms —
          // the "ghost card" whip). 0.85 (not 0.98) so releases in the
          // fade zone DO page card 0 in — same dead-zone fix as trySnap.
          if (p * snapAmount < snapPro * 0.85) return;
          const eps = 0.02;
          let targetIdx: number | null = null;
          if (dy > 25) {
            if (p < pOf(touchIdx) - eps) targetIdx = touchIdx;
            else if (touchIdx < cards.length - 1) targetIdx = touchIdx + 1;
          } else if (dy < -25) {
            if (p > pOf(touchIdx) + eps) targetIdx = touchIdx;
            else if (touchIdx > 0) targetIdx = touchIdx - 1;
          }
          if (targetIdx !== null) glideTo(scrollAt(st, pOf(targetIdx)), true);
        };
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchend", onTouchEnd, { passive: true });
        window.addEventListener("touchcancel", onTouchCancel, { passive: true });
        cleanups.push(() => {
          window.removeEventListener("touchstart", onTouchStart);
          window.removeEventListener("touchend", onTouchEnd);
          window.removeEventListener("touchcancel", onTouchCancel);
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
        // Keep the drum values glued to the LIVE rects even when the scroll
        // itself is idle — the pin's scrub tween (and a paging glide's
        // settling tail) keeps moving the track after the last scroll
        // event, and this is what makes that tail animate smoothly instead
        // of freezing and then jumping (see updateSpiral's comment). The
        // loop below pushes every card afterwards, so no double-push.
        updateSpiral();
        mouseCurrent.nx += (mouseTarget.nx - mouseCurrent.nx) * 0.06;
        mouseCurrent.ny += (mouseTarget.ny - mouseCurrent.ny) * 0.06;
        const t = gsap.ticker.time;
        cards.forEach((_, i) => {
          idleYaw[i] = 2 * Math.sin(t * 0.55 + i * 1.7);
          idlePitch[i] = 1.1 * Math.sin(t * 0.38 + i * 2.4);
          live[i].rotationX += (hoverTarget[i].rotX - live[i].rotationX) * HOVER_SMOOTH;
          live[i].rotationY += (hoverTarget[i].rotY - live[i].rotationY) * HOVER_SMOOTH;
          live[i].z += (hoverTarget[i].z - live[i].z) * HOVER_SMOOTH;
          push(i);
        });
      };
      gsap.ticker.add(idleTick);
      cleanups.push(() => {
        gsap.ticker.remove(idleTick);
        window.removeEventListener("mousemove", onWindowMouseMove);
      });

      cards.forEach((card, i) => {
        // ---- Cursor tilt: sets only the TARGET; idleTick's per-frame lerp
        // (HOVER_SMOOTH) above is what actually eases live[i] toward it, on
        // every frame the section is visible — the identical mechanism
        // mouseleave uses to ease back to neutral, so both directions move
        // with the same weight.
        const onMove = (e: MouseEvent) => {
          const r = card.getBoundingClientRect();
          const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
          const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;

          hoverTarget[i].rotY = nx * 9;
          hoverTarget[i].rotX = -ny * 7;
          hoverTarget[i].z = 18;
        };

        const onLeave = () => {
          hoverTarget[i].rotX = 0;
          hoverTarget[i].rotY = 0;
          hoverTarget[i].z = 0;
        };

        card.addEventListener("mousemove", onMove);
        card.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          card.removeEventListener("mousemove", onMove);
          card.removeEventListener("mouseleave", onLeave);
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

    // Everything demo-related sleeps while the section is off-screen: the
    // JS loops below skip their DOM writes (cheap idle reschedule instead)
    // and the `.nxr-anims-live` class gates the pure-CSS keyframe anims
    // (see globals.css) — otherwise they all keep burning style/paint work
    // for cards nobody can see, on every page scroll.
    const visRef = { current: false };
    const io = new IntersectionObserver(
      ([entry]) => {
        visRef.current = entry.isIntersecting;
        section.classList.toggle("nxr-anims-live", entry.isIntersecting);
      },
      { rootMargin: "150px 0px" }
    );
    io.observe(section);

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
        if (!visRef.current) {
          timers.push(setTimeout(() => loopChatAuto(card), 1500));
          return;
        }
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
        if (!visRef.current) {
          timers.push(setTimeout(() => loopFlow(card), 1500));
          return;
        }
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
        if (!visRef.current) {
          timers.push(setTimeout(() => loopSeo(card), 1500));
          return;
        }
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
        if (!visRef.current) {
          timers.push(setTimeout(() => loopApp(card), 1500));
          return;
        }
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
      io.disconnect();
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
      {/* Title moment: no runway anymore — the phrase's scroll distance is
          the PROLOGUE segment of the reel's own pin (see the main timeline
          in useGSAP above), and its blur fade is scrubbed there. GSAP owns
          opacity/filter — no .nxr-reveal (its CSS transition would fight
          the tween) and no char-reveal ref (the blur IS the entrance). */}
      {/* FIXED to the viewport (see globals.css) and OUTSIDE the sticky on
          purpose: the sticky's perspective:1000px would hijack a fixed
          descendant's containing block. Being viewport-fixed lets the
          phrase start fading in during the APPROACH — while Intro's cards
          are still leaving up top — without ever travelling with the page:
          its position is screen-centred from the first moment to the last. */}
      <div className="nxr-servicios-head">
        <h2 className="nxr-section-h2">
          Todo lo que tu negocio necesita para{" "}
          <span className="nxr-gradient-text-salmon">crecer en la era de la IA.</span>
        </h2>
      </div>
      <div className="nxr-servicios-sticky" ref={stickyRef}>
        <div className="nxr-servicios-content" ref={contentRef}>
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

        </div>
        {/* Fixed bottom-left caption stack: all five captions occupy the
            same grid cell; updateSpiral crossfades (opacity + blur) each
            one as its card passes through the reel's centre. SIBLING of
            .nxr-servicios-content on purpose: inside it they'd join the
            reel's 3D rendering context and get depth-sorted BEHIND yawed
            cards (see the .nxr-servicios-captions CSS comment). */}
        <div className="nxr-servicios-captions">
          {CARDS.map((c) => (
            <Caption key={c.href} c={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
