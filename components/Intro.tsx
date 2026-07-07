"use client";

import { useEffect, useRef } from "react";

// Compact looping graphic per card, each representing its service (same idea
// as the home Servicios animations): a website building for "Construimos", an
// automation flow with a travelling pulse for "Automatizamos", growth bars for
// "Hacemos crecer". Pure CSS keyframes (see globals.css) so they keep looping
// while the card rotates as a windmill blade, on desktop and mobile alike.
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const textsRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const headline = headlineRef.current;
    const texts = textsRef.current;
    const cards = [card1Ref.current, card2Ref.current, card3Ref.current];
    if (!wrap || !headline || !texts || cards.some((c) => !c)) return;

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    // Windmill geometry: every card is a blade pivoting on the SAME axis
    // (globals.css transform-origin, now well off the right edge). Scroll drives
    // one rotation; the per-card OFFSET spaces the three blades apart so they
    // sweep up through the readable (angle ≈ 0, horizontal) position one after
    // another — all along the same path.
    const START = 95; // card 0's angle at scroll=0 (well below/hidden)
    const OFFSET = 90; // wide angular spacing so only ONE blade is visible at a time
    const FADE_CORE = 18; // fully opaque within ±this angle
    const FADE_SPAN = 60; // fades to 0 over this many further degrees

    // Scroll → rotation, non-linear and slow: rot stays ~0 while the intro text
    // is up, shallow-slope segments (centred on rot 95/185/275) make each blade
    // LINGER horizontal, and — crucially — card 2 keeps rotating OUT right up to
    // p = 1 (it reaches opacity 0 exactly as the pin releases), so there's no
    // frozen frame AND no empty gap before the next section: the third card is
    // still leaving as the pin hands off.
    const ROT_KNOTS: [number, number][] = [
      [0.0, 0],
      [0.28, 14], // blades hidden below while the text is up
      [0.34, 78],
      [0.46, 112], // card 0 dwell (readable ≈ 0.40)
      [0.54, 155],
      [0.68, 215], // card 1 dwell (readable ≈ 0.61)
      [0.76, 250],
      [0.88, 285], // card 2 dwell (readable ≈ 0.85) — stays fully visible…
      [0.96, 318], // …then rotates out only in the final stretch, so it's still
      [1.0, 355], //  leaving as the pin releases and the next section arrives.
    ];
    function rotAt(p: number) {
      for (let i = 0; i < ROT_KNOTS.length - 1; i++) {
        const [p0, r0] = ROT_KNOTS[i];
        const [p1, r1] = ROT_KNOTS[i + 1];
        if (p <= p1) return r0 + (r1 - r0) * clamp((p - p0) / (p1 - p0), 0, 1);
      }
      return ROT_KNOTS[ROT_KNOTS.length - 1][1];
    }

    texts.style.opacity = "1";
    texts.style.transform = "translateY(0px)";
    cards.forEach((card) => {
      card!.style.opacity = "0";
    });

    function onScroll() {
      const rect = wrap!.getBoundingClientRect();
      const total = wrap!.offsetHeight - window.innerHeight;
      const p = clamp(-rect.top / total, 0, 1);
      const mobile = window.innerWidth <= 900;

      // Intro paragraphs fade up and out before the blades take over.
      const tMove = clamp(p / 0.28, 0, 1);
      const tFade = ease(clamp((p - 0.18) / 0.12, 0, 1));
      texts!.style.transform = `translateY(${lerp(0, -120, tMove)}px)`;
      texts!.style.opacity = String(lerp(1, 0, tFade));

      // On mobile the headline must NOT stay pinned: it scrolls up and away as
      // the section starts (finishing just as the first blade arrives). On
      // desktop it stays put (reset any inline styles left from a resize).
      const hOut = mobile ? ease(clamp((p - 0.14) / 0.18, 0, 1)) : 0;
      if (hOut > 0.001) {
        headline!.style.transform = `translateY(${lerp(0, -300, hOut)}px)`;
        headline!.style.opacity = String(1 - hOut);
      } else {
        // Leave the headline to its normal flow / reveal animation.
        headline!.style.transform = "";
        headline!.style.opacity = "";
      }

      const rot = rotAt(p);
      cards.forEach((card, i) => {
        // Negative → points down (bottom); 0 → horizontal/readable; positive →
        // points up. Rises with scroll. All blades share the same axis/path.
        const angle = -START - i * OFFSET + rot;
        const aAbs = Math.abs(angle);
        const vis = clamp(1 - (aAbs - FADE_CORE) / FADE_SPAN, 0, 1);
        const scale = 0.9 + vis * 0.1;
        const blur = (1 - vis) * 6;

        // Windmill spin (rotateZ) + a pronounced 3D turn (perspective +
        // rotateY/rotateX baked into the SAME transform, so the card's own
        // backdrop-filter still renders — an ancestor perspective would kill the
        // glass blur). The card turns to face you at horizontal and tips away in
        // 3D as it enters/leaves.
        const ry = clamp(-angle * 0.6, -42, 42);
        const rx = 8 + (1 - vis) * 12;
        card!.style.transform = `perspective(1100px) rotate(${angle}deg) rotateY(${ry}deg) rotateX(${rx}deg) scale(${scale})`;
        card!.style.opacity = String(vis);
        card!.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
        card!.style.zIndex = String(10 + Math.round(vis * 10));
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section id="nxr-intro">
      <div id="nxr-intro-sticky-wrap" ref={wrapRef}>
        <div id="nxr-intro-sticky">
          <div className="nxr-intro-sticky-inner">
            <h2 className="nxr-intro-headline nxr-reveal" ref={headlineRef}>
              Hacemos que
              <br />
              la tecnología
              <br />
              <span className="nxr-gradient-text-lime">trabaje por ti.</span>
            </h2>

            <div className="nxr-intro-right">
              <div className="nxr-intro-texts" ref={textsRef}>
                <div className="nxr-intro-divider"></div>
                <p className="nxr-intro-text">
                  Somos una agencia de <strong>software e inteligencia artificial</strong> especializada en construir
                  sistemas digitales que automatizan tareas, captan clientes y hacen crecer negocios — sin que tengas
                  que entender de tecnología.
                </p>
                <p className="nxr-intro-text">
                  Trabajamos con <strong>empresas de cualquier sector</strong> que saben que pueden ir más rápido pero
                  no tienen el equipo técnico para hacerlo. Nosotros somos ese equipo.
                </p>
              </div>
            </div>
          </div>

          {/* Windmill blades — full-width layer so the pivot sits on the true
              right edge of the screen. Active on desktop and mobile. */}
          <div className="nxr-intro-wheel">
            <div className="nxr-intro-card" id="nxr-intro-card-1" ref={card1Ref}>
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

            <div className="nxr-intro-card" id="nxr-intro-card-2" ref={card2Ref}>
              <AutoAnim />
              <div className="nxr-intro-card-text">
                <span className="nxr-intro-col-num">02 — Automatizamos</span>
                <div className="nxr-intro-col-title">Tu negocio funcionando solo, 24/7.</div>
                <p className="nxr-intro-col-desc">
                  Conectamos tus herramientas y creamos agentes de IA que eliminan el trabajo manual para que tu equipo
                  se enfoque en lo importante.
                </p>
              </div>
            </div>

            <div className="nxr-intro-card" id="nxr-intro-card-3" ref={card3Ref}>
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
      </div>
    </section>
  );
}
