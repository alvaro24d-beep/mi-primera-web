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

// "Así lo montamos": a light cable draws itself with the scroll
// (stroke-dashoffset scrub) and powers up each of the 3 build stations as
// its tip reaches them — connect, train, go live. Its own scroll mechanic (a
// drawing cable), distinct from the hero, the night pile, dwh's reel and
// dwh's deck.
//
// The cable path is BUILT FROM MEASURED CARD POSITIONS (offset chains, like
// the hero's beam anchors — a fixed viewBox path stretched with
// preserveAspectRatio="none" wandered under the cards and read as broken
// fragments, caught via Playwright). Node-editor style: horizontal-out /
// horizontal-in bezier between each card's side ports, threading straight
// through each card. Activation timings come from sampling the real path
// for the point nearest each entry port.
//
// Desktop pins the stage; phones scrub WITHOUT pinning (stacked cards can
// exceed a small viewport, and a pinned overflow traps the scroll).

const PASOS = [
  {
    num: "01",
    title: "Conectamos",
    desc: "Enchufamos tu agenda, CRM, email y WhatsApp — las herramientas que ya usas.",
    color: "var(--c-lime)",
  },
  {
    num: "02",
    title: "Lo entrenamos",
    desc: "Aprende tu negocio: catálogo, precios, políticas y tu forma de hablar.",
    color: "var(--c-salmon)",
  },
  {
    num: "03",
    title: "Sale a atender",
    desc: "En tu web, WhatsApp e Instagram desde el primer día, a cualquier hora.",
    color: "var(--c-red)",
  },
];

const MINI_TOOLS = [
  <svg key="cal" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="17" rx="3" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </svg>,
  <svg key="chat" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>,
  <svg key="mail" viewBox="0 0 24 24">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7l-10 6L2 7" />
  </svg>,
  <svg key="db" viewBox="0 0 24 24">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 5v14c0 1.7-4 3-9 3s-9-1.3-9-3V5M21 12c0 1.7-4 3-9 3s-9-1.3-9-3" />
  </svg>,
];

