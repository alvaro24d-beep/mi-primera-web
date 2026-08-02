"use client";

// El centro del hero de /desarrollo-web: el iPhone del CinematicHero portado
// (V16.76) en el sitio que ocupaba el MacBook — SOLO el dispositivo, sin la
// card profunda, retícula, panel de código ni textos de la sección original
// (retirada en V16.77 a petición: "solo el iphone, sin fondos ni más
// textos"). En su pantalla se construye una web moderna (nav → hero → cards
// → stats → footer) al ritmo del pin del hero; la entrada 3D del teléfono y
// los reveals los conduce el timeline de DesarrolloWebHero.tsx.
//
// Reparto de wrappers (mismo patrón que tenía el Mac):
//   .nxr-ip-scene  posicionamiento en el stage + perspective (guard CSS de
//                  visibilidad pre-GSAP)
//   .nxr-ip-tilt   tilt de ratón (quickTo en el hero)
//   .nxr-ip-float  respiración idle (tween yPercent infinito)
//   .nxr-ip-rig    entrada 3D + deriva del scrub (objetivo de GSAP)
//   .nxr-ip-sizer  escala CSS estática por breakpoint — separada del rig
//                  para que GSAP no pise la media query
//
// Markup en estado TERMINADO: la rama prefers-reduced-motion del hero no
// ejecuta GSAP y esta pieza ni se monta (esa rama muestra su grid estático).

export default function IphoneMock() {
  return (
    <div className="nxr-ip-scene" aria-hidden="true">
      <div className="nxr-ip-tilt">
        <div className="nxr-ip-float">
          <div className="nxr-ip-rig">
            <div className="nxr-ip-sizer">
              <div className="nxr-ip-bezel">
                <div className="nxr-ip-hwbtn b1" />
                <div className="nxr-ip-hwbtn b2" />
                <div className="nxr-ip-hwbtn b3" />
                <div className="nxr-ip-hwbtn br" />
                <div className="nxr-ip-screen">
                  <div className="nxr-ip-glare" />
                  <div className="nxr-ip-island">
                    <span className="nxr-ip-island-led" />
                  </div>
                  {/* La web moderna que se va construyendo */}
                  <div className="nxr-ip-web">
                    <div className="nxr-ip-w-nav">
                      <span className="nxr-ip-w-logo">
                        <span className="nxr-ip-w-logodot" />
                        TuMarca
                      </span>
                      <span className="nxr-ip-w-burger">
                        <i />
                        <i />
                      </span>
                    </div>
                    <div className="nxr-ip-w-hero">
                      <h4>Reserva tu mesa en 10 segundos</h4>
                      <p>Cocina de mercado en el centro de Madrid.</p>
                      <span className="nxr-ip-w-cta">Ver la carta</span>
                    </div>
                    <div className="nxr-ip-w-cards">
                      <div className="nxr-ip-w-card">
                        <span className="nxr-ip-w-cardico lime">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="4" width="18" height="17" rx="3" />
                            <path d="M3 9h18M8 2v4M16 2v4" />
                          </svg>
                        </span>
                        <div className="nxr-ip-w-cardtxt">
                          <b>Reservas online</b>
                          <i />
                        </div>
                      </div>
                      <div className="nxr-ip-w-card">
                        <span className="nxr-ip-w-cardico salmon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M8 12l3 3 5-6" />
                          </svg>
                        </span>
                        <div className="nxr-ip-w-cardtxt">
                          <b>Pedidos a domicilio</b>
                          <i />
                        </div>
                      </div>
                    </div>
                    <div className="nxr-ip-w-stats">
                      <div>
                        <b>+120%</b>
                        <span>reservas</span>
                      </div>
                      <div>
                        <b>4.9★</b>
                        <span>reseñas</span>
                      </div>
                      <div>
                        <b>24/7</b>
                        <span>abierta</span>
                      </div>
                    </div>
                    <div className="nxr-ip-w-footer">© TuMarca — hecha por Nexora</div>
                    <div className="nxr-ip-homebar" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
