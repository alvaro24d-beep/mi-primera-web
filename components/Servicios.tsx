"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { scrambleElement } from "@/hooks/useTextScramble";
import { Link } from "@/i18n/navigation";
import { useServiciosCardsRegistry } from "@/store/useServiciosCardsRegistry";
import { esMovil } from "@/lib/scrollRitmo";

gsap.registerPlugin(ScrollTrigger, SplitText);

// V16.27 — Las 5 demos renovadas como PANTALLAS: cada una llena la card
// entera (position absolute inset 0, layouts fluidos en % — cero tamaños
// fijos de stage) como si el cristal fuese un display reproduciendo una UI
// real. La coreografía vive en los loops JS de abajo (perCard timers +
// reinicio-al-centrar); los detalles idle (shimmer, pulsos, caret) son
// keyframes CSS pausados por .nxr-anims-live fuera de pantalla.
// V16.82 — "Web experiencial": la pantalla muestra una web CON FONDO 3D
// (suelo-rejilla en perspectiva + orbes de marca flotando a distinta
// profundidad, como la propia arcfine) que primero SE CREA (URL tecleada +
// candado SSL → el fondo 3D se enciende → el hero entra por bloques) y
// después SE RECORRE con scroll AUTOMÁTICO: el flujo de secciones pasa por
// el viewport (estados -s1/-s2) mientras cada capa del fondo se desplaza a
// su propia velocidad (parallax manual por capa) y un rótulo lateral
// acompaña cada sección. El guion vive en el loopWeb de abajo.
function Web3DAnim() {
  return (
    <div className="anim-w3" aria-hidden="true">
      <div className="anim-w3-bar">
        <span className="anim-w3-dot" />
        <span className="anim-w3-dot" />
        <span className="anim-w3-dot" />
        <div className="anim-w3-url">
          <svg className="anim-w3-lock" viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <span className="anim-w3-url-text">tunegocio.es</span>
        </div>
      </div>
      <div className="anim-w3-view">
        {/* Fondo 3D de la web ficticia — parallax por capas en -s1/-s2 */}
        <div className="anim-w3-bg">
          <i className="anim-w3-floor" />
          <i className="anim-w3-orb -a" />
          <i className="anim-w3-orb -b" />
          <i className="anim-w3-orb -c" />
        </div>
        {/* Nav fija de la web ficticia: no viaja con el scroll (V17.9). */}
        <div className="anim-w3-nav">
          <i className="anim-w3-nav-logo" />
          <i className="anim-w3-nav-link" />
          <i className="anim-w3-nav-link" />
          <i className="anim-w3-nav-link" />
          <i className="anim-w3-nav-cta" />
        </div>
        {/* Contenido: 3 pantallas apiladas que el auto-scroll recorre */}
        <div className="anim-w3-flow">
          <div className="anim-w3-sec">
            <span className="anim-w3-line -title" />
            <span className="anim-w3-line -sub" />
            <span className="anim-w3-btns">
              <span className="anim-w3-btn">
                <i />
              </span>
              <span className="anim-w3-btn -ghost">
                <i />
              </span>
            </span>
          </div>
          <div className="anim-w3-sec -gal">
            <i className="anim-w3-line -ghead" />
            <div className="anim-w3-tile">
              <i className="anim-w3-img" />
              <i className="anim-w3-line -t1" />
            </div>
            <div className="anim-w3-tile">
              <i className="anim-w3-img -b" />
              <i className="anim-w3-line -t1" />
            </div>
            <div className="anim-w3-tile">
              <i className="anim-w3-img -c" />
              <i className="anim-w3-line -t1" />
            </div>
          </div>
          <div className="anim-w3-sec -fin">
            <div className="anim-w3-stats">
              <span className="anim-w3-stat">
                <b>0</b>
                <i>visitas</i>
              </span>
              <span className="anim-w3-stat -b">
                <b>0</b>
                <i>conversión</i>
              </span>
              <span className="anim-w3-stat -c">
                <b>0</b>
                <i>rendimiento</i>
              </span>
            </div>
            <span className="anim-w3-foot" />
          </div>
        </div>
        {/* Rótulos laterales por sección */}
        <span className="anim-w3-cap -c0">Inmersiva</span>
        <span className="anim-w3-cap -c1">Fluida</span>
        <span className="anim-w3-cap -c2">Convierte</span>
        {/* Rueda: el "scroll" que conduce el recorrido */}
        <span className="anim-w3-wheel">
          <i />
        </span>
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
          <b>Agente arcfine</b>
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
        <div className="anim-ia-msg -bot">Te envío un recordatorio el día antes. 📅</div>
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
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.92;1" dur="2s" repeatCount="indefinite" />
            <animateMotion dur="2s" repeatCount="indefinite" path="M36,30 C90,30 96,69 150,69 C204,69 210,30 264,30" />
          </circle>
          <circle className="anim-fl-pulse" r="2.8">
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.92;1" dur="2.3s" repeatCount="indefinite" begin="0.9s" />
            <animateMotion dur="2.3s" repeatCount="indefinite" begin="0.9s" path="M36,108 C90,108 96,69 150,69 C204,69 210,108 264,108" />
          </circle>
          <circle className="anim-fl-pulse -lime" r="2.8">
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.92;1" dur="2.1s" repeatCount="indefinite" begin="0.5s" />
            <animateMotion dur="2.1s" repeatCount="indefinite" begin="0.5s" path="M36,30 C90,30 96,69 150,69 C204,69 210,108 264,108" />
          </circle>
          <circle className="anim-fl-pulse -lime" r="3">
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.92;1" dur="2.2s" repeatCount="indefinite" begin="1.4s" />
            <animateMotion dur="2.2s" repeatCount="indefinite" begin="1.4s" path="M36,108 C90,108 96,69 150,69 C204,69 210,30 264,30" />
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
          {/* Objetivo del trimestre: guía punteada que la curva casi alcanza. */}
          <path className="anim-sc-goal" d="M0,14 L260,14" />
        </svg>
        <span className="anim-sc-badge">▲ 23% este mes</span>
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

// Vídeo de fondo del muro POR SERVICIO (V17.22): al enfocar cada card, la
// pantalla del fondo transiciona a su clip con la cascada de paneles (ver
// SceneBackground, evento nxr:wall-video). Los archivos van en public/ con
// estos nombres exactos; si alguno falta, la transición se aborta sola y el
// muro conserva el clip que tuviera — se pueden ir soltando de uno en uno.
// Mismos clips (landscape) en móvil: el cover-crop del shader los encuadra.
// `null` = sin clip propio: el muro vuelve a su vídeo por defecto (ya
// descargado y decodificándose) en vez de pedir un archivo que no existe.
// Agentes IA está así a propósito (V17.76):
// su /bg-servicio-ia.mp4 nunca se subió, y apuntar a él salía CARO — el
// gestor de SceneBackground creaba un <video>, esperaba el 404, abortaba la
// cascada y ARRANCABA UNA SEGUNDA transición de vuelta al clip por defecto,
// con su descarga incluida, cada vez que la card tomaba el centro. Cuando el
// archivo exista, basta con volver a poner su ruta aquí.
const SERVICE_VIDEOS: (string | null)[] = [
  "/bg-servicio-web.mp4",
  null,
  "/bg-servicio-auto.mp4",
  "/bg-servicio-seo.mp4",
  "/bg-servicio-apps.mp4",
];

const setWallVideo = (src: string | null) => {
  window.dispatchEvent(new CustomEvent("nxr:wall-video", { detail: { src } }));
};

// PRECARGA DE LOS CLIPS (V18.35). Se avisa al muro en cuanto la sección
// asoma, no cuando se pide cada clip: hasta ahora la descarga de ~2,5 MB
// arrancaba en el instante del cambio de card y la cascada esperaba a su
// primer frame, así que la espera de red se veía entera como "el vídeo tarda
// en cambiar". Avisando aquí, los clips llegan mientras se lee la primera
// card y los cambios posteriores ya no tocan la red.
// SceneBackground los descarga DE UNO EN UNO y los deja pausados en su caché;
// es idempotente, así que reemitirlo en cada entrada no cuesta nada.
const precacheWallVideos = () => {
  window.dispatchEvent(
    new CustomEvent("nxr:wall-precache", {
      detail: { srcs: SERVICE_VIDEOS.filter((s): s is string => typeof s === "string") },
    })
  );
};

// (V17.76: cada entrada tenía además un `icon` con su SVG inline. La card del
// reel es una PANTALLA desde el rediseño — solo muestra su mini-animación —,
// así que ni GlassCard ni Caption lo renderizaban: cinco árboles de elementos
// React construidos al evaluar el módulo y retenidos para nada. Los iconos de
// servicio siguen donde sí se ven: el desplegable del nav, en Header.tsx.)
const CARDS = [
  {
    tag: "Desarrollo web",
    title: "Web experiencial.",
    desc: "Diseñamos y desarrollamos sitios web a medida con rendimiento real, experiencia de usuario cuidada y arquitectura pensada para escalar. Sin plantillas. Sin límites.",
    pills: ["Landing", "Portales corporativos", "E-com", "SaaS"],
    anim: <Web3DAnim />,
    cta: "Quiero mi web",
    href: "/desarrollo-web/",
  },
  {
    tag: "Agentes IA",
    title: "Agentes que trabajan por ti, 24/7.",
    desc: "Asistentes inteligentes conectados a tus herramientas que atienden clientes, gestionan citas y ejecutan tareas sin intervención humana.",
    pills: ["WhatsApp", "Web chat", "Email", "CRM"],
    anim: <ChatAnim />,
    cta: "Activar mi agente",
    href: "/agentes-ia/",
  },
  {
    tag: "Automatizaciones",
    title: "Flujos que eliminan el trabajo repetitivo.",
    desc: "Conectamos tus apps y automatizamos procesos con n8n para que tu equipo dedique su tiempo a lo que importa.",
    pills: ["n8n", "CRM", "Facturación", "Reportes"],
    anim: <FlowAnim />,
    cta: "Automatizar ahora",
    href: "/automatizaciones/",
  },
  {
    tag: "SEO & Posicionamiento",
    title: "Visibilidad real en Google.",
    desc: "Estrategia SEO técnica y de contenido para que tus clientes te encuentren cuando te necesitan.",
    pills: ["SEO técnico", "Contenido", "Local SEO", "Auditorías"],
    anim: <SeoAnim />,
    cta: "Subir posiciones",
    href: "/seo-posicionamiento/",
  },
  {
    tag: "Apps & Software",
    title: "Software a medida para tu negocio.",
    desc: "Desarrollamos aplicaciones web y móviles que resuelven el problema exacto de tu empresa, integradas con tu ecosistema actual.",
    pills: ["Web apps", "APIs REST", "Integraciones", "Dashboards"],
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

      // Troceado de la frase de sección (ver más abajo): se declara aquí
      // porque lo consumen DOS sitios — el scrub de aproximación y el prólogo
      // del pin, que se reconstruye en cada refresh y no debe re-trocear.
      let headSplit: SplitText | null = null;
      let headChars: HTMLElement[] = [];

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
      // El WRAPPER fijo. Es la capa sobre la que actúa el clamp del ticker, y
      // NO puede ser la misma que anima el scrub (ver el bloque del clamp más
      // abajo): con las dos escribiendo los mismos targets, el `overwrite` de
      // una mataba el tween de la otra y había caracteres que ya no volvían a
      // revelarse nunca.
      const headWrap = q(".nxr-servicios-head")[0] as HTMLElement | undefined;
      // Caracteres de la frase, troceados UNA vez y compartidos por la entrada
      // (aquí) y la salida (en buildTl): el desenfoque ya no se aplica al
      // bloque entero de golpe, sino carácter a carácter con retardo — así el
      // foco BARRE la frase de izquierda a derecha conforme se scrollea, y al
      // irse vuelve a difuminarse empezando por el principio.
      // El acento .nxr-gradient-text-salmon se puede trocear sin miedo: es un
      // `color` plano, no un background-clip como el lime (que sí se rompería).
      if (headTitle && !headSplit) {
        headSplit = SplitText.create(headTitle, { type: "words, chars" });
        headChars = headSplit.chars as HTMLElement[];
        // ESTADO BASE EXPLÍCITO — sin esto la frase se ve desde el primer
        // frame de la página, encima de todo (es position: fixed). Con
        // `fromTo` + `stagger` + `scrub`, GSAP aplica el `from` a cada
        // carácter SOLO cuando llega su turno dentro del escalonado; los que
        // aún no han empezado se quedan en su estado natural del CSS, es
        // decir, opacidad 1 y sin desenfoque. Con 2.4 de retardo repartido,
        // eso son casi todos durante casi todo el recorrido: era el origen
        // real del "se solapan e interfieren entre sí", y también de los
        // caracteres finales que medían blur 0 cuando debían estar borrosos.
        gsap.set(headChars, { opacity: 0, filter: "blur(18px)" });
      }
      if (headTitle && headChars.length) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: sticky,
              // El final está clavado donde arranca el pin, así que para que la
              // frase DURE MÁS solo se puede adelantar el principio. En
              // escritorio pasa de 0.7·vh a 1.35·vh de recorrido (V17.55, "se
              // pasa demasiado rápido y no da tiempo a verla"): casi el doble
              // de scroll para el mismo barrido, sin tocar ni el PROLOGUE ni
              // ninguna otra cota del reel. Móvil se queda como estaba: allí
              // la pantalla es más corta y adelantarlo la solaparía con Intro.
              // Móvil a 115% (V17.66): el recorrido de la frase baja de 150 a
              // 115vh — un 23% menos de scroll para pasarla. El hueco NO
              // reaparece porque la Intro se acorta en el mismo número (su
              // trigger termina ahora en "bottom 115%", ver Intro.tsx): el
              // sticky de Servicios cae justo detrás del bottom de la Intro,
              // así que ambas cifras se miden en la misma escala y encadenan.
              start: () => (!esMovil() ? "top 135%" : "top 115%"),
              end: "top top",
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(
            headChars,
            { opacity: 0, filter: "blur(18px)" },
            {
              opacity: 1,
              filter: "blur(0px)",
              ease: "none",
              // Lo que hace el barrido PROGRESIVO no es la duración total sino
              // la proporción entre el retardo repartido (`amount`) y lo que
              // tarda cada carácter (`duration`). Antes 0.75 sobre 1: el
              // escalonado era solo el 43% de la timeline y el conjunto se
              // resolvía casi de golpe. Ahora 2.4 sobre 0.5 → el 83%, así que
              // la ola recorre la frase durante casi todo el scroll disponible
              // en vez de concentrarse al principio. (V17.57)
              duration: 0.5,
              stagger: { amount: 2.4, from: "start" },
            }
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
      // ENTRADA DE LA CARD 0, MÁS LENTA Y SIN TIRÓN (V18.37, "la primera card
      // entra siempre muy rápido, que vaya más suave y despacio").
      //
      // El problema no era la distancia sino el PERFIL: acabado el prólogo
      // —donde el track está completamente quieto— el movimiento arrancaba de
      // golpe a 1px de x por 1px de scroll. Un salto de velocidad de 0 a 1 en
      // un frame, justo cuando la card asoma por el borde.
      //
      // Ahora ese primer tramo recibe el DOBLE de scroll para la misma
      // distancia y se recorre con `power1.in` (x ∝ p²). Los dos números van
      // juntos y no son intercambiables: con duración 2·D y perfil cuadrático,
      // la velocidad sale de 0 —empalma con el prólogo quieto— y llega
      // exactamente a 1 al final, que es la velocidad del tramo lineal que
      // sigue. Ni un salto ni al entrar ni al salir. Si se cambia el factor,
      // el ease deja de casar: con 3·D haría falta un p³, y con cualquier
      // otro par aparece un tirón en el empalme (el mismo error que se
      // arrastró tres versiones en el sticky de ZoomParallax).
      //
      // Los PUNTOS DE ANCLAJE no se mueven: la card 0 sigue quedando centrada
      // al terminar este tramo y las demás a un paso de distancia entre sí, en
      // el tramo lineal. Por eso pOf() sigue siendo exacto —basta con contar
      // el tramo alargado, ver allí— y con él la paginación y el snap.
      const ENTRADA_SCROLL = 2;
      // Distancia REAL que recorre el track en x. No cambia.
      const recorridoX = () => entryOffset() + Math.max(0, track.scrollWidth - cardWidth());
      // Scroll que consume: el mismo recorrido, pero con el tramo de entrada
      // estirado. Es lo único que alarga el pin.
      const moveAmount = () =>
        entryOffset() * ENTRADA_SCROLL + Math.max(0, track.scrollWidth - cardWidth());
      const amount = () => PROLOGUE() + moveAmount();
      const endX = () => startX() - recorridoX();

      // Smaller arc on phones: the stretched glass there nearly fills the
      // space between heading and captions, so a tall arc would ride the
      // departing card into either overlay. Desktop's is deliberately much
      // taller than the drum angle alone needs, so the helix's climb reads
      // clearly instead of looking like a flat horizontal strip.
      const isDesktopUI = !esMovil();
      // Cuánto del prólogo aguanta la frase a brillo y nitidez COMPLETOS antes
      // de empezar a disolverse, en fracción de PROLOGUE. Vale para los tres
      // sitios que necesitan saberlo —el tween de buildTl, la guarda de
      // trySnap y la de touchend—, que es justo lo que pedía el comentario de
      // buildTl: los umbrales de momentos solapados comparten constante. Antes
      // era un 0.65 escrito a mano en cada uno.
      //
      // Móvil 0.52 (V18.10, "que no haya que hacer tanto scroll para pasarla"):
      // sobre un prólogo de 1.35·vh son ~70vh de frase a plena legibilidad
      // frente a los ~88vh de antes, un 20% menos de recorrido. Se queda por
      // encima del suelo de 60vh que hace falta para que la frase no se pueda
      // saltar de un flick — por debajo de ahí deja de leerse en un scroll
      // normal. NO se toca PROLOGUE: esa geometría está validada en teléfono
      // físico y bajarla rompió la entrada dos veces (ver su comentario).
      const HOLD_FRASE = isDesktopUI ? 0.65 : 0.52;
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
              // Y el muro del fondo transiciona al clip de este servicio
              // (V17.22) con la cascada de paneles.
              setWallVideo(SERVICE_VIDEOS[i] ?? null);
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
      // El tramo de entrada consume ENTRADA_SCROLL veces su distancia (V18.37,
      // ver el tween en buildTl), así que la card 0 queda centrada en
      // snapPro + snapEntry·ENTRADA_SCROLL. De ahí en adelante el track vuelve
      // a ser 1:1, por eso las demás siguen sumando un snapStep limpio.
      const pOf = (i: number) =>
        snapAmount && snapStep
          ? (snapPro + snapEntry * ENTRADA_SCROLL + i * snapStep) / snapAmount
          : 0;
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
        // (su fade-out arranca exactamente en HOLD_FRASE, ver buildTl; los
        // umbrales de momentos solapados comparten constante). Cualquier
        // reposo con la frase ya desvaneciéndose desliza la card 0 desde el
        // lado mientras la frase termina de disolverse.
        if (progress * total < snapPro * HOLD_FRASE) return;
        // First settle on mobile: force card 0 (unless the flick genuinely
        // sailed past card 1) and use the page-style ease-in-out glide —
        // see `presentedFirst` above.
        const firstSettle = esMovil() && !presentedFirst;
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
          // la frase aguanta a brillo/nitidez COMPLETOS hasta HOLD_FRASE·pro
          // (~70vh móvil / ~42vh desktop de scroll legible) y solo entonces se
          // disuelve, acompañando con la primera card ya entrando (el handoff
          // clásico). HOLD_FRASE es la MISMA constante que usan las guardas de
          // trySnap/touchend (umbrales de momentos solapados comparten
          // constante) y el clamp del ticker (1.3·snapPro) cubre el final del
          // fade.
          // Salida con el MISMO barrido que la entrada: el desenfoque empieza
          // por el principio de la frase y avanza hacia la derecha, en vez de
          // apagarse toda a la vez.
          t.to(
            headChars,
            {
              opacity: 0,
              filter: "blur(18px)",
              ease: "none",
              // Misma lógica que la entrada: el escalonado pasa a llevarse el
              // grueso del tramo (0.14 de duración por carácter frente a 0.62
              // repartidos) para que la salida también se lea progresiva y no
              // como un apagón. La suma sigue cabiendo en el prólogo, así que
              // el handoff con la primera card no se mueve.
              duration: pro * 0.14,
              stagger: { amount: pro * 0.62, from: "start" },
            },
            pro * HOLD_FRASE
          );
        }
        // Dos tramos, no uno (V18.37 — ver ENTRADA_SCROLL arriba):
        //  1) la entrada de la card 0, acelerando desde parado hasta la
        //     velocidad de crucero, en el doble de scroll que su distancia;
        //  2) el resto del reel, lineal 1px de scroll = 1px de x, como
        //     siempre.
        // Empalman a velocidad 1 exacta, así que el paso de uno a otro no se
        // nota. La card 0 queda centrada justo en la juntura.
        const entradaScroll = snapEntry * ENTRADA_SCROLL;
        t.fromTo(track, { x: startX() }, { x: centredX(), ease: "power1.in", duration: entradaScroll }, pro);
        t.to(track, { x: endX(), ease: "none", duration: moveAmount() - entradaScroll }, pro + entradaScroll);
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
            if (!presentedFirst && esMovil() && !snapGliding) {
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
      if (headTitle && headWrap) {
        // V16.40 ("a veces desaparece de golpe"): el clamp ya no corta con
        // un set seco — en un flick rápido el scroll real cruza 1.3·pro
        // mientras el scrub (lag 0.5s) aún pinta la frase a media
        // disolución, y el set instantáneo se veía como un POP. Ahora
        // fuerza el apagado con un fundido corto (0.25s, blur incluido):
        // misma autoridad anti-carrera, sin corte visible.
        let clamping = false;
        let healing = false;
        let curandoChars = false;
        let spacer: HTMLElement | null = null;
        // DOS CAPAS SEPARADAS (V17.66), y esto es lo que arregla el bug de
        // "algunas palabras desaparecen":
        //   · los CARACTERES los anima el scrub (barrido de blur+opacidad);
        //   · el WRAPPER lo anima este clamp, con su propia opacidad.
        // Antes ambos escribían los caracteres, y como el clamp usa
        // `overwrite: auto` —necesario para matar un catch-up rezagado—
        // liquidaba también el tween del scrub. A partir de ahí esos
        // caracteres se quedaban clavados donde el clamp los dejó y no
        // volvían a revelarse: ni al pasar de nuevo, ni al volver desde otra
        // sección o página. Con capas distintas no pueden pisarse.
        const opWrap = () => parseFloat(headWrap?.style.opacity || "1");
        const clampTitle = () => {
          const st = tl.scrollTrigger;
          if (!st) return;
          const y = window.scrollY;
          // Rango del pin medido EN VIVO desde el pin-spacer (V16.55, bug "la
          // frase desaparece al volver a la home"): st.start/st.end quedaban
          // OBSOLETOS tras una navegación cliente (en SPA no hay evento load
          // que refresque), y el clamp apagaba la frase con un rango
          // equivocado dejándola invisible. El top del pin-spacer en el
          // documento (getBoundingClientRect + scrollY) es una lectura viva y
          // siempre correcta; el largo del pin (end−start) es estable aunque
          // el absoluto esté desfasado.
          if (!spacer) spacer = sticky.closest<HTMLElement>(".pin-spacer");
          const start = spacer ? spacer.getBoundingClientRect().top + y : st.start;
          const end = start + (st.end - st.start);
          // Fuera del rango completo del momento-frase, O ya pasado el
          // final de su fade-out DENTRO del pin (el fade termina a 1.2·pro).
          // El margen de cabeza TIENE que cubrir el arranque del scrub de
          // aproximación. Al adelantarlo a "top 135%" (V17.55) sin tocar este
          // 1·vh, quedó una franja de 0.35·vh en la que el clamp declaraba la
          // frase "fuera" y la apagaba MIENTRAS el scrub la encendía: los dos
          // escribiendo la misma propiedad en direcciones opuestas. 1.45 deja
          // holgura por delante del 1.35 real.
          // El margen sigue al start del scrub en CADA breakpoint: si se
          // queda corto, el clamp apaga la frase mientras el scrub la
          // enciende (ver V17.59).
          const head = window.innerHeight * (!esMovil() ? 1.45 : 1.25);
          const outside = y < start - head || y > end || y > start + snapPro * 1.3;
          if (outside) {
            // BUG V17.57 → V17.58: el clamp leía y escribía en headTitle (el
            // contenedor), pero desde que el barrido va por CARACTERES son
            // ellos quienes llevan opacity/filter. El apagado de emergencia no
            // alcanzaba a lo que se ve, así que al volver atrás deprisa la
            // frase se quedaba pintada sobre la Intro — es fixed, no la tapa
            // nadie. Ahora clamp y healing operan sobre los MISMOS targets que
            // los scrubs, y `overwrite: auto` mata de paso su tween rezagado.
            // Se leen el primero y el último porque el barrido los deja en
            // extremos opuestos: si ambos están apagados, no queda nada visible.
            if (opWrap() > 0.01 && !clamping) {
              clamping = true;
              gsap.to(headWrap!, {
                opacity: 0,
                duration: 0.25,
                ease: "power1.in",
                overwrite: "auto",
                onComplete: () => {
                  clamping = false;
                },
              });
            }
            return;
          }
          clamping = false;
          // DENTRO del rango, el wrapper SIEMPRE encendido. Antes esto era un
          // "auto-recuperado" limitado a la ventana de HOLD (y >= start &&
          // y <= start + snapPro·0.6), y con el clamp actuando ya sobre el
          // wrapper eso dejaba un agujero: al volver a entrar por un tramo
          // intermedio, nada lo reencendía y la frase no reaparecía nunca.
          // Como master switch la regla es binaria — fuera apagado, dentro
          // encendido — y quien module la aparición es el scrub sobre los
          // caracteres, que es su trabajo.
          if (opWrap() < 0.99 && !healing) {
            healing = true;
            gsap.to(headWrap!, {
              opacity: 1,
              duration: 0.3,
              ease: "power1.out",
              overwrite: "auto",
              onComplete: () => {
                healing = false;
              },
            });
          }

          // RED DE SEGURIDAD SOBRE LOS CARACTERES (V18.37, "la frase a veces
          // se bugea, desaparece").
          //
          // Todo lo de arriba vigila el WRAPPER, pero desde que el barrido va
          // por caracteres son ELLOS quienes llevan opacity/filter (ver
          // V17.58). Quedaba un agujero: si el wrapper está a 1 y los
          // caracteres se quedan en su estado base (opacity 0, blur 18) porque
          // el scrub de aproximación no llegó a correr —una navegación
          // cliente, un refresh de ScrollTrigger a destiempo, un salto que
          // cruza su rango entero entre dos frames—, no hay frase y NADA la
          // recupera: el master switch mira el wrapper y lo encuentra
          // perfecto.
          //
          // La ventana es deliberadamente estrecha: solo desde que el pin
          // arranca (ahí el scrub ya terminó, end "top top") hasta la mitad
          // del HOLD, muy por delante de que empiece el fade-out. Dentro de
          // ella unos caracteres apagados no son un estado intermedio válido
          // de ninguna animación, son el bug. Fuera de ella no se toca nada,
          // para no pelearse nunca con el scrub ni con el fade-out.
          if (headChars.length && y >= start && y < start + snapPro * HOLD_FRASE * 0.5) {
            const c0 = headChars[0] as HTMLElement;
            const cN = headChars[headChars.length - 1] as HTMLElement;
            const apagados =
              parseFloat(getComputedStyle(c0).opacity) < 0.01 &&
              parseFloat(getComputedStyle(cN).opacity) < 0.01;
            if (apagados && !curandoChars) {
              curandoChars = true;
              gsap.to(headChars, {
                opacity: 1,
                filter: "blur(0px)",
                duration: 0.3,
                ease: "power1.out",
                overwrite: "auto",
                onComplete: () => {
                  curandoChars = false;
                },
              });
            }
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
      if (esMovil()) {
        let touchIdx = 0;
        let touchY = 0;
        let touchX = 0;
        let touchInPin = false;
        const onTouchStart = (e: TouchEvent) => {
          fingerDown = true;
          const st = tl.scrollTrigger;
          touchInPin = !!st?.isActive;
          if (!st || !touchInPin) return;
          touchY = e.touches[0]?.clientY ?? 0;
          touchX = e.touches[0]?.clientX ?? 0;
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
          const dx = touchX - (e.changedTouches[0]?.clientX ?? touchX);
          const p = progressNow(st);
          // Released while the phrase still holds at full brightness:
          // leave the scroll natural. HOLD_FRASE = el inicio del fade-out
          // (misma constante que buildTl/trySnap) — soltar con la frase ya
          // desvaneciéndose pagina la card 0.
          if (p * snapAmount < snapPro * HOLD_FRASE) return;
          const eps = 0.02;
          let targetIdx: number | null = null;
          // El reel se recorre en DIAGONAL, así que un swipe HORIZONTAL tipo
          // carrusel también pagina — mismo glideTo, misma paginación de
          // una-card-por-gesto; solo cambia el EJE de entrada, la geometría
          // y el pin del reel siguen intactos (el glide desplaza el scroll
          // vertical por debajo, que es lo que mueve el reel). Arrastrar las
          // cards a la izquierda avanza (igual que el swipe hacia arriba), a
          // la derecha retrocede. El eje horizontal solo manda cuando DOMINA
          // el gesto (|dx| > |dy| y > 30px), para no interceptar el scroll
          // vertical normal ni sus micro-desvíos laterales.
          const horiz = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30;
          const fwd = horiz ? dx > 0 : dy > 25;
          const back = horiz ? dx < 0 : dy < -25;
          if (fwd) {
            if (p < pOf(touchIdx) - eps) targetIdx = touchIdx;
            else if (touchIdx < cards.length - 1) targetIdx = touchIdx + 1;
          } else if (back) {
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
      // Estado del frame anterior para saber si algo se movió DE VERDAD
      // (V17.76). Las dos lecturas son baratas: la x del track sale de la
      // caché de GSAP (no toca el DOM) y scrollY lo lee Lenis en este mismo
      // frame de todos modos.
      let lastTrackX = NaN;
      let lastScrollY = NaN;
      let idleFrames = 0;
      const idleTick = () => {
        if (!sectionVisible) return;
        // ¿Se ha movido el reel o la página desde el frame anterior? Si no,
        // los rects de las 5 slides son EXACTAMENTE los mismos que ya se
        // leyeron, y updateSpiral solo puede llegar a las mismas
        // conclusiones: 6 getBoundingClientRect por frame para nada. Cubre
        // los dos motores que sí mueven el reel — el scroll y la cola del
        // scrub (0.5s de lag), que sigue escribiendo la x del track después
        // del último evento de scroll.
        const trackX = Number(gsap.getProperty(track, "x")) || 0;
        const scrollY = window.scrollY;
        // Dos preguntas distintas: `layoutMovido` decide si hay que releer
        // los rects (lo caro), `enMovimiento` decide si este frame se pinta.
        const layoutMovido = trackX !== lastTrackX || scrollY !== lastScrollY;
        let enMovimiento = layoutMovido;
        lastTrackX = trackX;
        lastScrollY = scrollY;
        // Los easings del cursor también cuentan como movimiento: el tilt de
        // hover y la inclinación ambiente responden al ratón sin que la
        // página se mueva ni un píxel, y a media cadencia tardarían el doble
        // en asentar (se leería como un seguimiento blando). Comparar cinco
        // pares de números es gratis al lado de lo que evita.
        if (!enMovimiento) {
          if (
            Math.abs(mouseTarget.nx - mouseCurrent.nx) > 0.001 ||
            Math.abs(mouseTarget.ny - mouseCurrent.ny) > 0.001
          ) {
            enMovimiento = true;
          } else {
            for (let i = 0; i < cards.length; i++) {
              if (
                Math.abs(hoverTarget[i].rotX - live[i].rotationX) > 0.01 ||
                Math.abs(hoverTarget[i].rotY - live[i].rotationY) > 0.01 ||
                Math.abs(hoverTarget[i].z - live[i].z) > 0.05
              ) {
                enMovimiento = true;
                break;
              }
            }
          }
        }
        // Parado, la ÚNICA animación viva es la microderiva de abajo (±2° de
        // yaw con periodo de ~11s) más el easing del hover: a media cadencia
        // son indistinguibles, y se ahorra la mitad de los gsap.set 3D y de
        // las escrituras al registro. En cuanto algo se mueve se vuelve a
        // 60fps, que es donde importa — ahí el cristal WebGL tiene que ir
        // pegado a su ancla el mismo frame.
        if (!enMovimiento && (idleFrames++ & 1)) return;
        // Keep the drum values glued to the LIVE rects even when the scroll
        // itself is idle — the pin's scrub tween (and a paging glide's
        // settling tail) keeps moving the track after the last scroll
        // event, and this is what makes that tail animate smoothly instead
        // of freezing and then jumping (see updateSpiral's comment). The
        // loop below pushes every card afterwards, so no double-push.
        // Esa cola ENTRA por `layoutMovido`: mientras el scrub siga escribiendo
        // la x del track, el rect se relee cada frame igual que antes.
        if (layoutMovido) updateSpiral();
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

      return () => {
        // El SplitText hay que revertirlo a mano: useGSAP limpia sus
        // animaciones, no el DOM que este plugin reescribe.
        headSplit?.revert();
        cleanups.forEach((fn) => fn());
      };
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
        // Fuera de la sección, el muro vuelve a su clip por defecto con la
        // misma cascada (V17.22). Emitir null con el defecto ya puesto es
        // un no-op en SceneBackground.
        if (!entry.isIntersecting) setWallVideo(null);
        // Al asomar, los clips de los cinco servicios empiezan a bajar en
        // segundo plano para que ningún cambio de card espere a la red.
        else precacheWallVideos();
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

    // ===== Pantalla 1 — web experiencial (V17.9): las demos ya NO vuelven
    // a vacío en cada ciclo ("quiero que en todo momento se vean llenas").
    // INTRO (una sola vez, rápida): URL tecleada + SSL → el fondo 3D se
    // enciende → el hero entra por bloques. LIVE (ciclo corto): scroll
    // automático hero → galería → stats contando → snap-back invisible al
    // hero, con el fondo, la nav y el hero SIEMPRE encendidos. =====
    if (cards[0]) {
      const card0 = cards[0];
      let webBuilt = false;
      const webEls = (card: HTMLElement) => ({
        anim: card.querySelector<HTMLElement>(".anim-w3"),
        urlBox: card.querySelector<HTMLElement>(".anim-w3-url"),
        urlText: card.querySelector<HTMLElement>(".anim-w3-url-text"),
        flow: card.querySelector<HTMLElement>(".anim-w3-flow"),
        heroBits: Array.from(card.querySelectorAll<HTMLElement>(".anim-w3-sec:first-child > *")),
        statNums: Array.from(card.querySelectorAll<HTMLElement>(".anim-w3-stat b")),
      });
      function introWeb(card: HTMLElement) {
        if (!visRef.current) {
          perCard[0].push(setTimeout(() => introWeb(card), 1500));
          return;
        }
        const { anim, urlBox, urlText, flow, heroBits, statNums } = webEls(card);
        anim?.classList.add("-snap");
        anim?.classList.remove("-built", "-s1", "-s2");
        urlBox?.classList.remove("-ssl", "-typing");
        if (urlText) urlText.textContent = "";
        statNums.forEach((b) => (b.textContent = "0"));
        instant(heroBits, { opacity: "0", transform: "translateY(10px)" });
        flow?.getBoundingClientRect();
        anim?.classList.remove("-snap");
        const T = perCard[0];
        // 1) URL tecleada + SSL, en medio segundo.
        T.push(setTimeout(() => urlBox?.classList.add("-typing"), 100));
        if (urlText) typeInto(T, urlText, "tunegocio.es", 110, 26);
        T.push(
          setTimeout(() => {
            urlBox?.classList.remove("-typing");
            urlBox?.classList.add("-ssl");
          }, 460)
        );
        // 2) El fondo 3D + la nav se encienden ya.
        T.push(setTimeout(() => anim?.classList.add("-built"), 550));
        // 3) El hero entra por bloques, pegado al encendido.
        heroBits.forEach((el, i) =>
          T.push(
            setTimeout(() => {
              el.style.transition = "opacity .4s, transform .4s";
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, 700 + i * 110)
          )
        );
        T.push(
          setTimeout(() => {
            webBuilt = true;
            liveWeb(card);
          }, 1800)
        );
      }
      function liveWeb(card: HTMLElement) {
        if (!visRef.current) {
          perCard[0].push(setTimeout(() => liveWeb(card), 1500));
          return;
        }
        const { anim, urlBox, urlText, flow, heroBits, statNums } = webEls(card);
        // Normalizado SIN vaciar: fondo/nav/hero/URL quedan como están —
        // solo se garantiza el estado (por si un restart cortó a medias).
        anim?.classList.add("-snap");
        anim?.classList.add("-built");
        anim?.classList.remove("-s1", "-s2");
        urlBox?.classList.remove("-typing");
        urlBox?.classList.add("-ssl");
        if (urlText) urlText.textContent = "tunegocio.es";
        instant(heroBits, { opacity: "1", transform: "translateY(0)" });
        // Las stats se rearman a 0 mientras su pantalla está fuera de vista.
        statNums.forEach((b) => (b.textContent = "0"));
        flow?.getBoundingClientRect();
        anim?.classList.remove("-snap");
        const T = perCard[0];
        // 1) Respiro en el hero y scroll automático a la galería.
        T.push(setTimeout(() => anim?.classList.add("-s1"), 1100));
        // 2) Scroll a la pantalla final: métricas contando.
        T.push(setTimeout(() => anim?.classList.add("-s2"), 2800));
        if (statNums[0]) {
          countTo(T, statNums[0], 140, 3300, 600, null);
          T.push(setTimeout(() => (statNums[0].textContent = "+140%"), 4020));
        }
        if (statNums[1]) {
          countTo(T, statNums[1], 3, 3450, 450, null);
          T.push(setTimeout(() => (statNums[1].textContent = "x3"), 4020));
        }
        if (statNums[2]) countTo(T, statNums[2], 99, 3600, 500, null);
        // 3) Lectura breve y snap-back invisible al hero (todo sigue lleno).
        T.push(setTimeout(() => liveWeb(card), 5700));
      }
      demoRestartRef.current[0] = () => {
        clearCard(0);
        if (webBuilt) liveWeb(card0);
        else introWeb(card0);
      };
      perCard[0].push(setTimeout(() => introWeb(card0), 300));
    }

    // ===== Pantalla 2 — chat del agente (V17.9): la conversación NUNCA se
    // vacía. INTRO (una vez): el hilo llega ya con 3 burbujas y el usuario
    // teclea el cierre. LIVE (ciclo): solo se renuevan los 2 últimos
    // mensajes — el usuario pide mover la cita, el agente ACTUALIZA la
    // card de confirmación (pop + texto nuevo) y responde; los ciclos
    // alternan 12:00 ↔ 10:30 para que el hilo evolucione de verdad. =====
    if (cards[1]) {
      const card1 = cards[1];
      let chatBuilt = false;
      let chatFlip = false;
      const SCRIPTS = [
        { ask: "¿Podéis moverla a las 12:00?", when: "Jueves · 12:00", reply: "¡Hecho! Nos vemos a las 12:00. ✅" },
        { ask: "¿Mejor volvemos a las 10:30?", when: "Jueves · 10:30", reply: "¡Hecho! Te espero el jueves. ✅" },
      ];
      const chatEls = (card: HTMLElement) => ({
        msgs: Array.from(card.querySelectorAll<HTMLElement>(".anim-ia-msg:not(.-typing)")),
        typingEl: card.querySelector<HTMLElement>(".anim-ia-msg.-typing"),
        intext: card.querySelector<HTMLElement>(".anim-ia-intext"),
        send: card.querySelector<HTMLElement>(".anim-ia-send"),
        cardMsg: card.querySelector<HTMLElement>(".anim-ia-msg.-card"),
      });
      const chatShow = (T: ReturnType<typeof setTimeout>[], m: HTMLElement | undefined, at: number) => {
        if (!m) return;
        T.push(
          setTimeout(() => {
            m.style.transition = "opacity .4s, transform .4s";
            m.style.opacity = "1";
            m.style.transform = "translateY(0)";
          }, at)
        );
      };
      const chatTyping = (
        T: ReturnType<typeof setTimeout>[],
        typingEl: HTMLElement | null,
        before: HTMLElement | undefined,
        from: number,
        to: number
      ) => {
        if (!typingEl) return;
        T.push(
          setTimeout(() => {
            if (before && before.parentElement) before.parentElement.insertBefore(typingEl, before);
            typingEl.style.display = "flex";
          }, from)
        );
        T.push(setTimeout(() => (typingEl.style.display = "none"), to));
      };
      const chatSend = (
        T: ReturnType<typeof setTimeout>[],
        send: HTMLElement | null,
        intext: HTMLElement | null,
        at: number
      ) => {
        T.push(setTimeout(() => send?.classList.add("-hot"), at));
        T.push(
          setTimeout(() => {
            if (intext) intext.textContent = "";
            send?.classList.remove("-hot");
          }, at + 320)
        );
      };
      function introChat(card: HTMLElement) {
        if (!visRef.current) {
          perCard[1].push(setTimeout(() => introChat(card), 1500));
          return;
        }
        const { msgs, typingEl, intext, send } = chatEls(card);
        if (!msgs.length) return;
        // El hilo NACE lleno: pregunta + respuesta + cita confirmada ya
        // visibles; solo el cierre se anima.
        instant(msgs.slice(0, 3), { opacity: "1", transform: "translateY(0)" });
        instant(msgs.slice(3), { opacity: "0", transform: "translateY(8px)" });
        if (typingEl) typingEl.style.display = "none";
        if (intext) intext.textContent = "";
        send?.classList.remove("-hot");
        card.querySelector(".anim-ia-msgs")?.getBoundingClientRect();
        const T = perCard[1];
        let t = 250;
        if (intext) t = typeInto(T, intext, "¡Perfecto, gracias!", 250, 22);
        chatSend(T, send, intext, t + 100);
        chatShow(T, msgs[3], t + 250);
        chatTyping(T, typingEl, msgs[4], t + 700, t + 1400);
        chatShow(T, msgs[4], t + 1400);
        T.push(
          setTimeout(() => {
            chatBuilt = true;
            liveChat(card);
          }, t + 3400)
        );
      }
      function liveChat(card: HTMLElement) {
        if (!visRef.current) {
          perCard[1].push(setTimeout(() => liveChat(card), 1500));
          return;
        }
        const { msgs, typingEl, intext, send, cardMsg } = chatEls(card);
        if (!msgs.length) return;
        const script = SCRIPTS[chatFlip ? 1 : 0];
        chatFlip = !chatFlip;
        // Normalizado sin vaciar: el hilo 0-2 queda visible siempre.
        instant(msgs.slice(0, 3), { opacity: "1", transform: "translateY(0)" });
        if (typingEl) typingEl.style.display = "none";
        if (intext) intext.textContent = "";
        send?.classList.remove("-hot");
        cardMsg?.classList.remove("-pop");
        card.querySelector(".anim-ia-msgs")?.getBoundingClientRect();
        const T = perCard[1];
        // 1) Solo los 2 últimos mensajes se renuevan (fade corto).
        T.push(
          setTimeout(() => {
            msgs.slice(3).forEach((m) => {
              m.style.transition = "opacity .25s, transform .25s";
              m.style.opacity = "0";
              m.style.transform = "translateY(6px)";
            });
          }, 150)
        );
        T.push(
          setTimeout(() => {
            if (msgs[3]) msgs[3].textContent = script.ask;
            if (msgs[4]) msgs[4].textContent = script.reply;
          }, 450)
        );
        // 2) El usuario teclea la nueva petición y envía.
        let t = 500;
        if (intext) t = typeInto(T, intext, script.ask, 500, 22);
        chatSend(T, send, intext, t + 100);
        chatShow(T, msgs[3], t + 250);
        // 3) El agente "escribe", ACTUALIZA la card de la cita (pop) y
        // confirma con el último mensaje.
        chatTyping(T, typingEl, msgs[4], t + 700, t + 1450);
        T.push(
          setTimeout(() => {
            if (cardMsg) {
              const b = cardMsg.querySelector("b");
              const s = cardMsg.querySelector("span > span");
              if (b) b.textContent = "Cita actualizada";
              if (s) s.textContent = script.when;
              cardMsg.classList.add("-pop");
            }
          }, t + 1450)
        );
        chatShow(T, msgs[4], t + 1550);
        T.push(setTimeout(() => cardMsg?.classList.remove("-pop"), t + 2100));
        // 4) Lectura y siguiente ciclo.
        T.push(setTimeout(() => liveChat(card), t + 3900));
      }
      demoRestartRef.current[1] = () => {
        clearCard(1);
        if (chatBuilt) liveChat(card1);
        else introChat(card1);
      };
      perCard[1].push(setTimeout(() => introChat(card1), 300));
    }

    // ===== Pantalla 3 — canvas de automatización (V17.9): el diagrama se
    // monta UNA vez (rápido) y ya nunca se desmonta. LIVE: cada ciclo es
    // una "ejecución" — los nodos destellan en cadena (trigger → agente →
    // salidas, clase -hit), el contador acumula sin reiniciarse y el
    // "✓ sin errores" late al completarse. Los pulsos SMIL siguen
    // circulando por debajo todo el tiempo. =====
    if (cards[2]) {
      const card2 = cards[2];
      let flowBuilt = false;
      let flowRuns = 247;
      let flowHitAlt = false;
      function introFlow(card: HTMLElement) {
        if (!visRef.current) {
          perCard[2].push(setTimeout(() => introFlow(card), 1500));
          return;
        }
        const nodes = Array.from(card.querySelectorAll<HTMLElement>(".anim-fl-node"));
        const conns = Array.from(card.querySelectorAll(".anim-fl-conn")) as unknown as SVGPathElement[];
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
              n.style.transition = "opacity .35s, transform .4s cubic-bezier(.34,1.56,.64,1)";
              n.style.opacity = "1";
              n.style.transform = "translate(-50%, -50%) scale(1)";
            }, at)
          );
        const drawConn = (i: number, at: number) =>
          T.push(
            setTimeout(() => {
              const el = conns[i] as unknown as HTMLElement | undefined;
              if (!el) return;
              el.style.transition = "stroke-dashoffset .45s ease";
              el.style.strokeDashoffset = "0";
            }, at)
          );
        // Triggers → conexiones de entrada → agente → salidas, sin pausas.
        popNode(0, 150);
        popNode(1, 300);
        drawConn(0, 450);
        drawConn(1, 550);
        popNode(2, 700);
        drawConn(2, 950);
        drawConn(3, 1050);
        popNode(3, 1200);
        popNode(4, 1350);
        T.push(
          setTimeout(() => {
            flowBuilt = true;
            liveFlow(card);
          }, 1900)
        );
      }
      function liveFlow(card: HTMLElement) {
        if (!visRef.current) {
          perCard[2].push(setTimeout(() => liveFlow(card), 1500));
          return;
        }
        const nodes = Array.from(card.querySelectorAll<HTMLElement>(".anim-fl-node"));
        const conns = Array.from(card.querySelectorAll(".anim-fl-conn"));
        const countEl = card.querySelector<HTMLElement>(".anim-fl-count b");
        const okEl = card.querySelector<HTMLElement>(".anim-fl-ok");
        // Normalizado sin vaciar: todo montado y conectado siempre.
        instant(nodes, { opacity: "1", transform: "translate(-50%, -50%) scale(1)" });
        conns.forEach((c) => {
          const el = c as unknown as HTMLElement;
          el.style.transition = "none";
          el.style.strokeDashoffset = "0";
        });
        nodes.forEach((n) => n.classList.remove("-hit"));
        okEl?.classList.remove("-blink");
        card.querySelector(".anim-fl-svg")?.getBoundingClientRect();
        // Los destellos -hit transicionan brillo/borde (el transition inline
        // de instant() los dejaría en "none").
        nodes.forEach((n) => (n.style.transition = "box-shadow .3s, border-color .3s, background .3s"));
        const T = perCard[2];
        const hit = (i: number, at: number, off: number) => {
          T.push(setTimeout(() => nodes[i]?.classList.add("-hit"), at));
          T.push(setTimeout(() => nodes[i]?.classList.remove("-hit"), off));
        };
        // Una ejecución recorre el flujo: entrada (alterna Gmail/Formulario)
        // → agente → las dos salidas.
        const entrada = flowHitAlt ? 1 : 0;
        flowHitAlt = !flowHitAlt;
        hit(entrada, 200, 700);
        hit(2, 600, 1250);
        hit(3, 1150, 1700);
        hit(4, 1300, 1850);
        // El contador acumula (sin resetear entre ciclos) y el "sin
        // errores" parpadea al cerrar la ejecución.
        if (countEl) {
          T.push(
            setTimeout(() => {
              flowRuns += 1;
              countEl.textContent = String(flowRuns);
              countEl.style.transition = "none";
              countEl.style.transform = "scale(1.25)";
              T.push(
                setTimeout(() => {
                  countEl.style.transition = "transform .3s";
                  countEl.style.transform = "scale(1)";
                }, 30)
              );
            }, 1500)
          );
        }
        T.push(setTimeout(() => okEl?.classList.add("-blink"), 1700));
        T.push(setTimeout(() => okEl?.classList.remove("-blink"), 2300));
        T.push(setTimeout(() => liveFlow(card), 2700));
      }
      demoRestartRef.current[2] = () => {
        clearCard(2);
        if (flowBuilt) liveFlow(card2);
        else introFlow(card2);
      };
      perCard[2].push(setTimeout(() => introFlow(card2), 300));
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
      // V17.9: el gráfico se dibuja UNA vez y queda; el ciclo vivo es el
      // cursor barriendo la curva ida y vuelta mientras las métricas
      // ACUMULAN (nunca recuentan desde 0 — un recuento lee como reset).
      let seoBuilt = false;
      let seoClics = 3482;
      let seoImpr = 86400;
      let seoCtrAlt = false;
      const seoSweep = (T: ReturnType<typeof setTimeout>[], card: HTMLElement, start: number, back: boolean) => {
        const run = card.querySelector<HTMLElement>(".anim-sc-run");
        const tipB = card.querySelector<HTMLElement>(".anim-sc-tip b");
        const stepMs = 200;
        for (let k = 0; k < PTS.length; k++) {
          T.push(
            setTimeout(() => {
              if (!run) return;
              const [x, y] = PTS[back ? PTS.length - 1 - k : k];
              // Clamp 7.5%–92.5% (V16.37): en x=0 el tooltip (centrado
              // con translateX(-50%)) se cortaba por el borde izquierdo.
              const fx = Math.max(0.075, Math.min(0.925, x / 260));
              run.style.left = `${fx * 100}%`;
              run.style.setProperty("--dy", `${(y / 90) * 100}%`);
              if (tipB) tipB.textContent = Math.round((84 - y) * 21).toLocaleString("es-ES");
            }, start + k * stepMs)
          );
        }
        return start + PTS.length * stepMs;
      };
      function introSeo(card: HTMLElement) {
        if (!visRef.current) {
          perCard[3].push(setTimeout(() => introSeo(card), 1500));
          return;
        }
        const lines = Array.from(card.querySelectorAll(".anim-sc-line")) as unknown as SVGPathElement[];
        const areas = Array.from(card.querySelectorAll<HTMLElement>(".anim-sc-area"));
        const chips = Array.from(card.querySelectorAll<HTMLElement>(".anim-sc-chip-val"));
        const goal = card.querySelector<HTMLElement>(".anim-sc-goal");
        const badge = card.querySelector<HTMLElement>(".anim-sc-badge");
        const run = card.querySelector<HTMLElement>(".anim-sc-run");
        lines.forEach((l) => {
          const el = l as unknown as HTMLElement;
          el.style.transition = "none";
          const len = l.getTotalLength();
          el.style.strokeDasharray = String(len);
          el.style.strokeDashoffset = String(len);
        });
        instant(areas, { opacity: "0" });
        if (goal) instant([goal], { opacity: "0" });
        if (badge) instant([badge], { opacity: "0", transform: "translateY(-4px)" });
        if (run) {
          run.style.transition = "none";
          run.style.opacity = "0";
          run.style.left = "7.5%";
        }
        chips.forEach((c) => (c.textContent = fmtNum(0, c.dataset.fmt ?? null)));
        card.querySelector(".anim-sc-chart")?.getBoundingClientRect();
        const T = perCard[3];
        // Curvas, áreas, objetivo y badge en poco más de un segundo.
        lines.forEach((l, i) =>
          T.push(
            setTimeout(() => {
              const el = l as unknown as HTMLElement;
              el.style.transition = "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)";
              el.style.strokeDashoffset = "0";
            }, 100 + i * 160)
          )
        );
        T.push(
          setTimeout(() => {
            areas.forEach((a) => {
              a.style.transition = "opacity .5s";
              a.style.opacity = "1";
            });
            if (goal) {
              goal.style.transition = "opacity .5s";
              goal.style.opacity = "1";
            }
          }, 650)
        );
        T.push(
          setTimeout(() => {
            if (badge) {
              badge.style.transition = "opacity .4s, transform .4s";
              badge.style.opacity = "1";
              badge.style.transform = "translateY(0)";
            }
          }, 950)
        );
        chips.forEach((c, i) => countTo(T, c, Number(c.dataset.t ?? 0), 250 + i * 120, 900, c.dataset.fmt ?? null));
        T.push(
          setTimeout(() => {
            if (run) {
              run.style.transition = "opacity .3s, left .2s linear";
              run.style.opacity = "1";
            }
          }, 1200)
        );
        T.push(
          setTimeout(() => {
            seoBuilt = true;
            liveSeo(card);
          }, 1500)
        );
      }
      function liveSeo(card: HTMLElement) {
        if (!visRef.current) {
          perCard[3].push(setTimeout(() => liveSeo(card), 1500));
          return;
        }
        const chips = Array.from(card.querySelectorAll<HTMLElement>(".anim-sc-chip-val"));
        const run = card.querySelector<HTMLElement>(".anim-sc-run");
        // Normalizado sin vaciar: gráfico completo y cursor visible.
        if (run) {
          run.style.transition = "opacity .3s, left .2s linear";
          run.style.opacity = "1";
        }
        const T = perCard[3];
        // 1) Barrido de ida; al llegar, las métricas SUBEN un tick con pop.
        const endFwd = seoSweep(T, card, 200, false);
        T.push(
          setTimeout(() => {
            seoClics += 9;
            seoImpr += 180;
            seoCtrAlt = !seoCtrAlt;
            const vals = [
              fmtNum(seoClics, "int"),
              fmtNum(seoImpr, "k"),
              (seoCtrAlt ? "4,1" : "4,0") + "%",
            ];
            chips.forEach((c, i) => {
              c.textContent = vals[i] ?? c.textContent;
              c.style.transition = "none";
              c.style.transform = "scale(1.18)";
              T.push(
                setTimeout(() => {
                  c.style.transition = "transform .3s";
                  c.style.transform = "scale(1)";
                }, 30)
              );
            });
          }, endFwd + 150)
        );
        // 2) Barrido de vuelta y siguiente ciclo.
        const endBack = seoSweep(T, card, endFwd + 500, true);
        T.push(setTimeout(() => liveSeo(card), endBack + 400));
      }
      demoRestartRef.current[3] = () => {
        clearCard(3);
        if (seoBuilt) liveSeo(card3);
        else introSeo(card3);
      };
      perCard[3].push(setTimeout(() => introSeo(card3), 300));
    }

    // ===== Pantalla 5 — app en marcha (V17.9): el dashboard se monta UNA
    // vez y ya nunca se vacía. LIVE: entran pedidos/reseñas/usuarios
    // rotando en las notificaciones, las ventas ACUMULAN con cada pedido,
    // y las barras del gráfico se reacomodan como datos frescos. =====
    if (cards[4]) {
      const card4 = cards[4];
      const RING_LEN = 2 * Math.PI * 26;
      let appBuilt = false;
      let appVentas = 2840;
      let appTick = 0;
      // [título, detalle, € que suma a ventas]. Orden a propósito: los
      // índices PARES caen en el slot del icono check (pedidos/altas) y los
      // IMPARES en el de la estrella (reseñas) — cada tipo con su icono.
      const APP_FEED: Array<[string, string, number]> = [
        ["Pedido #1043", "Pagado · 79 €", 79],
        ["Nueva reseña", "★★★★★ · «Rapidísimos»", 0],
        ["Nuevo usuario", "maría@… se ha registrado", 0],
        ["Nueva reseña", "★★★★★ · «Vuelvo seguro»", 0],
        ["Pedido #1044", "Pagado · 129 €", 129],
        ["Nueva reseña", "★★★★★ · «Impecable»", 0],
      ];
      // Alturas de barras por ciclo: "datos frescos" reacomodándose.
      const APP_BARS: string[][] = [
        ["38%", "62%", "48%", "78%", "96%"],
        ["46%", "54%", "66%", "72%", "88%"],
        ["34%", "68%", "52%", "84%", "92%"],
      ];
      function introApp(card: HTMLElement) {
        if (!visRef.current) {
          perCard[4].push(setTimeout(() => introApp(card), 1500));
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
              b.style.transition = "transform .45s cubic-bezier(.22,1,.36,1)";
              b.style.transform = "scaleY(1)";
            }, 150 + i * 90)
          )
        );
        if (count) countTo(T, count, appVentas, 250, 900, "int");
        notifs.forEach((n, i) =>
          T.push(
            setTimeout(() => {
              n.style.transition = "opacity .4s, transform .45s cubic-bezier(.34,1.56,.64,1)";
              n.style.opacity = "1";
              n.style.transform = "translateX(0)";
            }, 700 + i * 350)
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
              el.style.transition = "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)";
              el.style.strokeDashoffset = String(RING_LEN * 0.001);
            }
          }, 1400)
        );
        T.push(
          setTimeout(() => {
            appBuilt = true;
            liveApp(card);
          }, 2600)
        );
      }
      function liveApp(card: HTMLElement) {
        if (!visRef.current) {
          perCard[4].push(setTimeout(() => liveApp(card), 1500));
          return;
        }
        const bars = Array.from(card.querySelectorAll<HTMLElement>(".anim-ap-bars i"));
        const count = card.querySelector<HTMLElement>(".anim-ap-count");
        const notifs = Array.from(card.querySelectorAll<HTMLElement>(".anim-ap-notif"));
        // Normalizado sin vaciar: dashboard completo siempre.
        instant(bars, { transform: "scaleY(1)" });
        instant(notifs, { opacity: "1", transform: "translateX(0)" });
        const T = perCard[4];
        // 1) Entra una notificación nueva en el hueco más antiguo (se
        // renueva UNA de las dos: la otra sigue visible — nunca hay hueco).
        const feed = APP_FEED[appTick % APP_FEED.length];
        const slot = notifs[appTick % notifs.length];
        appTick += 1;
        if (slot) {
          T.push(
            setTimeout(() => {
              slot.style.transition = "opacity .25s, transform .25s";
              slot.style.opacity = "0";
              slot.style.transform = "translateX(24px)";
            }, 300)
          );
          T.push(
            setTimeout(() => {
              const b = slot.querySelector("b");
              const s = slot.querySelector("span > span");
              if (b) b.textContent = feed[0];
              if (s) s.textContent = feed[1];
              slot.style.transition = "opacity .4s, transform .45s cubic-bezier(.34,1.56,.64,1)";
              slot.style.opacity = "1";
              slot.style.transform = "translateX(0)";
            }, 650)
          );
        }
        // 2) Si es un pedido, las ventas ACUMULAN con pop (sin recontar).
        if (count && feed[2] > 0) {
          T.push(
            setTimeout(() => {
              appVentas += feed[2];
              count.textContent = fmtNum(appVentas, "int");
              count.style.transition = "none";
              count.style.transform = "scale(1.15)";
              T.push(
                setTimeout(() => {
                  count.style.transition = "transform .3s";
                  count.style.transform = "scale(1)";
                }, 30)
              );
            }, 1150)
          );
        }
        // 3) Las barras se reacomodan a los datos del ciclo (transición de
        // height en CSS, V17.9).
        T.push(
          setTimeout(() => {
            const hs = APP_BARS[appTick % APP_BARS.length];
            bars.forEach((b, i) => {
              b.style.transition = "height .5s ease";
              b.style.setProperty("--h", hs[i] ?? "50%");
            });
          }, 1600)
        );
        T.push(setTimeout(() => liveApp(card), 3200));
      }
      demoRestartRef.current[4] = () => {
        clearCard(4);
        if (appBuilt) liveApp(card4);
        else introApp(card4);
      };
      perCard[4].push(setTimeout(() => introApp(card4), 300));
    }

    return () => {
      io.disconnect();
      perCard.forEach((_, i) => clearCard(i));
      demoRestartRef.current = [];
      // Al desmontar (nav a otra ruta), el muro global recupera su clip.
      setWallVideo(null);
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
