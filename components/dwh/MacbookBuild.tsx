"use client";

// El centro del hero de /desarrollo-web: un MacBook (pantalla con notch +
// base) con una ventana de Safari en la que una landing moderna y detallada
// se construye de ARRIBA HACIA ABAJO conforme se scrollea — la página
// interior va auto-scrolleando para que la construcción ocurra siempre a la
// vista, y la barra de carga del campo de URL es el progreso del build.
// DOM nítido a propósito (legibilidad); el 3D lo ponen la perspective fuerte
// de la escena y el timeline de DesarrolloWebHero.tsx (entrada tumbada +
// enderezado continuo + deriva de escala). Markup en estado TERMINADO: la
// rama prefers-reduced-motion no ejecuta GSAP y muestra el sitio completo.
//
// `.nxr-mb-el` = pieza construible (GSAP la oculta y la deja caer desde
// arriba en su franja); los grupos se revelan por orden vertical real.

const PLOGOS = [46, 58, 40, 64, 50];

export default function MacbookBuild() {
  return (
    <div className="nxr-mb-scene" aria-hidden="true">
      <div className="nxr-mb-tilt">
        <div className="nxr-mb-float">
          <div className="nxr-mb-laptop">
            <div className="nxr-mb-lid">
              <div className="nxr-mb-screen">
                <div className="nxr-mb-notch" />
                <div className="nxr-mb-safari">
                  <div className="nxr-mb-chrome">
                    <span className="nxr-mb-dot" style={{ background: "#ff5f57" }} />
                    <span className="nxr-mb-dot" style={{ background: "#febc2e" }} />
                    <span className="nxr-mb-dot" style={{ background: "#28c840" }} />
                    <svg className="nxr-mb-navarrow" viewBox="0 0 24 24">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <svg className="nxr-mb-navarrow dim" viewBox="0 0 24 24">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                    <div className="nxr-mb-url">
                      <svg viewBox="0 0 24 24">
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 018 0v3" />
                      </svg>
                      <span className="nxr-mb-url-text">nexora.com</span>
                      <span className="nxr-mb-url-load" />
                    </div>
                    <svg className="nxr-mb-navarrow" viewBox="0 0 24 24">
                      <path d="M12 3v12M8 7l4-4 4 4M5 13v6h14v-6" />
                    </svg>
                  </div>

                  <div className="nxr-mb-viewport">
                    <div className="nxr-mb-page">
                      {/* nav */}
                      <div className="nxr-mb-pnav nxr-mb-el">
                        <span className="nxr-mb-plogo" />
                        <span className="nxr-mb-pnav-item" />
                        <span className="nxr-mb-pnav-item" />
                        <span className="nxr-mb-pnav-item" />
                        <span className="nxr-mb-pnav-btn" />
                      </div>

                      {/* hero */}
                      <div className="nxr-mb-phero">
                        <div className="nxr-mb-blob nxr-mb-el" />
                        <div className="nxr-mb-phero-copy">
                          <span className="nxr-mb-hline nxr-mb-el" />
                          <span className="nxr-mb-hline sm nxr-mb-el" />
                          <span className="nxr-mb-sub nxr-mb-el" />
                          <div className="nxr-mb-ctas">
                            <span className="nxr-mb-cta nxr-mb-el" />
                            <span className="nxr-mb-cta ghost nxr-mb-el" />
                          </div>
                        </div>
                        <div className="nxr-mb-shot nxr-mb-el">
                          <span className="nxr-mb-shot-bar" />
                          <span className="nxr-mb-shot-line w70" />
                          <span className="nxr-mb-shot-line w50" />
                          <span className="nxr-mb-shot-chart" />
                        </div>
                      </div>

                      {/* logos */}
                      <div className="nxr-mb-plogos">
                        {PLOGOS.map((w, i) => (
                          <span key={i} className="nxr-mb-plogo-pill nxr-mb-el" style={{ width: w }} />
                        ))}
                      </div>

                      {/* features */}
                      <div className="nxr-mb-pfeats">
                        {["rgba(239,61,13,.8)", "rgba(168,240,74,.8)", "rgba(255,157,125,.8)"].map((c, i) => (
                          <div key={i} className="nxr-mb-pfeat nxr-mb-el">
                            <span className="nxr-mb-pfeat-ico" style={{ background: c }} />
                            <span className="nxr-mb-pline w80" />
                            <span className="nxr-mb-pline w95" />
                            <span className="nxr-mb-pline w60" />
                          </div>
                        ))}
                      </div>

                      {/* banda de media */}
                      <div className="nxr-mb-pmedia nxr-mb-el">
                        <span className="nxr-mb-play" />
                      </div>

                      {/* stats */}
                      <div className="nxr-mb-pstats">
                        <div className="nxr-mb-pstat nxr-mb-el">
                          <span className="nxr-mb-stat-num nxr-mb-stat-users">2.840</span>
                          <span className="nxr-mb-pstat-label" />
                        </div>
                        <div className="nxr-mb-pstat nxr-mb-el">
                          <span className="nxr-mb-stat-num" style={{ color: "var(--c-lime)" }}>
                            98
                          </span>
                          <span className="nxr-mb-pstat-label" />
                        </div>
                        <div className="nxr-mb-pstat nxr-mb-el">
                          <span className="nxr-mb-stat-num" style={{ color: "var(--c-salmon)" }}>
                            24/7
                          </span>
                          <span className="nxr-mb-pstat-label" />
                        </div>
                      </div>

                      {/* testimonio */}
                      <div className="nxr-mb-pquote nxr-mb-el">
                        <span className="nxr-mb-avatar" />
                        <div className="nxr-mb-pquote-lines">
                          <span className="nxr-mb-pline w95" />
                          <span className="nxr-mb-pline w80" />
                          <span className="nxr-mb-pline w40 accent" />
                        </div>
                      </div>

                      {/* footer */}
                      <div className="nxr-mb-pfoot nxr-mb-el">
                        <div className="nxr-mb-pfoot-cols">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="nxr-mb-pfoot-col">
                              <span className="nxr-mb-pline w60" />
                              <span className="nxr-mb-pline w80" />
                              <span className="nxr-mb-pline w50" />
                              <span className="nxr-mb-pline w70" />
                            </div>
                          ))}
                        </div>
                        <span className="nxr-mb-pfoot-bar" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* publicado */}
                <div className="nxr-mb-live">
                  <span className="nxr-mb-live-dot" />
                  EN VIVO
                </div>
              </div>
            </div>
            <div className="nxr-mb-base">
              <span className="nxr-mb-basecut" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
