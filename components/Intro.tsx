"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { scrambleElement } from "@/hooks/useTextScramble";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGlassPanels } from "@/hooks/useGlassPanels";
import { useCurvedWords } from "@/hooks/useCurvedWords";
import { useDampedSticky } from "@/hooks/useDampedSticky";
import { useScrollBrake } from "@/hooks/useScrollBrake";

// Compact looping graphic per card, each representing its service (same idea
// as the home Servicios animations): a website building for "Construimos", an
// automation flow with a travelling pulse for "Automatizamos", growth bars for
// "Hacemos crecer". Pure CSS keyframes (see globals.css) so they keep looping.
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
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const textsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Real volumetric fluid-glass behind each intro card (same identity as the
  // Servicios cards, flat variant) — the DOM card keeps only layout/content;
  // see the .nxr-intro-card CSS, which no longer paints its own glass.
  useGlassPanels(sectionRef, ".nxr-intro-card", "#12141c", [reducedMotion]);

  // ONE block wrapping both paragraphs (see the JSX comment) so they share a
  // single deformation surface. "right": this column sits on the RIGHT half
  // of the screen, where the concave backdrop wraps its right side toward
  // the viewer — and matches the requested mobile direction too.
  useCurvedWords(sectionRef, ".nxr-intro-textblock", "right");

  // Dynamic per-line bow on the (gradient) headline too — see Proceso.tsx.
  useCurvedWords(sectionRef, ".nxr-intro-headline", "left", [], { bowOnly: true, useExistingWords: true });

  // Both sticky elements (headline + paragraph block) decelerate smoothly
  // into their stuck position and ease back out instead of freezing dead the
  // frame they arrive ("todos los sticky amortiguados al ponerse y
  // quitarse"). Desktop-only in effect: the hook no-ops while the elements'
  // computed position isn't sticky (mobile layouts make them static).
  useDampedSticky(sectionRef, ".nxr-intro-left, .nxr-intro-texts");

  // Viscous zone: wheel speed eases down to ~45% as the paragraph block
  // approaches its sticky point, stays slow through the centred reading
  // window and releases with the dissolve — the sticky engagement happens
  // in slow motion on top of the element-level damping above.
  useScrollBrake(sectionRef, ".nxr-intro-texts", "nxr-intro");

  useGSAP(
    () => {
      // Same direct-media-query safety net as useTitleReveal: avoids running
      // the animated setup for one tick before a reduced-motion re-render
      // corrects it.
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const section = sectionRef.current;
      const texts = textsRef.current;
      if (!section || !texts) return;

      if (prefersReduced) {
        gsap.set(texts, { visibility: "visible" });
        return;
      }

      // No y drift on `texts` on ANY viewport ("ni acelerado ni frenado, como
      // el scroll estándar"): the old ±40px entry/exit tweens made the text
      // move faster than the page right before disappearing, which read as a
      // sudden acceleration. Desktop additionally must never touch transform
      // at all — the sticky centering (translateY(-50%)) lives there.
      const isDesktop = window.innerWidth >= 901;
      // blur(5px) de arranque: misma receta de entrada que las captions de
      // cada servicio del reel (opacity 0→1 + blur 5→0 + scramble del texto;
      // ver updateSpiral en Servicios.tsx). Sin y-drift aquí: el transform
      // de .nxr-intro-texts es del sticky centering en desktop y el del
      // textblock es de useCurvedWords.
      gsap.set(texts, { opacity: 0, filter: "blur(5px)" });
      // CSS keeps `texts` `visibility: hidden` until here (see globals.css) —
      // without this, it'd flash fully visible for a frame on first paint,
      // before this layout effect has a chance to run. The CARDS are plain
      // always-visible flow content now — no reveal choreography at all
      // ("que salgan de abajo pero que se vean desde el principio"); on
      // desktop a large margin above the first card (see #nxr-intro-card-1)
      // keeps them clear of the centred text while it's readable.
      gsap.set(texts, { visibility: "visible" });

      // ---- Text scramble (adapted from the motion-primitives TextScramble
      // reference, WITHOUT framer-motion — this codebase animates with GSAP
      // and the effect is a plain interval anyway). It must mutate the
      // `.nxr-cw-word` spans created by useCurvedWords rather than re-render
      // the paragraph: replacing the DOM text wholesale would destroy the
      // per-word curvature transforms. Each word's width is locked for the
      // duration so random glyphs can't reflow the line wrapping mid-effect.
      const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let cancelScramble: (() => void) | null = null;
      const scramble = () => {
        cancelScramble?.();
        const words = Array.from(texts.querySelectorAll<HTMLElement>(".nxr-cw-word"));
        // V16.21: en móvil NO hay .nxr-cw-word — useCurvedWords hace early
        // return <901px desde "quita la perspectiva de los textos en
        // móvil", así que este scramble llevaba MUDO en teléfono desde
        // entonces ("no has cambiado la del párrafo de la intro"). Ahí se
        // usa el MISMO scrambleElement de las captions del reel, que crea
        // sus propios spans por palabra.
        if (!words.length) {
          texts.querySelectorAll<HTMLElement>(".nxr-intro-text").forEach((p) => scrambleElement(p));
          return;
        }
        const originals = words.map((w) => w.textContent ?? "");
        const total = originals.reduce((n, t) => n + t.length, 0);
        words.forEach((w) => (w.style.width = `${w.offsetWidth}px`));
        const restore = () => {
          words.forEach((w, wi) => {
            w.textContent = originals[wi];
            w.style.width = "";
          });
        };
        const SPEED = 40; // ms per step (reference component's 0.04s)
        const steps = 900 / SPEED;
        let step = 0;
        const id = window.setInterval(() => {
          const progress = step / steps;
          let idx = 0;
          words.forEach((w, wi) => {
            const orig = originals[wi];
            let out = "";
            for (let c = 0; c < orig.length; c++, idx++) {
              out += progress * total > idx ? orig[c] : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
            }
            w.textContent = out;
          });
          step++;
          if (step > steps) {
            window.clearInterval(id);
            restore();
            cancelScramble = null;
          }
        }, SPEED);
        cancelScramble = () => {
          window.clearInterval(id);
          restore();
          cancelScramble = null;
        };
      };

      // The scramble entrance fires on EVERY viewport ("tiene que salir").
      // Desktop: a real-time trigger as the block settles into its sticky
      // spot, which also owns the opacity fade-in/out. V16.20: el trigger
      // va sobre el CONTENEDOR (.nxr-intro-cards, primera hija = texts) y
      // no sobre el propio bloque sticky — el rect del sticky se CLAVA en
      // top:calc(50%+70px) menos la mitad de su altura, y con el texto de
      // 14px (V16.10) esa cota quedaba por DEBAJO de la línea "top 45%" en
      // viewports 900px: el onEnter no disparaba nunca y el párrafo se
      // quedaba invisible. El contenedor no es sticky, así que su top
      // siempre cruza; "top 55%" dispara ~25px después de engancharse el
      // sticky. Mobile: fires as the block scrolls into view; opacity
      // there stays with the scrubbed timeline below, the scramble just
      // plays over its fade-in.
      ScrollTrigger.create({
        trigger: texts.parentElement ?? texts,
        start: isDesktop ? "top 55%" : "top 82%",
        // V16.21: la entrada es REAL-TIME también en móvil — la receta de
        // las captions del reel (opacity 0→1 + blur 5→0 rápidos + scramble)
        // en el momento de cruzar, no un fundido lento atado al scrub que
        // resultaba imperceptible ("no has cambiado la del párrafo de la
        // intro"). El scrub conserva solo el hold y el fade de SALIDA.
        onEnter: () => {
          gsap.to(texts, { opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power1.out", overwrite: "auto" });
          scramble();
        },
        onLeaveBack: () => {
          cancelScramble?.();
          gsap.to(texts, { opacity: 0, filter: "blur(5px)", duration: 0.2, ease: "power1.in", overwrite: "auto" });
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: texts,
          start: "top bottom",
          // Mobile keeps its fade-in/fade-out phases and generous runway.
          // V16.20 "que dure más antes de desaparecer": desktop pasa de
          // 1000px a 1400px de presupuesto — la llegada al sticky sigue
          // siendo ~550px (eso lo fija el layout, no la timeline), así que
          // todo lo ganado va a la ventana de lectura (~190px → ~480px)
          // antes de la disolución (que ahora corre 1027→1307px, con el
          // margen de #nxr-intro-card-1 subido en lockstep para que la
          // card no invada el texto). Móvil: 840→1000px con el hold
          // alargado en unidades (mismo px/unit ≈ 311, solo dura más).
          end: () => (window.innerWidth < 768 ? "+=1000" : "+=1400"),
          scrub: 0.6,
        },
      });

      if (isDesktop) {
        // Dissolve IN PLACE, LONG and LINEAR (opacity only — the sticky
        // centering owns the transform): a short fade at normal wheel speed
        // read as the text vanishing "de golpe". Positioned so the text is
        // gone right before the first (always-visible) card climbs into the
        // text block's zone — see #nxr-intro-card-1's desktop margin.
        // immediateRender: false is critical on a fromTo placed mid-timeline:
        // otherwise it applies opacity 1 at refresh and un-hides the block
        // long before its entrance.
        tl.fromTo(texts, { opacity: 1 }, { opacity: 0, duration: 0.6, ease: "none", immediateRender: false }, 2.2);
        // Closing spacer pins the timeline's total duration (and therefore
        // the px-per-unit scrub mapping) now that the cards have no tween.
        tl.to({}, { duration: 0.2 }, 2.8);
      } else {
        // V16.21: la ENTRADA ya no vive en el scrub (es el trigger
        // real-time de arriba, como en desktop) — el scrub conserva el
        // presupuesto (spacer donde iba el fade-in) para no alterar el
        // px/unit, el hold alargado (V16.20, "que dure más") y el fade de
        // SALIDA, que sigue scrubbed (la salida no cambia). fromTo con
        // immediateRender:false: sin él, un fromTo a mitad de timeline
        // pinta opacity 1 en el refresh y desvela el bloque antes de
        // tiempo (misma lección que el fromTo del desktop).
        tl.to({}, { duration: 1 }, 0);
        tl.to({}, { duration: 1.2 }, 1);
        tl.fromTo(
          texts,
          { opacity: 1 },
          { opacity: 0, duration: 1, ease: "power2.in", immediateRender: false },
          2.2
        );
        // Spacer keeps the previous scrub pacing now that the cards (which
        // used to close the timeline at ~2.4) are plain flow content.
        tl.to({}, { duration: 0.7 }, 2.2);
      }

      return () => {
        cancelScramble?.();
      };
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-intro" ref={sectionRef}>
      <div className="nxr-intro-inner">
        <div className="nxr-intro-left">
          <h2 className="nxr-intro-headline nxr-reveal" ref={titleRef}>
            Hacemos que
            <br />
            la tecnología
            <br />
            <span className="nxr-gradient-text-lime">trabaje por ti.</span>
          </h2>
        </div>

        <div className="nxr-intro-cards">
          <div className="nxr-intro-texts" ref={textsRef}>
            {/* ONE wrapper block for BOTH paragraphs: useCurvedWords tilts and
                curves this single element, so the two <p>s share one
                deformation surface instead of each carrying its own (explicit
                request). Also keeps the hook's inline transform off
                .nxr-intro-texts itself, whose transform GSAP owns (y tween). */}
            <div className="nxr-intro-textblock">
              <p className="nxr-intro-text">
                Somos una agencia de <strong>software e inteligencia artificial</strong> especializada en construir
                sistemas digitales que automatizan tareas, captan clientes y hacen crecer negocios — sin que tengas que
                entender de tecnología.
              </p>
              <p className="nxr-intro-text">
                Trabajamos con <strong>empresas de cualquier sector</strong> que saben que pueden ir más rápido pero no
                tienen el equipo técnico para hacerlo. Nosotros somos ese equipo.
              </p>
            </div>
          </div>

          <div className="nxr-intro-card" id="nxr-intro-card-1">
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

          <div className="nxr-intro-card" id="nxr-intro-card-2">
            <AutoAnim />
            <div className="nxr-intro-card-text">
              <span className="nxr-intro-col-num">02 — Automatizamos</span>
              <div className="nxr-intro-col-title">Tu negocio funcionando solo, 24/7.</div>
              <p className="nxr-intro-col-desc">
                Conectamos tus herramientas y creamos agentes de IA que eliminan el trabajo manual para que tu equipo se
                enfoque en lo importante.
              </p>
            </div>
          </div>

          <div className="nxr-intro-card" id="nxr-intro-card-3">
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
    </section>
  );
}
