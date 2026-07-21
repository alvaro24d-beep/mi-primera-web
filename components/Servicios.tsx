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

// V16.27 — Las 5 demos renovadas como PANTALLAS: cada una llena la card
// entera (position absolute inset 0, layouts fluidos en % — cero tamaños
// fijos de stage) como si el cristal fuese un display reproduciendo una UI
// real. La coreografía vive en los loops JS de abajo (perCard timers +
// reinicio-al-centrar); los detalles idle (shimmer, pulsos, caret) son
// keyframes CSS pausados por .nxr-anims-live fuera de pantalla.
function Web3DAnim() {
  return (
    <div className="anim-wb" aria-hidden="true">
      <div className="anim-wb-bar">
        <span className="anim-wb-dot" />
        <span className="anim-wb-dot" />
        <span className="anim-wb-dot" />
        <div className="anim-wb-url">
          <svg viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <span>tunegocio.es</span>
          <i className="anim-wb-progress" />
        </div>
      </div>
      <div className="anim-wb-page">
        <div className="anim-wb-hero">
          <span className="anim-wb-line -title" />
          <span className="anim-wb-line -sub" />
          <span className="anim-wb-btn">
            <i />
          </span>
        </div>
        <div className="anim-wb-grid">
          <div className="anim-wb-tile">
            <i className="anim-wb-img" />
            <i className="anim-wb-line -t1" />
            <i className="anim-wb-line -t2" />
          </div>
          <div className="anim-wb-tile">
            <i className="anim-wb-img" />
            <i className="anim-wb-line -t1" />
            <i className="anim-wb-line -t2" />
          </div>
          <div className="anim-wb-tile">
            <i className="anim-wb-img" />
            <i className="anim-wb-line -t1" />
            <i className="anim-wb-line -t2" />
          </div>
        </div>
      </div>
      <span className="anim-wb-badge">
        <b>98</b> Performance
      </span>
      <div className="anim-wb-cursor">
        <svg viewBox="0 0 24 24">
          <path d="M4,2 L4,20 L9,15.5 L12,22 L15,20.5 L12,14 L18,14 Z" />
        </svg>
      </div>
    </div>
  );
}

function ChatAnim() {
  return (
    <div className="anim-ia" aria-hidden="true">
      <div className="anim-ia-head">
        <span className="anim-ia-ava">
          🤖<i />
        </span>
        <span className="anim-ia-who">
          <b>Agente Nexora</b>
          <span>en línea</span>
        </span>
      </div>
      <div className="anim-ia-msgs">
        <div className="anim-ia-msg -user">¿Tenéis cita para el jueves?</div>
        <div className="anim-ia-msg -bot -typing">
          <span />
          <span />
          <span />
        </div>
        <div className="anim-ia-msg -bot">Déjame comprobar la agenda…</div>
        <div className="anim-ia-msg -bot -card">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M3 10h18M8 3v4M16 3v4" />
            <path className="anim-ia-check" d="M8.5 15l2.5 2.5 4.5-5" />
          </svg>
          <span>
            <b>Cita confirmada</b>
            <span>Jueves · 10:30</span>
          </span>
        </div>
        <div className="anim-ia-msg -user">¡Perfecto, gracias!</div>
      </div>
      <div className="anim-ia-input">
        <span className="anim-ia-intext" />
        <i className="anim-ia-caret" />
        <span className="anim-ia-send">
          <svg viewBox="0 0 24 24">
            <path d="M4 12l16-7-6 16-2.5-6.5L4 12z" />
          </svg>
        </span>
      </div>
    </div>
  );
}

