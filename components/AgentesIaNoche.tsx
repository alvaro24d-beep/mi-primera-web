"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCurvedWords } from "@/hooks/useCurvedWords";
import { useGlassPanels } from "@/hooks/useGlassPanels";

gsap.registerPlugin(ScrollTrigger);

// "El turno de noche": pinned scroll piece for /agentes-ia. A giant clock
// scrubs 23:00 → 07:00 while resolved customer chats land on a notification
// pile and a counter ticks up — the 24/7 promise SHOWN, not claimed (golden
// rule, AGENTS.md). Own scroll mechanic on purpose: not dwh's horizontal
// reel, not its card deck.
//
// Every card is a volumetric-glass anchor (global SceneCanvas — the section
// id lives in its alwaysIds). Pile choreography uses translate/scale/opacity
// ONLY, so the glass meshes can track the anchors (rotation can't be
// tracked — same constraint as CapacidadesWeb's deck).

const NIGHT = [
  {
    time: "23:41",
    q: "¿Hacéis envíos a Canarias?",
    a: "Sí, en 48–72h 📦 Te acabo de pasar las tarifas por WhatsApp.",
  },
  {
    time: "01:05",
    q: "¿Puedo mover mi cita del jueves?",
    a: "Hecho: pasada al viernes a las 10:30 ✅ Te llega la confirmación ahora.",
  },
  {
    time: "03:47",
    q: "¿Os queda el modelo M2 en stock?",
    a: "Quedan 3 unidades. ¿Te reservo una a tu nombre?",
  },
  {
    time: "06:20",
    q: "Quiero presupuesto para mi tienda online",
    a: "Te he enviado 4 preguntas rápidas — con eso mañana tienes tu propuesta 📬",
  },
];

// Clock scrub range, in minutes: 23:00 → 07:00 (next day).
const CLOCK_START = 23 * 60;
const CLOCK_END = 31 * 60;

// How a card already `s` slots deep in the pile rests (newest lands at 0,0).
const pileSlot = (s: number) => ({
  y: s * 30,
  scale: 1 - Math.min(s, 3) * 0.05,
  opacity: s === 0 ? 1 : s === 1 ? 0.5 : s === 2 ? 0.24 : 0,
});

