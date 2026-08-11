"use client";

// El centro del hero de /desarrollo-web: el iPhone del CinematicHero portado
// (V16.76/77) — SOLO el dispositivo, sin card/retícula/textos de la sección
// original. V16.83 ("más elaborada, que se vea que se crea una WEB, no una
// app"): la pantalla muestra ahora Safari móvil — barra de URL con candado
// arriba (la señal inequívoca de "web") — y una página larga con FONDO DE
// PANTALLA propio (aurora de marca + rejilla, en .nxr-ip-wbg) tras el
// contenido. La página es más alta que el viewport del móvil y el timeline
// del hero la SCROLLEA por tramos mientras construye cada sección (nav →
// hero → cards → galería → stats → testimonio → footer de web con columnas
// de enlaces), con el fondo parallaxeando a ~1/3 de la velocidad del
// contenido. El indicador de "haz scroll" del hero vive en
// DesarrolloWebHero.tsx (.nxr-dwh-scrollcue), no aquí.
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
                  {/* Safari móvil: la barra de URL es lo que hace leer WEB */}
                  <div className="nxr-ip-sfr">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                    <span>tunegocio.es</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 12a9 9 0 1 1-3-6.7" />
                      <path d="M21 3v5h-5" />
                    </svg>
                  </div>
                  {/* Viewport de la web: fondo de pantalla + página scrolleable */}
                  <div className="nxr-ip-web">
                    <div className="nxr-ip-wbg">
                      <i className="nxr-ip-wbg-blob -a" />
                      <i className="nxr-ip-wbg-blob -b" />
                      <i className="nxr-ip-wbg-blob -c" />
                      <i className="nxr-ip-wbg-grid" />
                    </div>
                    <div className="nxr-ip-wflow">
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
                      {/* Galería: banda de thumbs con tinte de marca */}
                      <div className="nxr-ip-w-band">
                        <i className="-a" />
                        <i className="-b" />
                        <i className="-c" />
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
                      {/* Testimonio */}
                      <div className="nxr-ip-w-quote">
                        <i className="nxr-ip-w-ava" />
                        <span className="nxr-ip-w-qcol">
                          <i className="-q1" />
                          <i className="-q2" />
                        </span>
                      </div>
                      {/* Footer DE WEB: columnas de enlaces + copyright */}
                      <div className="nxr-ip-w-footer">
                        <div className="nxr-ip-w-fcols">
                          <span className="nxr-ip-w-fcol">
                            <i className="-h" />
                            <i />
                            <i />
                          </span>
                          <span className="nxr-ip-w-fcol">
                            <i className="-h" />
                            <i />
                            <i />
                          </span>
                        </div>
                        <span className="nxr-ip-w-copy">© TuMarca — hecha por arcfine</span>
                      </div>
                    </div>
                  </div>
                  <div className="nxr-ip-homebar" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
