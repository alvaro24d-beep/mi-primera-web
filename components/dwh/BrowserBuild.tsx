"use client";

// The star of the hero: a browser window that builds a real website inside
// itself as you scroll, in 4 stages matched to the facets (see the GSAP
// timeline in DesarrolloWebHero.tsx). Kept as crisp DOM (not WebGL geometry)
// on purpose — legibility is the whole point, mirroring the home page's
// Web3DAnim visual language (traffic-light dots, URL bar, content lines,
// card grid, code chip, "98" performance, cursor). Markup is authored in its
// FINISHED/built state so the prefers-reduced-motion path (no GSAP) shows a
// complete site; GSAP resets it to an empty wireframe at timeline start.

const PERF_C = 2 * Math.PI * 26; // circumference of the performance ring

export default function BrowserBuild() {
  return (
    <div className="nxr-bw-scene" aria-hidden="true">
      <div className="nxr-bw-tilt">
        <div className="nxr-bw-float">
          {/* ---- Desktop browser ---- */}
          <div className="nxr-bw-browser">
            <div className="nxr-bw-bar">
              <span className="nxr-bw-dot" style={{ background: "var(--c-red)" }} />
              <span className="nxr-bw-dot" style={{ background: "var(--c-lime)" }} />
              <span className="nxr-bw-dot" style={{ background: "var(--c-salmon)" }} />
              <div className="nxr-bw-url">
                <span className="nxr-bw-url-text">nexora.com</span>
              </div>
            </div>

            <div className="nxr-bw-body">
              {/* hero block: wireframe -> gradient image + perf ring */}
              <div className="nxr-bw-hero nxr-bw-wire">
                <div className="nxr-bw-fill nxr-bw-hero-fill" />
                <div className="nxr-bw-perf">
                  <svg viewBox="0 0 64 64">
                    <circle className="nxr-bw-perf-track" cx="32" cy="32" r="26" />
                    <circle
                      className="nxr-bw-perf-ring"
                      cx="32"
                      cy="32"
                      r="26"
                      style={{ strokeDasharray: PERF_C, strokeDashoffset: PERF_C * 0.02 }}
                    />
                  </svg>
                  <span className="nxr-bw-perf-num">98</span>
                </div>
              </div>

              {/* content lines */}
              <div className="nxr-bw-line nxr-bw-wire w70">
                <div className="nxr-bw-fill nxr-bw-line-accent" />
              </div>
              <div className="nxr-bw-line nxr-bw-wire w50" />

              {/* card grid */}
              <div className="nxr-bw-cards">
                <div className="nxr-bw-card nxr-bw-wire">
                  <div className="nxr-bw-fill" style={{ background: "rgba(239,61,13,.35)" }} />
                </div>
                <div className="nxr-bw-card nxr-bw-wire">
                  <div className="nxr-bw-fill" style={{ background: "rgba(168,240,74,.35)" }} />
                </div>
                <div className="nxr-bw-card nxr-bw-wire">
                  <div className="nxr-bw-fill" style={{ background: "rgba(255,157,125,.35)" }} />
                </div>
              </div>

              {/* stage 3: data layer */}
              <div className="nxr-bw-data">
                <div className="nxr-bw-db">
                  <svg viewBox="0 0 24 24">
                    <ellipse cx="12" cy="5" rx="8" ry="3" />
                    <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
                    <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
                  </svg>
                </div>
                <svg className="nxr-bw-wires" viewBox="0 0 120 60" preserveAspectRatio="none">
                  <path d="M6 30 H60" />
                  <path d="M60 30 V12 H114" />
                  <path d="M60 30 V48 H114" />
                </svg>
                <div className="nxr-bw-stat">
                  <span className="nxr-bw-stat-num">2.840</span>
                  <span className="nxr-bw-stat-label">usuarios activos</span>
                </div>
              </div>
            </div>
          </div>

          {/* ---- Docked phone (responsive, stage 4) ---- */}
          <div className="nxr-bw-phone">
            <div className="nxr-bw-phone-notch" />
            <div className="nxr-bw-phone-body">
              <div className="nxr-bw-phone-hero" />
              <div className="nxr-bw-phone-line w80" />
              <div className="nxr-bw-phone-line w60" />
              <div className="nxr-bw-phone-card" />
            </div>
          </div>

          {/* floating chips + cursor */}
          <div className="nxr-bw-chip nxr-bw-chip-code">&lt;/&gt;</div>
          <div className="nxr-bw-chip nxr-bw-chip-perf">
            <svg viewBox="0 0 24 24">
              <path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z" />
            </svg>
            98
          </div>
          <div className="nxr-bw-cursor">
            <svg viewBox="0 0 24 24">
              <path d="M4,2 L4,20 L9,15.5 L12,22 L15,20.5 L12,14 L18,14 Z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
