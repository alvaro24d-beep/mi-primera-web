"use client";

import { useEffect, useRef } from "react";

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
    if (window.innerWidth <= 900) return;

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    // Windmill geometry: each card is a blade pivoting on the right edge of the
    // screen (transform-origin: right center, in CSS). Scroll drives a single
    // rotation; the per-card OFFSET spaces the three blades apart so they
    // sweep up through the readable (angle ≈ 0, horizontal) position one after
    // another — emerging from the bottom-right, hiding at the top-right.
    const START = 70; // card 0's angle at scroll=0 (negative side = below/bottom)
    const OFFSET = 62; // angular spacing between blades
    const FADE_CORE = 18; // fully opaque within ±this angle
    const FADE_SPAN = 60; // fades to 0 over this many further degrees

    // Scroll → rotation is non-linear: the blade rotates SLOWLY through each
    // readable (near-horizontal) position — the shallow-slope segments below,
    // centred on rot = 70 / 132 / 194 (where cards 0/1/2 are horizontal) — and
    // faster in between, so each card lingers horizontal and is easy to read.
    const ROT_KNOTS: [number, number][] = [
      [0.0, 0],
      [0.18, 60],
      [0.36, 80], // card 0 dwell (crosses 70 slowly)
      [0.46, 122],
      [0.64, 142], // card 1 dwell (crosses 132 slowly)
      [0.74, 184],
      [0.92, 204], // card 2 dwell (crosses 194 slowly)
      [1.0, 230],
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

      // Intro paragraphs fade up and out before the blades take over (unchanged).
      const tMove = clamp(p / 0.28, 0, 1);
      const tFade = ease(clamp((p - 0.18) / 0.12, 0, 1));
      texts!.style.transform = `translateY(${lerp(0, -120, tMove)}px)`;
      texts!.style.opacity = String(lerp(1, 0, tFade));

      const rot = rotAt(p);
      cards.forEach((card, i) => {
        // Negative → blade points down (bottom-right); 0 → horizontal/readable;
        // positive → points up (top-right). Increases with scroll so blades rise.
        const angle = -START - i * OFFSET + rot;
        const aAbs = Math.abs(angle);
        const vis = clamp(1 - (aAbs - FADE_CORE) / FADE_SPAN, 0, 1);
        const scale = 0.9 + vis * 0.1;
        const blur = (1 - vis) * 6;
        card!.style.transform = `rotate(${angle}deg) scale(${scale})`;
        card!.style.opacity = String(vis);
        card!.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
        // The blade closest to horizontal sits on top as they cross.
        card!.style.zIndex = String(10 + Math.round(vis * 10));
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
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
              right edge of the screen. On mobile this collapses to a normal
              stacked column (see globals.css). */}
          <div className="nxr-intro-wheel">
            <div className="nxr-intro-card" id="nxr-intro-card-1" ref={card1Ref}>
              <span className="nxr-intro-col-num">01 — Construimos</span>
              <div className="nxr-intro-col-title">Tu presencia digital, hecha para vender.</div>
              <p className="nxr-intro-col-desc">
                Webs, aplicaciones y plataformas diseñadas desde cero para que tus clientes lleguen, entiendan lo que
                ofreces y contacten contigo.
              </p>
            </div>

            <div className="nxr-intro-card" id="nxr-intro-card-2" ref={card2Ref}>
              <span className="nxr-intro-col-num">02 — Automatizamos</span>
              <div className="nxr-intro-col-title">Tu negocio funcionando solo, 24/7.</div>
              <p className="nxr-intro-col-desc">
                Conectamos tus herramientas y creamos agentes de IA que eliminan el trabajo manual para que tu equipo
                se enfoque en lo importante.
              </p>
            </div>

            <div className="nxr-intro-card" id="nxr-intro-card-3" ref={card3Ref}>
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
