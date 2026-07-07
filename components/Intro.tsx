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

    // Windmill geometry. All three blades reach their readable (horizontal)
    // position at the SAME spot — the centre of the free space between the
    // left-hand headline and the right edge on desktop, and the screen centre
    // on mobile. Cards 0 and 2 pivot on an axis to the RIGHT of that spot; card
    // 1 ("02 Automatizamos") pivots on an axis to the LEFT (a mirrored second
    // windmill) but still passes through the same centre, never over the title.
    const START = 95;
    const OFFSET = 90; // wide spacing → only one blade visible at a time
    const FADE_CORE = 20; // fully opaque within ±this angle
    const FADE_SPAN = 62;

    // Scroll → rotation. Deliberately VERY SLOW where it's readable: each
    // "dwell" segment barely rotates (≈16° spread around the readable angle) so
    // the blade sits almost still for a long stretch of scroll instead of
    // sweeping past — then a quick ~74° snap swaps to the next blade. The last
    // dwell is held right to p=1.0, so the third card is still readable as the
    // section hands off to Servicios (no empty tail — it just scrolls away with
    // the sticky, keeping the page continuous).
    const ROT_KNOTS: [number, number][] = [
      [0.0, 55], // card 0 rising from below while the intro text clears
      [0.24, 88], // card 0 arrives near-readable
      [0.46, 103], // card 0 DWELL — barely moves (centred ≈ 95)
      [0.54, 177], // quick snap → card 1
      [0.74, 193], // card 1 DWELL (centred ≈ 185)
      [0.82, 267], // quick snap → card 2
      [1.0, 285], // card 2 DWELL held to the end — still readable at handoff
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

    // Places each card so its centre sits on the shared readable spot and sets
    // its rotation axis (right for cards 0/2, left for card 1). Recomputed on
    // resize.
    function layoutCards() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw <= 900;
      const cx = mobile ? vw / 2 : (headline!.getBoundingClientRect().right + vw) / 2;
      const cy = vh / 2;
      // Arc radius (axis distance from the readable spot). Larger = the pivot is
      // farther away, so each blade sweeps a wider, gentler arc instead of
      // whipping around a tight corner. Not too large though, or the blade flies
      // far off to a corner on the way out and empties the centre.
      const R = mobile ? 430 : 820;
      cards.forEach((card, i) => {
        const el = card!;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        el.style.left = `${cx - w / 2}px`;
        el.style.top = `${cy - h / 2}px`;
        el.style.right = "auto";
        el.style.marginTop = "0";
        const leftAxis = i === 1;
        const ax = leftAxis ? cx - R : cx + R;
        el.style.transformOrigin = `${ax - (cx - w / 2)}px center`;
      });
    }

    function onScroll() {
      const rect = wrap!.getBoundingClientRect();
      const total = wrap!.offsetHeight - window.innerHeight;
      const p = clamp(-rect.top / total, 0, 1);
      const mobile = window.innerWidth <= 900;

      if (mobile) {
        // Title + text simply scroll up together and fade — no pinning tricks,
        // no CSS-transition lag (transition:none), so it reads as a normal
        // upward scroll. Cleared early (by p≈0.15) so it's gone before card 0
        // rises into view.
        const up = clamp(p / 0.15, 0, 1);
        const ty = lerp(0, -300, up);
        headline!.style.transition = "none";
        headline!.style.transform = `translateY(${ty}px)`;
        headline!.style.opacity = String(1 - up);
        texts!.style.transform = `translateY(${ty}px)`;
        texts!.style.opacity = String(1 - up);
      } else {
        headline!.style.transition = "";
        headline!.style.transform = "";
        headline!.style.opacity = "";
        // Desktop: only the paragraphs fade up; the headline stays put.
        const tMove = clamp(p / 0.28, 0, 1);
        const tFade = ease(clamp((p - 0.18) / 0.12, 0, 1));
        texts!.style.transform = `translateY(${lerp(0, -120, tMove)}px)`;
        texts!.style.opacity = String(lerp(1, 0, tFade));
      }

      const rot = rotAt(p);
      cards.forEach((card, i) => {
        const leftAxis = i === 1;
        // Negative → below; 0 → horizontal/readable; positive → above.
        const angle = -START - i * OFFSET + rot;
        const rz = leftAxis ? -angle : angle; // mirror the left windmill
        const aAbs = Math.abs(angle);
        const vis = clamp(1 - (aAbs - FADE_CORE) / FADE_SPAN, 0, 1);
        const scale = 0.94 + vis * 0.06;
        const blur = (1 - vis) * 4;

        // Windmill spin (rotateZ) + a GENTLE 3D turn — the perspective tilt is
        // kept subtle now (shallow rotateY/rotateX + a longer perspective) so
        // the cards read closer to flat, per request. rotateY/rotateX stay baked
        // into the SAME transform so each card's own backdrop-filter still works.
        let ry = clamp(-angle * 0.28, -16, 16);
        if (leftAxis) ry = -ry;
        const rx = 3 + (1 - vis) * 5;
        card!.style.transform = `perspective(1500px) rotate(${rz}deg) rotateY(${ry}deg) rotateX(${rx}deg) scale(${scale})`;
        card!.style.opacity = String(vis);
        card!.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
        card!.style.zIndex = String(10 + Math.round(vis * 10));
      });
    }

    const onResize = () => {
      layoutCards();
      onScroll();
    };
    layoutCards();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
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
