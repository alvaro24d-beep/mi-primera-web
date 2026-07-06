"use client";

import { useEffect, useRef } from "react";

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

export default function Servicios() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>(".nxr-srv-card"));

    let srvObserver: IntersectionObserver | undefined;
    if (window.innerWidth > 900) {
      srvObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("nxr-srv-visible");
              srvObserver!.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
      );
      cards.forEach((card) => srvObserver!.observe(card));
    }

    const onMouseMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    cards.forEach((card) => card.addEventListener("mousemove", onMouseMove));

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

    const card3 = cards[2];
    let onEnter3: (() => void) | undefined;
    let onLeave3: (() => void) | undefined;
    if (card3) {
      const activateFlow = (card: HTMLElement) => {
        const nodesL = Array.from(card.querySelectorAll<HTMLElement>(".anim-flow-node-l"));
        const connsL = Array.from(card.querySelectorAll<HTMLElement>(".anim-flow-conn-l"));
        const nodeC = card.querySelector<HTMLElement>(".anim-flow-node-c");
        const connsR = Array.from(card.querySelectorAll<HTMLElement>(".anim-flow-conn-r"));
        const nodesR = Array.from(card.querySelectorAll<HTMLElement>(".anim-flow-node-r"));
        nodesL.forEach((n) => n.classList.add("vis"));
        timers.push(
          setTimeout(() => {
            connsL.forEach((c) => c.classList.add("vis"));
            timers.push(
              setTimeout(() => {
                if (nodeC) nodeC.classList.add("vis");
                timers.push(
                  setTimeout(() => {
                    connsR.forEach((c) => c.classList.add("vis"));
                    timers.push(setTimeout(() => nodesR.forEach((n) => n.classList.add("vis")), 500));
                  }, 400)
                );
              }, 600)
            );
          }, 400)
        );
      };
      const deactivateFlow = (card: HTMLElement) => {
        card
          .querySelectorAll(".anim-flow-node-l,.anim-flow-conn-l,.anim-flow-node-c,.anim-flow-conn-r,.anim-flow-node-r")
          .forEach((el) => el.classList.remove("vis"));
      };
      if (window.innerWidth > 900) {
        onEnter3 = () => activateFlow(card3);
        onLeave3 = () => deactivateFlow(card3);
        card3.addEventListener("mouseenter", onEnter3);
        card3.addEventListener("mouseleave", onLeave3);
      }
    }

    const card5 = cards[4];
    let counted5 = false;
    let onEnter5: (() => void) | undefined;
    let onLeave5: (() => void) | undefined;
    if (card5) {
      const statEl = card5.querySelector(".anim-app-stat-val");
      onEnter5 = () => {
        if (!counted5 && statEl) {
          counted5 = true;
          animCount(statEl, 2840);
        }
      };
      onLeave5 = () => {
        counted5 = false;
        if (statEl) statEl.textContent = "0";
      };
      card5.addEventListener("mouseenter", onEnter5);
      card5.addEventListener("mouseleave", onLeave5);
    }

    if (window.innerWidth <= 900) {
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
      srvObserver?.disconnect();
      cards.forEach((card) => card.removeEventListener("mousemove", onMouseMove));
      if (card3 && onEnter3 && onLeave3) {
        card3.removeEventListener("mouseenter", onEnter3);
        card3.removeEventListener("mouseleave", onLeave3);
      }
      if (card5 && onEnter5 && onLeave5) {
        card5.removeEventListener("mouseenter", onEnter5);
        card5.removeEventListener("mouseleave", onLeave5);
      }
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <section id="nxr-servicios">
      <div className="nxr-servicios-inner">
        <div className="nxr-reveal">
          <p className="nxr-section-label">Servicios</p>
          <h2 className="nxr-section-h2">
            Todo lo que tu negocio necesita para{" "}
            <span className="nxr-gradient-text-salmon">crecer en la era de la IA.</span>
          </h2>
        </div>

        <div className="nxr-servicios-grid" ref={gridRef}>
          {CARDS.map((c, i) => (
            <div
              key={c.href}
              className="nxr-srv-card nxr-glass-edge nxr-reveal"
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="nxr-srv-content">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div className="nxr-srv-icon">{c.icon}</div>
                  <span className="nxr-srv-tag">{c.tag}</span>
                </div>
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
              <div className="nxr-srv-anim">{c.anim}</div>
              <div className="nxr-srv-cta-wrap">
                <a href={c.href} className="nxr-srv-cta nxr-glass-edge">
                  <span className="nxr-glass-edge-content">{c.cta}</span>
                  <svg className="nxr-glass-edge-content" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