function FlowAnim() {
  // Los extremos de cada conexión son los MISMOS puntos fraccionales del
  // viewBox (300×150, preserveAspectRatio none) en los que se centran los
  // nodos DOM (left/top en % + translate(-50%,-50%)): las líneas llegan al
  // centro de cada nodo en cualquier aspect-ratio de la card.
  return (
    <div className="anim-fl" aria-hidden="true">
      <div className="anim-fl-head">
        <span className="anim-fl-file">automatización · n8n</span>
        <span className="anim-fl-live">
          <i />
          ACTIVO
        </span>
      </div>
      <div className="anim-fl-canvas">
        <svg className="anim-fl-svg" viewBox="0 0 300 150" preserveAspectRatio="none">
          <path className="anim-fl-conn" d="M36,30 C90,30 96,69 150,69" />
          <path className="anim-fl-conn" d="M36,108 C90,108 96,69 150,69" />
          <path className="anim-fl-conn" d="M150,69 C204,69 210,30 264,30" />
          <path className="anim-fl-conn" d="M150,69 C204,69 210,108 264,108" />
          <circle className="anim-fl-pulse" r="3.2">
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.92;1" dur="2.4s" repeatCount="indefinite" />
            <animateMotion dur="2.4s" repeatCount="indefinite" path="M36,30 C90,30 96,69 150,69 C204,69 210,30 264,30" />
          </circle>
          <circle className="anim-fl-pulse" r="2.8">
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.92;1" dur="2.8s" repeatCount="indefinite" begin="1.1s" />
            <animateMotion dur="2.8s" repeatCount="indefinite" begin="1.1s" path="M36,108 C90,108 96,69 150,69 C204,69 210,108 264,108" />
          </circle>
          <circle className="anim-fl-pulse -lime" r="2.8">
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.92;1" dur="2.6s" repeatCount="indefinite" begin="0.6s" />
            <animateMotion dur="2.6s" repeatCount="indefinite" begin="0.6s" path="M36,30 C90,30 96,69 150,69 C204,69 210,108 264,108" />
          </circle>
        </svg>
        <div className="anim-fl-node" style={{ left: "12%", top: "20%" }}>
          <svg viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
          <b>Gmail</b>
          <span>Trigger</span>
        </div>
        <div className="anim-fl-node" style={{ left: "12%", top: "72%" }}>
          <svg viewBox="0 0 24 24">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 8h8M8 12h8M8 16h5" />
          </svg>
          <b>Formulario</b>
          <span>Lead</span>
        </div>
        <div className="anim-fl-node -core" style={{ left: "50%", top: "46%" }}>
          <svg viewBox="0 0 24 24">
            <rect x="5" y="7" width="14" height="12" rx="3" />
            <circle cx="9.5" cy="12" r="1.6" />
            <circle cx="14.5" cy="12" r="1.6" />
            <path d="M12 7V4M9 16h6" />
          </svg>
          <b>Agente IA</b>
          <span>Procesa</span>
        </div>
        <div className="anim-fl-node" style={{ left: "88%", top: "20%" }}>
          <svg viewBox="0 0 24 24">
            <ellipse cx="12" cy="6" rx="8" ry="3" />
            <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
            <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
          </svg>
          <b>CRM</b>
          <span>Guarda</span>
        </div>
        <div className="anim-fl-node" style={{ left: "88%", top: "72%" }}>
          <svg viewBox="0 0 24 24">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M10.3 21a2 2 0 0 0 3.4 0" />
          </svg>
          <b>Slack</b>
          <span>Avisa</span>
        </div>
      </div>
      <div className="anim-fl-foot">
        <span className="anim-fl-count">
          Ejecuciones hoy: <b>247</b>
        </span>
        <span className="anim-fl-ok">✓ sin errores</span>
      </div>
    </div>
  );
}

function SeoAnim() {
  return (
    <div className="anim-sc" aria-hidden="true">
      <div className="anim-sc-head">
        <b>Rendimiento de búsqueda</b>
        <span>Últimos 3 meses</span>
      </div>
      <div className="anim-sc-chips">
        <div className="anim-sc-chip -lime">
          <b className="anim-sc-chip-val" data-t="3482" data-fmt="int">
            0
          </b>
          <span>Clics</span>
        </div>
        <div className="anim-sc-chip -salmon">
          <b className="anim-sc-chip-val" data-t="86400" data-fmt="k">
            0
          </b>
          <span>Impresiones</span>
        </div>
        <div className="anim-sc-chip">
          <b className="anim-sc-chip-val" data-t="4" data-fmt="pct">
            0%
          </b>
          <span>CTR medio</span>
        </div>
      </div>
      <div className="anim-sc-chart">
        <svg viewBox="0 0 260 90" preserveAspectRatio="none">
          <g className="anim-sc-grid">
            <line x1="0" y1="10" x2="260" y2="10" />
            <line x1="0" y1="33" x2="260" y2="33" />
            <line x1="0" y1="56" x2="260" y2="56" />
            <line x1="0" y1="79" x2="260" y2="79" />
          </g>
          <path
            className="anim-sc-area -impr"
            d="M0,55 L26,50 L52,52 L78,40 L104,44 L130,32 L156,36 L182,24 L208,28 L234,18 L260,20 L260,90 L0,90 Z"
          />
          <path
            className="anim-sc-area -clics"
            d="M0,68 L26,64 L52,66 L78,56 L104,58 L130,46 L156,50 L182,38 L208,34 L234,24 L260,16 L260,90 L0,90 Z"
          />
          <path
            className="anim-sc-line -impr"
            d="M0,55 L26,50 L52,52 L78,40 L104,44 L130,32 L156,36 L182,24 L208,28 L234,18 L260,20"
          />
          <path
            className="anim-sc-line -clics"
            d="M0,68 L26,64 L52,66 L78,56 L104,58 L130,46 L156,50 L182,38 L208,34 L234,24 L260,16"
          />
        </svg>
        {/* Runner: cursor vertical + punto + tooltip que recorren la curva
            de clics en bucle (lo mueve el loop JS punto a punto). */}
        <div className="anim-sc-run">
          <i className="anim-sc-run-line" />
          <i className="anim-sc-run-dot" />
          <span className="anim-sc-tip">
            <b>0</b> clics
          </span>
        </div>
      </div>
    </div>
  );
}