export default function AgentesIaNoche() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGlassPanels(sectionRef, ".nxr-aia-nt-card", "#0d1018", [reducedMotion]);
  // Clock + title + counter share ONE plane (Contacto-textblock pattern) —
  // a CSS-tilted h2 sandwiched between a flat clock and a flat counter read
  // as three different distortions ("tiene que ser la misma"). The clock and
  // counter are splitIgnore'd (their text is rewritten per tick, which would
  // destroy SplitText spans) — they ride the block plane without a bow; the
  // h2's reveal spans join the block's bow field.
  useCurvedWords(sectionRef, ".nxr-aia-nt-textblock", "left", [reducedMotion], {
    splitIgnore: ".nxr-section-h2, .nxr-aia-nt-clock, .nxr-aia-nt-counter",
  });

  useGSAP(
    () => {
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stage = stageRef.current;
      if (!stage) return;

      const q = gsap.utils.selector(stage);
      const clockEl = q(".nxr-aia-nt-clock")[0] as HTMLElement | undefined;
      const counterEl = q(".nxr-aia-nt-counter b")[0] as HTMLElement | undefined;
      const veil = q(".nxr-aia-nt-veil")[0] as HTMLElement | undefined;
      const cards = q(".nxr-aia-nt-card") as HTMLElement[];
      const aOf = (c: HTMLElement) => c.querySelector<HTMLElement>(".nxr-aia-nt-a");
      const doneOf = (c: HTMLElement) => c.querySelector<HTMLElement>(".nxr-aia-nt-done");
      const innerOf = (c: HTMLElement) => c.querySelector<HTMLElement>(".nxr-aia-nt-inner");

      const setClock = (mins: number) => {
        if (!clockEl) return;
        const h = Math.floor(mins / 60) % 24;
        const m = Math.floor((mins % 60) / 5) * 5;
        clockEl.innerHTML = `${String(h).padStart(2, "0")}<span>:</span>${String(m).padStart(2, "0")}`;
      };

      if (prefersReduced) {
        // Static fallback: dawn state — pile flattened to a visible grid,
        // every chat resolved, counter full.
        stage.classList.add("nxr-aia-nt-static");
        setClock(3 * 60 + 47);
        if (counterEl) counterEl.textContent = String(NIGHT.length);
        gsap.set(cards, { visibility: "visible", clearProps: "transform,opacity" });
        cards.forEach((c) => {
          gsap.set([aOf(c) ?? [], doneOf(c) ?? []].flat(), { clearProps: "all" });
        });
        return;
      }

      setClock(CLOCK_START);
      if (counterEl) counterEl.textContent = "0";
      cards.forEach((c) => {
        gsap.set(c, { y: 120, opacity: 0, scale: 0.96 });
        gsap.set(aOf(c) ?? [], { opacity: 0, y: 10 });
        gsap.set(doneOf(c) ?? [], { opacity: 0, scale: 0.6 });
      });
      gsap.set(cards, { visibility: "visible" });

      const clockProxy = { val: CLOCK_START };
      const countProxy = { val: 0 };
      const TOTAL = 5.1;
      // The clock finishes its 23:00→07:00 sweep BEFORE the pin ends (then
      // holds at dawn), and each chat lands exactly when the clock shows its
      // own timestamp — one coherent night, with room after the last card
      // for its reply + check even with scrub lag.
      const CLOCK_DUR = TOTAL - 1.0;
      const atOf = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        const mins = (h < 12 ? h + 24 : h) * 60 + m;
        return ((mins - CLOCK_START) / (CLOCK_END - CLOCK_START)) * CLOCK_DUR;
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => (window.innerWidth < 768 ? "+=300%" : "+=340%"),
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Night falls… and lifts again as the clock approaches 07:00.
      tl.to(veil ?? {}, { opacity: 0.55, duration: 0.9, ease: "none" }, 0);
      tl.to(veil ?? {}, { opacity: 0.15, duration: 0.9, ease: "none" }, TOTAL - 1.0);
      tl.to(
        clockProxy,
        { val: CLOCK_END, duration: CLOCK_DUR, ease: "none", onUpdate: () => setClock(clockProxy.val) },
        0
      );

      cards.forEach((card, i) => {
        const at = atOf(NIGHT[i].time);
        // The new chat lands on top of the pile…
        tl.fromTo(
          card,
          { y: 120, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.3)" },
          at
        );
        // …the agent answers, the check lands, the counter ticks…
        tl.to(aOf(card) ?? {}, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, at + 0.18);
        tl.to(doneOf(card) ?? {}, { opacity: 1, scale: 1, duration: 0.28, ease: "back.out(2)" }, at + 0.42);
        tl.to(
          countProxy,
          {
            val: i + 1,
            duration: 0.16,
            ease: "none",
            onUpdate: () => {
              if (counterEl) counterEl.textContent = String(Math.round(countProxy.val));
            },
          },
          at + 0.46
        );
        // …and the previous ones sink one slot deeper. Their CONTENT fades
        // out entirely (translucent glass — overlapping texts read as soup;
        // same fix as CapacidadesWeb's deck): only clean card edges recede.
        for (let j = 0; j < i; j++) {
          const s = pileSlot(i - j);
          tl.to(cards[j], { y: s.y, scale: s.scale, opacity: s.opacity, duration: 0.45, ease: "power2.out" }, at + 0.08);
          if (i - j === 1) {
            tl.to(innerOf(cards[j]) ?? {}, { opacity: 0, duration: 0.3, ease: "power1.out" }, at + 0.05);
          }
        }
      });

      tl.to({}, { duration: 0.5 }, TOTAL - 0.5);
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-aia-noche" className="nxr-aia-noche" ref={sectionRef}>
      <div className="nxr-aia-nt-stage" ref={stageRef}>
        <div className="nxr-aia-nt-veil" aria-hidden="true" />
        <div className="nxr-aia-nt-head">
          <div className="nxr-aia-nt-textblock">
            <div className="nxr-aia-nt-clock" aria-hidden="true">
              23<span>:</span>00
            </div>
            <div className="nxr-reveal">
              <h2 className="nxr-section-h2" ref={titleRef}>
                Mientras tú duermes, <span className="nxr-gradient-text-lime">él sigue en turno.</span>
              </h2>
            </div>
            <div className="nxr-aia-nt-counter">
              <b>0</b> gestiones resueltas antes de que suene tu despertador
            </div>
          </div>
        </div>
        <div className="nxr-aia-nt-pile">
          {NIGHT.map((n) => (
            <div key={n.time} className="nxr-aia-nt-card">
              <span className="nxr-aia-nt-inner">
                <span className="nxr-aia-nt-time">{n.time}</span>
                <span className="nxr-aia-nt-q">{n.q}</span>
                <span className="nxr-aia-nt-a">{n.a}</span>
                <span className="nxr-aia-nt-done">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Resuelto
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