export default function AgentesIaPasos() {
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const reducedMotion = useReducedMotion();

  useGlassPanels(sectionRef, ".nxr-aia-paso", "#11141b", [reducedMotion]);
  useCurvedWords(sectionRef, ".nxr-section-h2", "left", [reducedMotion], {
    bowOnly: true,
    useExistingWords: true,
  });

  useGSAP(
    () => {
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stage = stageRef.current;
      const svg = svgRef.current;
      const path = pathRef.current;
      const glow = glowRef.current;
      if (!stage || !svg || !path || !glow) return;

      const q = gsap.utils.selector(stage);
      const cards = q(".nxr-aia-paso") as HTMLElement[];
      if (cards.length < 3) return;
      const mobile = window.innerWidth < 768;

      // Transform-blind position of `el` relative to the stage.
      const offTo = (el: HTMLElement) => {
        let x = 0;
        let y = 0;
        let node: HTMLElement | null = el;
        while (node && node !== stage) {
          x += node.offsetLeft;
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        return { x, y };
      };

      // Node-editor cable segment: leaves `a` horizontally, arrives at `b`
      // horizontally.
      const seg = (a: { x: number; y: number }, b: { x: number; y: number }) =>
        ` C ${a.x + (b.x - a.x) * 0.45} ${a.y}, ${a.x + (b.x - a.x) * 0.55} ${b.y}, ${b.x} ${b.y}`;

      const buildPath = () => {
        const W = stage.clientWidth;
        const H = stage.clientHeight;
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

        const ports = cards.map((c) => {
          const o = offTo(c);
          const midY = o.y + c.offsetHeight / 2;
          return { left: { x: o.x, y: midY }, right: { x: o.x + c.offsetWidth, y: midY }, top: o.y, bottom: o.y + c.offsetHeight };
        });

        let d: string;
        let reach: number[];
        if (mobile) {
          // Straight rail left of the stacked cards.
          const x = Math.max(16, ports[0].left.x - 22);
          const y0 = ports[0].top - 26;
          const y1 = ports[2].bottom + 10;
          d = `M ${x} ${y0} L ${x} ${y1}`;
          reach = ports.map((p) => Math.min(1, Math.max(0.05, (p.top + 26 - y0) / (y1 - y0))));
          path.setAttribute("d", d);
          glow.setAttribute("d", d);
        } else {
          const head = { x: Math.max(4, ports[0].left.x - 150), y: ports[0].left.y + 120 };
          const tail = { x: W - 6, y: ports[2].right.y - 110 };
          d =
            `M ${head.x} ${head.y}` +
            seg(head, ports[0].left) +
            ` L ${ports[0].right.x} ${ports[0].right.y}` +
            seg(ports[0].right, ports[1].left) +
            ` L ${ports[1].right.x} ${ports[1].right.y}` +
            seg(ports[1].right, ports[2].left) +
            ` L ${ports[2].right.x} ${ports[2].right.y}` +
            seg(ports[2].right, tail);
          path.setAttribute("d", d);
          glow.setAttribute("d", d);
          // Activation = the fraction of the path nearest each entry port.
          const len = path.getTotalLength();
          reach = ports.map((p) => {
            let best = 0;
            let bd = Infinity;
            for (let k = 0; k <= 160; k++) {
              const pos = path.getPointAtLength((len * k) / 160);
              const dd = (pos.x - p.left.x) ** 2 + (pos.y - p.left.y) ** 2;
              if (dd < bd) {
                bd = dd;
                best = k / 160;
              }
            }
            return best;
          });
        }

        const len = path.getTotalLength();
        gsap.set([path, glow], { strokeDasharray: len, strokeDashoffset: prefersReduced ? 0 : len });
        return reach;
      };

      const minisOf = (card: HTMLElement) => gsap.utils.toArray<HTMLElement>(card.querySelectorAll(".nxr-aia-ps-pop"));
      const linesOf = (card: HTMLElement) => gsap.utils.toArray<HTMLElement>(card.querySelectorAll(".nxr-aia-ps-line"));

      const reach = buildPath();

      if (prefersReduced) {
        cards.forEach((c) => {
          gsap.set(c, { visibility: "visible", clearProps: "transform,opacity" });
          gsap.set([...minisOf(c), ...linesOf(c)], { clearProps: "all" });
        });
        return;
      }

      // Re-measure ports/length when ScrollTrigger recalculates layout
      // (resize, font load) — invalidateOnRefresh then re-captures the dash
      // tween from the reset offset.
      const onRefreshInit = () => buildPath();
      ScrollTrigger.addEventListener("refreshInit", onRefreshInit);

      cards.forEach((c) => {
        gsap.set(c, { opacity: 0.35, scale: 0.94, y: 10 });
        gsap.set(minisOf(c), { opacity: 0, y: 12, scale: 0.85 });
        gsap.set(linesOf(c), { scaleX: 0, transformOrigin: "left center" });
      });
      gsap.set(cards, { visibility: "visible" });

      const DRAW = 2.6;
      const START = 0.15;

      const tl = gsap.timeline({
        scrollTrigger: mobile
          ? {
              trigger: stage,
              start: "top 72%",
              end: "bottom 78%",
              scrub: 0.6,
              invalidateOnRefresh: true,
            }
          : {
              trigger: stage,
              start: "top top",
              end: "+=280%",
              scrub: 0.6,
              pin: stage,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
      });

      tl.to([path, glow], { strokeDashoffset: 0, duration: DRAW, ease: "none" }, START);

      cards.forEach((card, i) => {
        const at = START + DRAW * Math.min(0.96, reach[i]);
        tl.to(card, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power2.out" }, at);
        const pops = minisOf(card);
        if (pops.length) {
          tl.to(pops, { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.07, ease: "back.out(1.6)" }, at + 0.15);
        }
        const lines = linesOf(card);
        if (lines.length) {
          tl.to(lines, { scaleX: 1, duration: 0.3, stagger: 0.09, ease: "power2.out" }, at + 0.12);
        }
      });

      tl.to({}, { duration: 0.35 }, START + DRAW);

      return () => ScrollTrigger.removeEventListener("refreshInit", onRefreshInit);
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-aia-pasos" className="nxr-aia-pasos" ref={sectionRef}>
      <div className="nxr-aia-ps-stage" ref={stageRef}>
        <div className="nxr-reveal">
          <h2 className="nxr-section-h2" ref={titleRef}>
            Tu agente, listo en <span className="nxr-gradient-text-lime">tres pasos.</span>
          </h2>
        </div>

        <svg ref={svgRef} className="nxr-aia-ps-cable" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="nxr-aia-cable-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a8f04a" />
              <stop offset="55%" stopColor="#ff9d7d" />
              <stop offset="100%" stopColor="#ef3d0d" />
            </linearGradient>
          </defs>
          <path ref={glowRef} className="nxr-aia-ps-cable-glow" d="M 0 0" />
          <path ref={pathRef} className="nxr-aia-ps-cable-line" d="M 0 0" />
        </svg>

        <div className="nxr-aia-ps-cards">
          {PASOS.map((p, i) => (
            <div key={p.num} className="nxr-aia-paso">
              <span className="nxr-aia-paso-inner">
                <span className="nxr-aia-paso-num" style={{ color: p.color }}>
                  {p.num}
                </span>
                <span className="nxr-aia-paso-title">{p.title}</span>
                <span className="nxr-aia-paso-desc">{p.desc}</span>

                {i === 0 && (
                  <span className="nxr-aia-ps-mini">
                    {MINI_TOOLS.map((icon, k) => (
                      <span key={k} className="nxr-aia-ps-chip nxr-aia-ps-pop">
                        {icon}
                      </span>
                    ))}
                  </span>
                )}
                {i === 1 && (
                  <span className="nxr-aia-ps-mini nxr-aia-ps-mini-doc">
                    <span className="nxr-aia-ps-line" />
                    <span className="nxr-aia-ps-line" style={{ width: "82%" }} />
                    <span className="nxr-aia-ps-line" style={{ width: "64%" }} />
                    <span className="nxr-aia-ps-tag nxr-aia-ps-pop">
                      <svg viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Aprendido
                    </span>
                  </span>
                )}
                {i === 2 && (
                  <span className="nxr-aia-ps-mini">
                    <span className="nxr-aia-ps-tag nxr-aia-ps-pop">Web</span>
                    <span className="nxr-aia-ps-tag nxr-aia-ps-pop">WhatsApp</span>
                    <span className="nxr-aia-ps-tag nxr-aia-ps-pop">Instagram</span>
                    <span className="nxr-aia-ps-tag nxr-aia-ps-tag-live nxr-aia-ps-pop">
                      <i />
                      En línea
                    </span>
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
