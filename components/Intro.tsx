"use client";

import { useEffect, useRef } from "react";

export default function Intro() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const textsRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const right = rightRef.current;
    const texts = textsRef.current;
    const card1 = card1Ref.current;
    const card2 = card2Ref.current;
    const card3 = card3Ref.current;
    if (!wrap || !right || !texts || !card1 || !card2 || !card3) return;
    if (window.innerWidth <= 900) return;

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    let GAP = 0;
    const REST_RX = 8;
    const REST_RY = -5;
    const START_RX = 32;
    const START_RY = -20;

    function calcGap() {
      GAP = card1!.offsetHeight + 16;
    }
    calcGap();
    const onResize = () => calcGap();
    window.addEventListener("resize", onResize);

    texts.style.opacity = "1";
    texts.style.transform = "translateY(0px)";

    [card1, card2, card3].forEach((card) => {
      card!.style.opacity = "0";
      card!.style.filter = "blur(10px)";
      card!.style.top = "0px";
      card!.style.transform = `translateY(60px) rotateX(${START_RX}deg) rotateY(${START_RY}deg) scale(0.75)`;
    });

    function onScroll() {
      const rect = wrap!.getBoundingClientRect();
      const total = wrap!.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const p = clamp(scrolled / total, 0, 1);

      const tMove = clamp(p / 0.28, 0, 1);
      const tFade = ease(clamp((p - 0.18) / 0.12, 0, 1));
      texts!.style.transform = `translateY(${lerp(0, -120, tMove)}px)`;
      texts!.style.opacity = String(lerp(1, 0, tFade));

      const flatP = ease(clamp((p - 0.55) / 0.25, 0, 1));
      right!.style.perspective = `${lerp(700, 4000, flatP)}px`;
      const rx = lerp(REST_RX, 0, flatP);
      const ry = lerp(REST_RY, 0, flatP);

      const c1p = ease(clamp((p - 0.18) / 0.15, 0, 1));
      card1!.style.top = "0px";
      card1!.style.zIndex = "3";
      card1!.style.transform = `translateY(${lerp(60, 0, c1p)}px) rotateX(${lerp(START_RX, c1p < 1 ? REST_RX : rx, c1p)}deg) rotateY(${lerp(START_RY, c1p < 1 ? REST_RY : ry, c1p)}deg) scale(${lerp(0.75, 1, c1p)})`;
      card1!.style.opacity = String(lerp(0, 1, c1p));
      card1!.style.filter = `blur(${lerp(10, 0, c1p)}px)`;

      const c2p = ease(clamp((p - 0.28) / 0.15, 0, 1));
      card2!.style.top = `${GAP}px`;
      card2!.style.zIndex = "2";
      card2!.style.transform = `translateY(${lerp(60, 0, c2p)}px) rotateX(${lerp(START_RX, c2p < 1 ? REST_RX : rx, c2p)}deg) rotateY(${lerp(START_RY, c2p < 1 ? REST_RY : ry, c2p)}deg) scale(${lerp(0.75, 1, c2p)})`;
      card2!.style.opacity = String(lerp(0, 1, c2p));
      card2!.style.filter = `blur(${lerp(10, 0, c2p)}px)`;

      const c3p = ease(clamp((p - 0.38) / 0.15, 0, 1));
      card3!.style.top = `${GAP * 2}px`;
      card3!.style.zIndex = "1";
      card3!.style.transform = `translateY(${lerp(60, 0, c3p)}px) rotateX(${lerp(START_RX, c3p < 1 ? REST_RX : rx, c3p)}deg) rotateY(${lerp(START_RY, c3p < 1 ? REST_RY : ry, c3p)}deg) scale(${lerp(0.75, 1, c3p)})`;
      card3!.style.opacity = String(lerp(0, 1, c3p));
      card3!.style.filter = `blur(${lerp(10, 0, c3p)}px)`;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("resize", onResize);
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

            <div className="nxr-intro-right" ref={rightRef}>
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

              <div className="nxr-intro-card" id="nxr-intro-card-1" ref={card1Ref}>
                <span className="nxr-intro-col-num">01 — Construimos</span>
                <div className="nxr-intro-col-title">Tu presencia digital, hecha para vender.</div>
                <p className="nxr-intro-col-desc">
                  Webs, aplicaciones y plataformas diseñadas desde cero para que tus clientes lleguen, entiendan lo
                  que ofreces y contacten contigo.
                </p>
              </div>

              <div className="nxr-intro-card" id="nxr-intro-card-2" ref={card2Ref}>
                <span className="nxr-intro-col-num">02 — Automatizamos</span>
                <div className="nxr-intro-col-title">Tu negocio funcionando solo, 24/7.</div>
                <p className="nxr-intro-col-desc">
                  Conectamos tus herramientas y creamos agentes de IA que eliminan el trabajo manual para que tu
                  equipo se enfoque en lo importante.
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
      </div>
    </section>
  );
}