function AppAnim() {
  return (
    <div className="anim-ap" aria-hidden="true">
      <div className="anim-ap-phone">
        <i className="anim-ap-notch" />
        <div className="anim-ap-screen">
          <span className="anim-ap-hi">Hola, Marta 👋</span>
          <div className="anim-ap-balance">
            <span>Ventas hoy</span>
            <b className="anim-ap-count" data-t="2840">
              0
            </b>
          </div>
          <div className="anim-ap-bars">
            <i style={{ "--h": "38%" } as React.CSSProperties} />
            <i style={{ "--h": "62%" } as React.CSSProperties} />
            <i style={{ "--h": "48%" } as React.CSSProperties} />
            <i style={{ "--h": "78%" } as React.CSSProperties} />
            <i style={{ "--h": "96%" } as React.CSSProperties} />
          </div>
          <div className="anim-ap-tab">
            <svg viewBox="0 0 24 24">
              <path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z" />
            </svg>
            <svg viewBox="0 0 24 24">
              <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
            </svg>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
            </svg>
          </div>
        </div>
      </div>
      <div className="anim-ap-side">
        <div className="anim-ap-notif">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12l3 3 5-6" />
          </svg>
          <span>
            <b>Pedido #1042</b>
            <span>Pagado · 49 €</span>
          </span>
        </div>
        <div className="anim-ap-notif">
          <svg viewBox="0 0 24 24">
            <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6L12 16.8 6.6 19.6l1.1-6L3.2 9.4l6.1-.8z" />
          </svg>
          <span>
            <b>Nueva reseña</b>
            <span>★★★★★ · «Impecable»</span>
          </span>
        </div>
        <div className="anim-ap-ring">
          <svg viewBox="0 0 64 64">
            <circle className="anim-ap-ring-track" cx="32" cy="32" r="26" />
            <circle className="anim-ap-ring-fill" cx="32" cy="32" r="26" />
          </svg>
          <span>
            <b>99,9%</b>
            <span>uptime</span>
          </span>
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
        {/* Solo texto + flecha ("nada de fondo ni bordes", V16.3): fuera el
            nxr-glass-edge que pintaba el borde degradado vía máscara. */}
        <Link href={c.href} className="nxr-srv-cta">
          <span>{c.cta}</span>
          {/* Flecha ↗ (arriba-derecha), estilo lucide arrow-up-right: la
              diagonal + la esquina superior derecha — el gesto "abrir"
              de la referencia alche.studio ("More Works ↗"). */}
          <svg viewBox="0 0 24 24">
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
  // V16.21 "que se reproduzcan": reinicio-al-centrar de las demos. El
  // efecto de los loops registra aquí un callback por card; updateSpiral lo
  // dispara en el MISMO cruce de visibilidad que el scramble del párrafo,
  // así la demo arranca de cero justo cuando su card toma el centro (antes
  // corría con timers fijos desde el mount y solías pillarla a mitad de
  // ciclo o ya terminada).
  const demoRestartRef = useRef<Array<(() => void) | null>>([]);

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
      // Móvil 1.22 (V16.16, "la sección tiene que entrar antes... mucho
      // vacío"): sin espiral en móvil (carrusel rígido, V15.83), TAIL_END
      // solo definía la distancia de arranque de la card 0 — a 1.22 pasos
      // queda JUSTO fuera del borde (entra ~1.16) y asoma con el primer
      // tramo de track en vez de viajar 0.7 pasos invisibles. Desktop
      // conserva TAIL_END+0.02 (la espiral necesita nacer en su cola).
      const entryOffset = () => cardStep() * (isDesktopUI ? TAIL_END + 0.02 : 1.22);
      // PROLOGUE: scroll distance at the very start of the pin where the
      // track holds still and the title overlay plays its whole blur moment
      // (replaces the old 165vh/70vh runway above the sticky — the pin, and
      // with it the section, now starts as soon as the sticky reaches the
      // top: "que la sección empiece antes").
      // Desktop 0.65 (V16.16, "la sección tiene que entrar antes"). Móvil
      // SIGUE en 1.35: geometría validada en teléfono físico (bajarla
      // rompió la entrada dos veces; 1.2 mostró degradación hasta en el
      // arnés) — en móvil la entrada anticipada se logra con el
      // entryOffset corto (la card arranca justo fuera del borde) y con la
      // frase acompañando casi todo el prólogo, no tocando la geometría.
      const PROLOGUE = () => Math.round(window.innerHeight * (isDesktopUI ? 0.65 : 1.35));
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
          // Mobile: NO tail on either side — the reel is a rigid carousel.
          // Exits slide out through the left edge keeping their step
          // distance ("como un carrusel", V15.4x), and entries now mirror
          // it ("que entren viniendo de la derecha a la misma distancia
          // siempre de la seleccionada, como un carrusel en fila"): cards
          // hold their natural track slot — exactly one cardStep apart —
          // and enter PHYSICALLY through the right edge at full opacity,
          // no materialization/climb/park-pull. This also retires the
          // whole ghost-card failure class on mobile (every past ghost was
          // fade × stale-park-pull interplay). Desktop keeps the spiral
          // tail on both sides.
          const tailActive = isDesktopUI;
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
              // La demo ilustrativa de la card se reinicia desde cero en el
              // mismo instante (V16.21, "que se reproduzcan").
              demoRestartRef.current[i]?.();
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
      // Glide activo (asentamiento o paginación): mientras corre, el MURO de
      // primera llegada se retira — ambos escriben la posición cada frame y
      // si el glide apunta más allá de pOf(0) con el muro devolviéndola, la
      // oscilación deja el scroll clavado ("se queda pillao, no deja hacer
      // scroll"). El glide es acotado y aterriza en una card; trySnap voltea
      // presentedFirst justo después.
      let snapGliding = false;
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
        snapGliding = false;
        const from = window.scrollY;
        const dist = target - from;
        if (Math.abs(dist) < 1) return;
        snapGliding = true;
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
          if (!st || window.scrollY < st.start - 4 || window.scrollY > st.end + 4) {
            snapGliding = false;
            return;
          }
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
          else snapGliding = false;
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
        // (< 0.65·pro — its fade-out starts exactly there, see buildTl; los
        // umbrales de momentos solapados comparten constante). Cualquier
        // reposo con la frase ya desvaneciéndose desliza la card 0 desde el
        // lado mientras la frase termina de disolverse.
        if (progress * total < snapPro * 0.65) return;
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
        snapGliding = false;
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
          // Fade-out desde CASI el pin (0.05·pro, V16.15 "no quiero scroll
          // con las frases quietas"): la frase llega entera por el
          // approach y en cuanto la sección pinnea ya se está disolviendo
          // — despacio (duración 0.45·pro, gone hacia 0.5·pro), nunca
          // estática mientras scrolleas. Los guards de snap/paginación
          // siguen en 0.32: por debajo la frase aún es legible en su fade
          // (un reposo ahí muestra contenido, no pantalla vacía), y desde
          // 0.32 cualquier reposo trae la card 0 mientras la frase
          // termina.
          // HOLD + fundido (V16.32, "tiene que durar un poco más nítida"):
          // la frase aguanta a brillo/nitidez COMPLETOS hasta 0.65·pro
          // (~88vh móvil / ~42vh desktop de scroll legible; antes 0.5) y
          // solo entonces se disuelve, acompañando hasta 1.2·pro con la
          // primera card ya entrando (el handoff clásico). 0.65 es la MISMA
          // constante que las guardas de trySnap/touchend (umbrales de
          // momentos solapados comparten constante) y el clamp del ticker
          // (1.3·snapPro) cubre el final del fade.
          t.to(
            headTitle,
            { opacity: 0, filter: "blur(18px)", ease: "none", duration: pro * 0.55 },
            pro * 0.65
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
            if (!presentedFirst && window.innerWidth <= 900 && !snapGliding) {
              const cap = pOf(0);
              const capY = scrollAt(self, cap);
              const lenis = window.__nxrLenis;
              // Soft brake FIRST: if the flick's inertia TARGET points past
              // card 0's centre but the position hasn't crossed yet, re-aim
              // Lenis at the centre with a lerp — the card decelerates in
              // from the side and lands centred, instead of the position
              // crossing and the hard clamp below teleporting it back
              // (which read as the card appearing without its side entry).
              // `!snapGliding` en todo el muro: ver la declaración del flag.
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
        // V16.40 ("a veces desaparece de golpe"): el clamp ya no corta con
        // un set seco — en un flick rápido el scroll real cruza 1.3·pro
        // mientras el scrub (lag 0.5s) aún pinta la frase a media
        // disolución, y el set instantáneo se veía como un POP. Ahora
        // fuerza el apagado con un fundido corto (0.25s, blur incluido):
        // misma autoridad anti-carrera, sin corte visible.
        let clamping = false;
        const clampTitle = () => {
          const st = tl.scrollTrigger;
          if (!st) return;
          const y = window.scrollY;
          // Fuera del rango completo del momento-frase, O ya pasado el
          // final de su fade-out DENTRO del pin (el fade termina a
          // 1.2·pro — más allá la frase debe estar apagada SIEMPRE; una
          // carrera de catch-ups tras un salto la dejaba pintada sobre las
          // cards del reel: "no se oculta y se queda sobre la sección").
          const outside = y < st.start - window.innerHeight || y > st.end || y > st.start + snapPro * 1.3;
          if (!outside) {
            clamping = false;
            return;
          }
          const op = parseFloat(headTitle.style.opacity || "1");
          if (op > 0.01 && !clamping) {
            clamping = true;
            gsap.to(headTitle, {
              opacity: 0,
              filter: "blur(18px)",
              duration: 0.25,
              ease: "power1.in",
              overwrite: "auto",
              onComplete: () => {
                clamping = false;
              },
            });
          }
        };
        gsap.ticker.add(clampTitle);
        cleanups.push(() => gsap.ticker.remove(clampTitle));
      }

      // (V16.21) El fade de salida del sticky del reel vive ahora en
      // ZoomParallax.tsx, anclado al rect REAL de la sección ZP y no a
      // st.end: los números de scroll congelados (ignoreMobileResize) se
      // desalineaban con la toolbar del teléfono y la frase de ZP se
      // tecleaba sobre la última caption aún visible ("salen las palabras
      // por encima de la última card").

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
          // leave the scroll natural. 0.65 = el inicio del fade-out (misma
          // constante que buildTl/trySnap) — soltar con la frase ya
          // desvaneciéndose pagina la card 0.
          if (p * snapAmount < snapPro * 0.65) return;
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

    // Utilidades de coreografía (V16.27): estados instantáneos, tecleo por
    // caracteres y contadores por pasos (timers, no rAF: se limpian con el
    // saco perCard de abajo y duermen con visRef como todo lo demás).
    const instant = (els: HTMLElement[], styles: Partial<CSSStyleDeclaration>) => {
      els.forEach((el) => {
        el.style.transition = "none";
        Object.assign(el.style, styles);
      });
    };
    const fmtNum = (v: number, fmt: string | null) => {
      if (fmt === "k") return (v / 1000).toFixed(1).replace(".", ",") + "K";
      if (fmt === "pct") return v.toFixed(1).replace(".", ",") + "%";
      return Math.round(v).toLocaleString("es-ES");
    };
    const countTo = (
      T: ReturnType<typeof setTimeout>[],
      el: HTMLElement,
      target: number,
      from: number,
      dur: number,
      fmt: string | null
    ) => {
      const steps = 24;
      for (let k = 1; k <= steps; k++) {
        T.push(
          setTimeout(() => {
            const e = 1 - Math.pow(1 - k / steps, 3);
            el.textContent = fmtNum(target * e, fmt);
          }, from + (dur / steps) * k)
        );
      }
    };
    const typeInto = (T: ReturnType<typeof setTimeout>[], el: HTMLElement, text: string, from: number, cps = 34) => {
      for (let k = 0; k <= text.length; k++) {
        T.push(setTimeout(() => (el.textContent = text.slice(0, k)), from + k * cps));
      }
      return from + text.length * cps;
    };

    // Un saco de timers POR CARD (V16.21): reiniciar una demo = vaciar su
    // saco y relanzar su loop, sin tocar las demás. El saco global de antes
    // hacía imposible cortar un ciclo a medias sin matarlo todo.
    const perCard: ReturnType<typeof setTimeout>[][] = cards.map(() => []);
    const clearCard = (i: number) => {
      perCard[i].forEach((t) => clearTimeout(t));
      perCard[i].length = 0;
    };

    // ===== Pantalla 1 — navegador construyendo la web =====
    if (cards[0]) {
      const card0 = cards[0];
      function loopWeb(card: HTMLElement) {
        if (!visRef.current) {
          perCard[0].push(setTimeout(() => loopWeb(card), 1500));
          return;
        }
        const progress = card.querySelector<HTMLElement>(".anim-wb-progress");
        const hero = Array.from(card.querySelectorAll<HTMLElement>(".anim-wb-hero > *"));
        const tiles = Array.from(card.querySelectorAll<HTMLElement>(".anim-wb-tile"));
        const btn = card.querySelector<HTMLElement>(".anim-wb-btn");
        const badge = card.querySelector<HTMLElement>(".anim-wb-badge");
        const cursor = card.querySelector<HTMLElement>(".anim-wb-cursor");
        instant([...hero, ...tiles], { opacity: "0", transform: "translateY(10px)" });
        if (progress) {
          progress.style.transition = "none";
          progress.style.transform = "scaleX(0)";
        }
        if (badge) {
          badge.style.transition = "none";
          badge.style.opacity = "0";
          badge.style.transform = "scale(0.6)";
        }
        if (cursor) {
          cursor.style.transition = "none";
          cursor.style.opacity = "0";
          cursor.style.left = "78%";
          cursor.style.top = "84%";
        }
        btn?.classList.remove("-clicked");
        card.querySelector(".anim-wb-page")?.getBoundingClientRect();
        const T = perCard[0];
        const show = (el: HTMLElement, at: number) =>
          T.push(
            setTimeout(() => {
              el.style.transition = "opacity .45s, transform .45s";
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, at)
          );
        T.push(
          setTimeout(() => {
            if (progress) {
              progress.style.transition = "transform .7s ease";
              progress.style.transform = "scaleX(1)";
            }
          }, 200)
        );
        hero.forEach((el, i) => show(el, 900 + i * 180));
        tiles.forEach((el, i) => show(el, 1500 + i * 160));
        // El cursor aparece, viaja hasta el CTA (posición medida en % para
        // sobrevivir al scale del cover-flow) y hace click: el botón pulsa
        // y el badge de performance corona la build.
        T.push(
          setTimeout(() => {
            if (cursor) {
              cursor.style.transition =
                "opacity .3s, left 1.1s cubic-bezier(.4,0,.2,1), top 1.1s cubic-bezier(.4,0,.2,1)";
              cursor.style.opacity = "1";
            }
          }, 2300)
        );
        T.push(
          setTimeout(() => {
            if (cursor && btn) {
              const c = card.getBoundingClientRect();
              const b = btn.getBoundingClientRect();
              if (c.width > 0) {
                cursor.style.left = `${((b.left + b.width * 0.6 - c.left) / c.width) * 100}%`;
                cursor.style.top = `${((b.top + b.height * 0.7 - c.top) / c.height) * 100}%`;
              }
            }
          }, 2500)
        );
        T.push(setTimeout(() => btn?.classList.add("-clicked"), 3650));
        T.push(
          setTimeout(() => {
            if (badge) {
              badge.style.transition = "opacity .35s, transform .35s cubic-bezier(.34,1.56,.64,1)";
              badge.style.opacity = "1";
              badge.style.transform = "scale(1)";
            }
          }, 3950)
        );
        T.push(
          setTimeout(() => {
            if (cursor) cursor.style.opacity = "0";
          }, 4400)
        );
        T.push(setTimeout(() => loopWeb(card), 7400));
      }
      demoRestartRef.current[0] = () => {
        clearCard(0);
        loopWeb(card0);
      };
      perCard[0].push(setTimeout(() => loopWeb(card0), 300));
    }

    // ===== Pantalla 2 — chat del agente (el usuario TECLEA en el input,
    // envía, el bot responde con typing y una card de confirmación) =====
    if (cards[1]) {
      const card1 = cards[1];
      function loopChat(card: HTMLElement) {
        if (!visRef.current) {
          perCard[1].push(setTimeout(() => loopChat(card), 1500));
          return;
        }
        const msgs = Array.from(card.querySelectorAll<HTMLElement>(".anim-ia-msg:not(.-typing)"));
        const typingEl = card.querySelector<HTMLElement>(".anim-ia-msg.-typing");
        const intext = card.querySelector<HTMLElement>(".anim-ia-intext");
        const send = card.querySelector<HTMLElement>(".anim-ia-send");
        if (!msgs.length) return;
        instant(msgs, { opacity: "0", transform: "translateY(8px)" });
        if (typingEl) typingEl.style.display = "none";
        if (intext) intext.textContent = "";
        send?.classList.remove("-hot");
        card.querySelector(".anim-ia-msgs")?.getBoundingClientRect();
        const T = perCard[1];
        const show = (m: HTMLElement | undefined, at: number) => {
          if (!m) return;
          T.push(
            setTimeout(() => {
              m.style.transition = "opacity .4s, transform .4s";
              m.style.opacity = "1";
              m.style.transform = "translateY(0)";
            }, at)
          );
        };
        // La burbuja "escribiendo…" se recoloca delante del mensaje al que
        // precede (una sola burbuja, insertBefore barato).
        const typing = (before: HTMLElement | undefined, from: number, to: number) => {
          if (!typingEl) return;
          T.push(
            setTimeout(() => {
              if (before && before.parentElement) before.parentElement.insertBefore(typingEl, before);
              typingEl.style.display = "flex";
            }, from)
          );
          T.push(setTimeout(() => (typingEl.style.display = "none"), to));
        };
        const sendPulse = (at: number) => {
          T.push(setTimeout(() => send?.classList.add("-hot"), at));
          T.push(
            setTimeout(() => {
              if (intext) intext.textContent = "";
              send?.classList.remove("-hot");
            }, at + 380)
          );
        };
        let t = 300;
        if (intext) t = typeInto(T, intext, "¿Tenéis cita para el jueves?", 300);
        sendPulse(t + 120);
        show(msgs[0], t + 500);
        typing(msgs[1], t + 1000, t + 1900);
        show(msgs[1], t + 1900);
        typing(msgs[2], t + 2500, t + 3400);
        show(msgs[2], t + 3400);
        let t2 = t + 4100;
        if (intext) t2 = typeInto(T, intext, "¡Perfecto, gracias!", t + 4100);
        sendPulse(t2 + 120);
        show(msgs[3], t2 + 500);
        T.push(setTimeout(() => loopChat(card), t2 + 3300));
      }
      demoRestartRef.current[1] = () => {
        clearCard(1);
        loopChat(card1);
      };
      perCard[1].push(setTimeout(() => loopChat(card1), 300));
    }

    // ===== Pantalla 3 — canvas de automatización (nodos que se montan,
    // conexiones que se dibujan, pulsos SMIL continuos y contador vivo) =====
    if (cards[2]) {
      const card2 = cards[2];
      function loopFlow(card: HTMLElement) {
        if (!visRef.current) {
          perCard[2].push(setTimeout(() => loopFlow(card), 1500));
          return;
        }
        const nodes = Array.from(card.querySelectorAll<HTMLElement>(".anim-fl-node"));
        const conns = Array.from(card.querySelectorAll(".anim-fl-conn")) as unknown as SVGPathElement[];
        const countEl = card.querySelector<HTMLElement>(".anim-fl-count b");
        instant(nodes, { opacity: "0", transform: "translate(-50%, -50%) scale(0.6)" });
        conns.forEach((c) => {
          const el = c as unknown as HTMLElement;
          el.style.transition = "none";
          const len = c.getTotalLength();
          el.style.strokeDasharray = String(len);
          el.style.strokeDashoffset = String(len);
        });
        card.querySelector(".anim-fl-svg")?.getBoundingClientRect();
        const T = perCard[2];
        const popNode = (i: number, at: number) =>
          T.push(
            setTimeout(() => {
              const n = nodes[i];
              if (!n) return;
              n.style.transition = "opacity .4s, transform .45s cubic-bezier(.34,1.56,.64,1)";
              n.style.opacity = "1";
              n.style.transform = "translate(-50%, -50%) scale(1)";
            }, at)
          );
        const drawConn = (i: number, at: number) =>
          T.push(
            setTimeout(() => {
              const el = conns[i] as unknown as HTMLElement | undefined;
              if (!el) return;
              el.style.transition = "stroke-dashoffset .6s ease";
              el.style.strokeDashoffset = "0";
            }, at)
          );
        // Triggers → conexiones de entrada → agente → salidas.
        popNode(0, 250);
        popNode(1, 470);
        drawConn(0, 800);
        drawConn(1, 950);
        popNode(2, 1350);
        drawConn(2, 1800);
        drawConn(3, 1950);
        popNode(3, 2350);
        popNode(4, 2550);
        // El contador de ejecuciones late con los pulsos.
        if (countEl) {
          for (let k = 0; k < 4; k++) {
            T.push(
              setTimeout(() => {
                countEl.textContent = String(247 + k + 1);
                countEl.style.transition = "none";
                countEl.style.transform = "scale(1.25)";
                T.push(
                  setTimeout(() => {
                    countEl.style.transition = "transform .3s";
                    countEl.style.transform = "scale(1)";
                  }, 30)
                );
              }, 3100 + k * 1350)
            );
          }
        }
        T.push(setTimeout(() => loopFlow(card), 9200));
      }
      demoRestartRef.current[2] = () => {
        clearCard(2);
        loopFlow(card2);
      };
      perCard[2].push(setTimeout(() => loopFlow(card2), 300));
    }

    // ===== Pantalla 4 — Search Console (líneas que se dibujan, contadores
    // y un cursor con tooltip que recorre la curva de clics) =====
    if (cards[3]) {
      const card3 = cards[3];
      // Puntos de la polilínea de clics (viewBox 260×90) — el runner los
      // pisa uno a uno con transiciones lineales entre medias.
      const PTS: Array<[number, number]> = [
        [0, 68],
        [26, 64],
        [52, 66],
        [78, 56],
        [104, 58],
        [130, 46],
        [156, 50],
        [182, 38],
        [208, 34],
        [234, 24],
      ];
      function loopSeo(card: HTMLElement) {
        if (!visRef.current) {
          perCard[3].push(setTimeout(() => loopSeo(card), 1500));
          return;
        }
        const lines = Array.from(card.querySelectorAll(".anim-sc-line")) as unknown as SVGPathElement[];
        const areas = Array.from(card.querySelectorAll<HTMLElement>(".anim-sc-area"));
        const chips = Array.from(card.querySelectorAll<HTMLElement>(".anim-sc-chip-val"));
        const run = card.querySelector<HTMLElement>(".anim-sc-run");
        const tipB = card.querySelector<HTMLElement>(".anim-sc-tip b");
        lines.forEach((l) => {
          const el = l as unknown as HTMLElement;
          el.style.transition = "none";
          const len = l.getTotalLength();
          el.style.strokeDasharray = String(len);
          el.style.strokeDashoffset = String(len);
        });
        instant(areas, { opacity: "0" });
        if (run) {
          run.style.transition = "none";
          run.style.opacity = "0";
          run.style.left = "7.5%";
        }
        chips.forEach((c) => (c.textContent = fmtNum(0, c.dataset.fmt ?? null)));
        card.querySelector(".anim-sc-chart")?.getBoundingClientRect();
        const T = perCard[3];
        lines.forEach((l, i) =>
          T.push(
            setTimeout(() => {
              const el = l as unknown as HTMLElement;
              el.style.transition = "stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)";
              el.style.strokeDashoffset = "0";
            }, 150 + i * 200)
          )
        );
        T.push(
          setTimeout(
            () =>
              areas.forEach((a) => {
                a.style.transition = "opacity .6s";
                a.style.opacity = "1";
              }),
            1100
          )
        );
        chips.forEach((c, i) => countTo(T, c, Number(c.dataset.t ?? 0), 300 + i * 150, 1500, c.dataset.fmt ?? null));
        T.push(
          setTimeout(() => {
            if (run) {
              run.style.transition = "opacity .3s, left .24s linear";
              run.style.opacity = "1";
            }
          }, 1900)
        );
        const runStart = 2050;
        const stepMs = 240;
        for (let s = 0; s < 2; s++) {
          for (let k = 0; k < PTS.length; k++) {
            T.push(
              setTimeout(() => {
                if (!run) return;
                const [x, y] = PTS[s % 2 === 0 ? k : PTS.length - 1 - k];
                // Clamp 7.5%–92.5% (V16.37): en x=0 el tooltip (centrado
                // con translateX(-50%)) se cortaba por el borde izquierdo.
                const fx = Math.max(0.075, Math.min(0.925, x / 260));
                run.style.left = `${fx * 100}%`;
                run.style.setProperty("--dy", `${(y / 90) * 100}%`);
                if (tipB) tipB.textContent = Math.round((84 - y) * 21).toLocaleString("es-ES");
              }, runStart + s * PTS.length * stepMs + k * stepMs)
            );
          }
        }
        T.push(setTimeout(() => loopSeo(card), runStart + 2 * PTS.length * stepMs + 700));
      }
      demoRestartRef.current[3] = () => {
        clearCard(3);
        loopSeo(card3);
      };
      perCard[3].push(setTimeout(() => loopSeo(card3), 300));
    }

    // ===== Pantalla 5 — app en marcha (barras, ventas contando,
    // notificaciones entrando y anillo de uptime) =====
    if (cards[4]) {
      const card4 = cards[4];
      const RING_LEN = 2 * Math.PI * 26;
      function loopApp(card: HTMLElement) {
        if (!visRef.current) {
          perCard[4].push(setTimeout(() => loopApp(card), 1500));
          return;
        }
        const bars = Array.from(card.querySelectorAll<HTMLElement>(".anim-ap-bars i"));
        const count = card.querySelector<HTMLElement>(".anim-ap-count");
        const notifs = Array.from(card.querySelectorAll<HTMLElement>(".anim-ap-notif"));
        const ringWrap = card.querySelector<HTMLElement>(".anim-ap-ring");
        const ring = card.querySelector(".anim-ap-ring-fill") as unknown as SVGCircleElement | null;
        instant(bars, { transform: "scaleY(0)" });
        instant(notifs, { opacity: "0", transform: "translateX(24px)" });
        if (count) count.textContent = "0";
        if (ringWrap) {
          ringWrap.style.transition = "none";
          ringWrap.style.opacity = "0";
        }
        if (ring) {
          const el = ring as unknown as HTMLElement;
          el.style.transition = "none";
          el.style.strokeDasharray = String(RING_LEN);
          el.style.strokeDashoffset = String(RING_LEN);
        }
        card.querySelector(".anim-ap-screen")?.getBoundingClientRect();
        const T = perCard[4];
        bars.forEach((b, i) =>
          T.push(
            setTimeout(() => {
              b.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)";
              b.style.transform = "scaleY(1)";
            }, 300 + i * 120)
          )
        );
        if (count) countTo(T, count, 2840, 400, 1600, "int");
        notifs.forEach((n, i) =>
          T.push(
            setTimeout(() => {
              n.style.transition = "opacity .45s, transform .5s cubic-bezier(.34,1.56,.64,1)";
              n.style.opacity = "1";
              n.style.transform = "translateX(0)";
            }, 1500 + i * 550)
          )
        );
        T.push(
          setTimeout(() => {
            if (ringWrap) {
              ringWrap.style.transition = "opacity .4s";
              ringWrap.style.opacity = "1";
            }
            if (ring) {
              const el = ring as unknown as HTMLElement;
              el.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)";
              el.style.strokeDashoffset = String(RING_LEN * 0.001);
            }
          }, 2700)
        );
        T.push(setTimeout(() => loopApp(card), 8800));
      }
      demoRestartRef.current[4] = () => {
        clearCard(4);
        loopApp(card4);
      };
      perCard[4].push(setTimeout(() => loopApp(card4), 300));
    }

    return () => {
      io.disconnect();
      perCard.forEach((_, i) => clearCard(i));
      demoRestartRef.current = [];
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
