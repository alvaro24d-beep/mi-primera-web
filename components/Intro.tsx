"use client";

import { useTitleReveal } from "@/hooks/useTitleReveal";

// Compact looping graphic per card, each representing its service (same idea
// as the home Servicios animations): a website building for "Construimos", an
// automation flow with a travelling pulse for "Automatizamos", growth bars for
// "Hacemos crecer". Pure CSS keyframes (see globals.css) so they keep looping.
function WebAnim() {
  return (
    <div className="nxr-intro-anim nxr-ianim-web" aria-hidden="true">
      <div className="nxr-ianim-web-bar">
        <i />
        <i />
        <i />
      </div>
      <div className="nxr-ianim-web-body">
        <span className="nxr-ianim-web-line" />
        <span className="nxr-ianim-web-line" />
        <span className="nxr-ianim-web-line" />
      </div>
    </div>
  );
}

function AutoAnim() {
  return (
    <div className="nxr-intro-anim nxr-ianim-auto" aria-hidden="true">
      <span className="nxr-ianim-auto-track" />
      <span className="nxr-ianim-auto-node n1" />
      <span className="nxr-ianim-auto-node n2" />
      <span className="nxr-ianim-auto-node n3" />
      <span className="nxr-ianim-auto-pulse" />
    </div>
  );
}

function GrowAnim() {
  return (
    <div className="nxr-intro-anim nxr-ianim-grow" aria-hidden="true">
      <span className="nxr-ianim-grow-bar" />
      <span className="nxr-ianim-grow-bar" />
      <span className="nxr-ianim-grow-bar" />
      <span className="nxr-ianim-grow-bar" />
      <svg className="nxr-ianim-grow-arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18L14 8M14 8H7M14 8v7" />
      </svg>
    </div>
  );
}

export default function Intro() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();

  return (
    <section id="nxr-intro">
      <div className="nxr-intro-inner">
        <div className="nxr-intro-left nxr-reveal">
          <h2 className="nxr-intro-headline" ref={titleRef}>
            Hacemos que
            <br />
            la tecnología
            <br />
            <span className="nxr-gradient-text-lime">trabaje por ti.</span>
          </h2>

          <div className="nxr-intro-texts">
            <p className="nxr-intro-text">
              Somos una agencia de <strong>software e inteligencia artificial</strong> especializada en construir
              sistemas digitales que automatizan tareas, captan clientes y hacen crecer negocios — sin que tengas que
              entender de tecnología.
            </p>
            <p className="nxr-intro-text">
              Trabajamos con <strong>empresas de cualquier sector</strong> que saben que pueden ir más rápido pero no
              tienen el equipo técnico para hacerlo. Nosotros somos ese equipo.
            </p>
          </div>
        </div>

        <div className="nxr-intro-cards">
          <div className="nxr-intro-card nxr-reveal" id="nxr-intro-card-1">
            <WebAnim />
            <div className="nxr-intro-card-text">
              <span className="nxr-intro-col-num">01 — Construimos</span>
              <div className="nxr-intro-col-title">Tu presencia digital, hecha para vender.</div>
              <p className="nxr-intro-col-desc">
                Webs, aplicaciones y plataformas diseñadas desde cero para que tus clientes lleguen, entiendan lo que
                ofreces y contacten contigo.
              </p>
            </div>
          </div>

          <div className="nxr-intro-card nxr-reveal" id="nxr-intro-card-2">
            <AutoAnim />
            <div className="nxr-intro-card-text">
              <span className="nxr-intro-col-num">02 — Automatizamos</span>
              <div className="nxr-intro-col-title">Tu negocio funcionando solo, 24/7.</div>
              <p className="nxr-intro-col-desc">
                Conectamos tus herramientas y creamos agentes de IA que eliminan el trabajo manual para que tu equipo se
                enfoque en lo importante.
              </p>
            </div>
          </div>

          <div className="nxr-intro-card nxr-reveal" id="nxr-intro-card-3">
            <GrowAnim />
            <div className="nxr-intro-card-text">
              <span className="nxr-intro-col-num">03 — Hacemos crecer</span>
              <div className="nxr-intro-col-title">Más clientes encontrándote cada día.</div>
              <p className="nxr-intro-col-desc">
                Posicionamos tu negocio en Google para que los clientes te encuentren a ti, no a tu competencia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
