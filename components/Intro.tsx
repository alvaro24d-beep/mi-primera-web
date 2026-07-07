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
  const textsRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const texts = textsRef.current;
    const cards = [card1Ref.current, card2Ref.current, card3Ref.current];
    if (!wrap || !texts || cards.some((c) => !c)) return;

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    // Windmill geometry: each card is a blade pivoting on the right edge of the
    // screen (see globals.css transform-origin). Scroll drives one rotation;
    // the per-card OFFSET spaces the three blades apart so they sweep up through
    // the readable (angle ≈ 0, horizontal) position one after another.
    const START = 95; // card 0's angle at scroll=0 (well below/hidden)
    const OFFSET = 90; // wide angular spacing so only ONE blade is visible at a time
    const FADE_CORE = 18; // fully opaque within ±this angle
    const FADE_SPAN = 60; // fades to 0 over this many further degrees

    // Scroll → rotation is non-linear and deliberately slow:
    //  · rot stays ~0 until p≈0.33 so the first blade only appears AFTER the
    //    intro paragraphs (which finish fading by p≈0.30) have gone;
    //  · shallow-slope segments centred on rot = 95 / 185 / 275 (where cards
    //    0/1/2 are horizontal) make each blade LINGER horizontal — easy to
    //    read — while it sweeps faster in between.
    const ROT_KNOTS: [number, number][] = [
      [0.0, 0],
      [0.3, 12], // blades still hidden below while the text is up
      [0.36, 78],
      [0.52, 150], // card 0 dwell (readable ≈ 0.40)
      [0.58, 185],
      [0.74, 248], // card 1 dwell (readable ≈ 0.60)
      [0.8, 275],
      [0.88, 300], // card 2 dwell (readable ≈ 0.81)
      [0.95, 360], // …then card 2 keeps rotating fully OUT before the pin ends,
      [1.0, 385], //  so nothing is frozen mid-motion when the sticky releases.
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

      // Intro paragraphs fade up and out before the blades take over.
      const tMove = clamp(p / 0.28, 0, 1);
      const tFade = ease(clamp((p - 0.18) / 0.12, 0, 1));
      texts!.style.transform = `translateY(${lerp(0, -120, tMove)}px)`;
      texts!.style.opacity = String(lerp(1, 0, tFade));

      const rot = rotAt(p);
      cards.forEach((card, i) => {
        // Card index 1 ("02 Automatizamos") pivots on the LEFT edge instead —
        // a second windmill mirrored across the screen (its position/origin is
        // set in CSS; here we just mirror the rotation direction).
        const isLeft = i === 1;
        // Negative → points down (bottom); 0 → horizontal/readable; positive →
        // points up. Rises with scroll.
        const angle = -START - i * OFFSET + rot;
        const aAbs = Math.abs(angle);
        const vis = clamp(1 - (aAbs - FADE_CORE) / FADE_SPAN, 0, 1);
        const scale = 0.9 + vis * 0.1;
        const blur = (1 - vis) * 6;

        // Windmill spin (rotateZ) + a pronounced 3D turn (perspective +
        // rotateY/rotateX, baked into the SAME transform so the card's own
        // backdrop-filter still renders — an ancestor perspective would kill
        // the glass blur). The card turns to face you at horizontal and tips
        // away 3D as it enters/leaves; mirrored for the left-pivot card.
        const rz = isLeft ? -angle : angle;
        let ry = clamp(-angle * 0.6, -42, 42);
        if (isLeft) ry = -ry;
        const rx = 8 + (1 - vis) * 12;
        card!.style.transform = `perspective(1100px) rotate(${rz}deg) rotateY(${ry}deg) rotateX(${rx}deg) scale(${scale})`;
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
            <h2 className="nxr-intro-headline nxr-reveal">
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
