"use client";

// The star of the hero: a browser window that builds a real website inside
// itself as you scroll. Crisp DOM (not WebGL) on purpose — legibility is the
// point. There is deliberately a LOT going on so the progress reads clearly:
// a live build progress bar + status text in the footer, a nav bar, a hero
// with headline + CTA, a card grid, a data panel with a live chart, a
// performance score, a docked responsive phone, floating code/score chips and
// an "EN VIVO" badge at the end. Markup is authored in its FINISHED state so
// the prefers-reduced-motion path (no GSAP) shows a complete site; the GSAP
// timeline in DesarrolloWebHero.tsx resets it to an empty wireframe and builds
// it up stage by stage.

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
                <svg className="nxr-bw-url-lock" viewBox="0 0 24 24">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 018 0v3" />
                </svg>
                <span className="nxr-bw-url-text">nexora.com</span>
              </div>
            </div>

            <div className="nxr-bw-body">
              {/* nav bar */}
              <div className="nxr-bw-nav">
                <span className="nxr-bw-nav-logo nxr-bw-wire" />
                <span className="nxr-bw-nav-item nxr-bw-wire" />
                <span className="nxr-bw-nav-item nxr-bw-wire" />
                <span className="nxr-bw-nav-item nxr-bw-wire" />
                <span className="nxr-bw-nav-btn nxr-bw-fill" />
              </div>

              {/* hero: wireframe -> gradient image + headline + CTA + perf ring */}
              <div className="nxr-bw-hero nxr-bw-wire">
                <div className="nxr-bw-fill nxr-bw-hero-fill" />
                <div className="nxr-bw-hero-copy">
                  <span className="nxr-bw-hline nxr-bw-fill" />
                  <span className="nxr-bw-hline sm nxr-bw-fill" />
                  <span className="nxr-bw-cta nxr-bw-fill" />
                </div>
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

              {/* content line */}
              <div className="nxr-bw-line nxr-bw-wire w70">
                <div className="nxr-bw-fill nxr-bw-line-accent" />
              </div>

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

              {/* data panel with live chart */}
              <div className="nxr-bw-data">
                <div className="nxr-bw-db">
                  <svg viewBox="0 0 24 24">
                    <ellipse cx="12" cy="5" rx="8" ry="3" />
                    <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
                    <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
                  </svg>
                </div>
                <div className="nxr-bw-chart">
                  <span className="nxr-bw-bar" />
                  <span className="nxr-bw-bar" />
                  <span className="nxr-bw-bar" />
                  <span className="nxr-bw-bar" />
                  <span className="nxr-bw-bar" />
                </div>
                <div className="nxr-bw-stat">
                  <span className="nxr-bw-stat-num">2.840</span>
                  <span className="nxr-bw-stat-label">usuarios activos</span>
                </div>
              </div>
            </div>

            {/* footer: live build progress + status */}
            <div className="nxr-bw-status">
              <span className="nxr-bw-status-dot" />
              <span className="nxr-bw-status-text">Iniciando…</span>
              <div className="nxr-bw-progress">
                <span className="nxr-bw-progress-fill" />
              </div>
              <span className="nxr-bw-progress-pct">0%</span>
            </div>
          </div>

          {/* ---- Docked phone (responsive, final stage) ---- */}
          <div className="nxr-bw-phone">
            <div className="nxr-bw-phone-notch" />
            <div className="nxr-bw-phone-body">
              <div className="nxr-bw-phone-hero" />
              <div className="nxr-bw-phone-line w80" />
              <div className="nxr-bw-phone-line w60" />
              <div className="nxr-bw-phone-card" />
            </div>
          </div>

          {/* floating chips + cursor + live badge */}
          <div className="nxr-bw-chip nxr-bw-chip-code">&lt;/&gt;</div>
          <div className="nxr-bw-chip nxr-bw-chip-perf">
            <svg viewBox="0 0 24 24">
              <path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z" />
            </svg>
            98
          </div>
          <div className="nxr-bw-livebadge">
            <span className="nxr-bw-live-dot" />
            EN VIVO
          </div>
        </div>
      </div>
    </div>
  );
}
