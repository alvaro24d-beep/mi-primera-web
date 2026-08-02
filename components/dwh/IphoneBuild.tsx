"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// ===== iPhone Build — "tu web se escribe línea a línea" =====
// Port del CinematicHero que pasó Álvaro ("exactamente este iphone, con esa
// animación de scroll y todo"), adaptado a las convenciones del proyecto:
//  - Tailwind → clases nxr-ip-* en globals.css (sección comentada).
//  - La coreografía de scroll se conserva ENTERA: títulos que se difuminan,
//    card que vuela desde abajo y se expande a pantalla completa, iPhone
//    entrando desde profundidad 3D (z -500, rotaciones), badges con
//    back.out, hold, salida, pullback de la card y CTA final revelado al
//    volar la card hacia arriba.
//  - El CONTENIDO cambia a lo pedido: la pantalla del móvil arranca vacía y
//    se va completando como una web moderna (nav → hero → cards → stats →
//    footer) mientras en el panel lateral SE ESCRIBE EL CÓDIGO de cada
//    bloque — typewriter por caracteres con el mecanismo .nxr-zp-tw ya
//    probado (visibility por carácter sobre layout pre-renderizado, cero
//    reflow), cada trozo de código sincronizado con la pieza que aparece
//    en el teléfono. El anillo+contador del original vive ahora en el
//    badge de "Performance" (0→100, guiño Lighthouse).
//  - GSAP + pin SIEMPRE en el árbol DOM normal (AGENTS.md) — aquí no hay
//    canvas: la sección es DOM puro, como MacbookBuild. Sin meshes, así
//    que nxr-dwh-iphone NO va en alwaysIds.
//  - Tilt del móvil con el ratón (desktop) + luz del sheen de la card,
//    ambos rAF-coalesced y solo mientras la sección está pineada.

const CHUNKS = ["nav", "hero", "cards", "stats", "footer"] as const;

export default function IphoneBuild() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const pinActiveRef = useRef(false);
  const rafRef = useRef(0);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const section = sectionRef.current;
      const stage = stageRef.current;
      const card = cardRef.current;
      if (prefersReduced || !section || !stage || !card) return;

      const q = gsap.utils.selector(section);
      const isMobile = window.innerWidth < 768;

      // ---- Typewriter: envolver cada carácter del código en un span
      // .nxr-zp-tw (mismo mecanismo del hero/ZP: visibility por carácter,
      // el layout ya está renderizado — cero reflow al "escribir"). Los
      // colores de sintaxis los heredan del span de token padre.
      const codeBody = q(".nxr-ip-code-body")[0] as HTMLElement | undefined;
      if (!codeBody) return;
      if (!codeBody.querySelector(".nxr-zp-tw")) {
        const walker = document.createTreeWalker(codeBody, NodeFilter.SHOW_TEXT);
        const textNodes: Text[] = [];
        for (let n = walker.nextNode(); n; n = walker.nextNode()) textNodes.push(n as Text);
        textNodes.forEach((node) => {
          const text = node.textContent ?? "";
          if (!text.trim()) return;
          const frag = document.createDocumentFragment();
          for (const ch of text) {
            if (ch === " " || ch === "\n") {
              frag.appendChild(document.createTextNode(ch));
            } else {
              const s = document.createElement("span");
              s.className = "nxr-zp-tw";
              s.textContent = ch;
              frag.appendChild(s);
            }
          }
          node.replaceWith(frag);
        });
      }
      const allChars = Array.from(codeBody.querySelectorAll<HTMLElement>(".nxr-zp-tw"));
      const chunkCounts = CHUNKS.map(
        (key) => codeBody.querySelectorAll(`.nxr-ip-chunk[data-chunk="${key}"] .nxr-zp-tw`).length
      );
      const caret = document.createElement("span");
      caret.className = "nxr-zp-twcaret";
      caret.setAttribute("aria-hidden", "true");
      let twShown = -1;
      const twProxy = { n: 0 };
      const updateTw = () => {
        const k = Math.round(twProxy.n);
        if (k === twShown) return;
        twShown = k;
        allChars.forEach((c, i) => c.classList.toggle("nxr-zp-tw-on", i < k));
        if (k > 0 && k < allChars.length) {
          allChars[k - 1].insertAdjacentElement("afterend", caret);
        } else {
          caret.remove();
        }
      };

      // ---- Estados iniciales (equivalen a los gsap.set del original). El
      // CSS mantiene .nxr-ip-boot en visibility:hidden hasta aquí para que
      // nada flashee en el primer paint pre-hidratación.
      gsap.set(card, { y: () => window.innerHeight + 200, autoAlpha: 1 });
      gsap.set(q(".nxr-ip-cta"), { autoAlpha: 0, scale: 0.8, filter: "blur(30px)" });
      gsap.set(q(".nxr-ip-phonescale, .nxr-ip-code, .nxr-ip-claim, .nxr-ip-badge"), { autoAlpha: 0 });
      gsap.set(q(".nxr-ip-w-nav, .nxr-ip-w-hero, .nxr-ip-w-cards, .nxr-ip-w-stats, .nxr-ip-w-footer"), {
        autoAlpha: 0,
      });
      const ringVal = q(".nxr-ip-ring-val")[0] as HTMLElement | undefined;
      if (ringVal) ringVal.textContent = "0";
      gsap.set(section, { visibility: "visible" });

      // Entrada de los títulos al llegar la sección (no scrubbed — el
      // original la hacía al cargar; aquí la sección vive a mitad de página).
      gsap.fromTo(
        q(".nxr-ip-t1, .nxr-ip-t2"),
        { autoAlpha: 0, y: 50, filter: "blur(14px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          stagger: 0.15,
          ease: "expo.out",
          scrollTrigger: { trigger: section, start: "top 75%", toggleActions: "play none none none" },
        }
      );

      // ---- La timeline cinematográfica pineada (port 1:1 de la estructura
      // del original; el tramo central de widgets se sustituye por el ciclo
      // código ↔ web). invalidateOnRefresh para que los valores función
      // (innerHeight) se recalculen en refresh.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => (window.innerWidth < 768 ? "+=5000" : "+=7000"),
          pin: stage,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            pinActiveRef.current = self.isActive;
          },
        },
      });

      tl.to(q(".nxr-ip-titles, .nxr-ip-grid"), { scale: 1.15, filter: "blur(20px)", opacity: 0.15, ease: "power2.inOut", duration: 2 }, 0)
        .to(card, { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(card, { width: "100vw", height: "100lvh", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        .fromTo(
          q(".nxr-ip-phonescale"),
          { y: 300, z: -500, rotationX: 50, rotationY: -30, autoAlpha: 0, scale: 0.6, transformPerspective: 1000 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 2.5 },
          "-=0.8"
        )
        .fromTo(q(".nxr-ip-code"), { x: isMobile ? 0 : -60, y: isMobile ? 40 : 0, autoAlpha: 0 }, { x: 0, y: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 }, "-=1.6")
        .fromTo(q(".nxr-ip-claim"), { x: isMobile ? 0 : 60, y: isMobile ? -30 : 0, autoAlpha: 0, scale: 0.9 }, { x: 0, y: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.5 }, "<");

      // ---- Ciclo código ↔ pantalla: por cada bloque, su código se escribe
      // (proxy a ritmo constante) y la pieza correspondiente de la web
      // aparece en el móvil solapada con el final de la escritura.
      let cum = 0;
      CHUNKS.forEach((key, i) => {
        cum += chunkCounts[i];
        tl.to(twProxy, { n: cum, duration: 2, ease: "none", onUpdate: updateTw });
        if (key === "nav") {
          tl.fromTo(q(".nxr-ip-w-nav"), { y: -14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: "power2.out", duration: 0.7 }, "-=0.5");
        } else if (key === "hero") {
          tl.fromTo(
            q(".nxr-ip-w-hero"),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.3 },
            "-=0.7"
          ).fromTo(
            q(".nxr-ip-w-hero > *"),
            { y: 18, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, stagger: 0.14, ease: "power3.out", duration: 0.7 },
            "<"
          );
        } else if (key === "cards") {
          tl.fromTo(
            q(".nxr-ip-w-cards"),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.3 },
            "-=0.7"
          )
            .fromTo(
              q(".nxr-ip-w-card"),
              { y: 24, scale: 0.94, autoAlpha: 0 },
              { y: 0, scale: 1, autoAlpha: 1, stagger: 0.16, ease: "back.out(1.4)", duration: 0.8 },
              "<"
            )
            // Primer badge flotante — mismo beat back.out del original.
            .fromTo(
              q(".nxr-ip-badge-resp"),
              { y: 100, autoAlpha: 0, scale: 0.7, rotationZ: -10 },
              { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: "back.out(1.5)", duration: 1.2 },
              "-=0.4"
            );
        } else if (key === "stats") {
          tl.fromTo(q(".nxr-ip-w-stats"), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: "power3.out", duration: 0.7 }, "-=0.5")
            // Badge con el anillo de "Performance": el beat del progress
            // ring + contador del original, reconvertido a guiño Lighthouse.
            .fromTo(
              q(".nxr-ip-badge-perf"),
              { y: 100, autoAlpha: 0, scale: 0.7, rotationZ: 8 },
              { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: "back.out(1.5)", duration: 1.2 },
              "-=0.4"
            )
            .to(q(".nxr-ip-ring"), { strokeDashoffset: 8, duration: 1.6, ease: "power3.inOut" }, "-=0.8")
            .to(ringVal ?? {}, { innerHTML: 100, snap: { innerHTML: 1 }, duration: 1.6, ease: "expo.out" }, "<");
        } else {
          tl.fromTo(q(".nxr-ip-w-footer"), { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: "power2.out", duration: 0.6 }, "-=0.5");
        }
      });

      // ---- Hold de lectura, salida, pullback y CTA (port 1:1 del final).
      tl.to({}, { duration: 2.5 })
        .set(q(".nxr-ip-titles"), { autoAlpha: 0 })
        .set(q(".nxr-ip-cta"), { autoAlpha: 1 })
        .to({}, { duration: 1.5 })
        .to(q(".nxr-ip-phonescale, .nxr-ip-code, .nxr-ip-claim, .nxr-ip-badge"), {
          scale: 0.9,
          y: -40,
          z: -200,
          autoAlpha: 0,
          ease: "power3.in",
          duration: 1.2,
          stagger: 0.05,
        })
        .addLabel("pullback")
        .to(
          card,
          {
            width: isMobile ? "92vw" : "85vw",
            height: isMobile ? "88svh" : "85vh",
            borderRadius: isMobile ? "32px" : "40px",
            ease: "expo.inOut",
            duration: 1.8,
          },
          "pullback"
        )
        .to(q(".nxr-ip-cta"), { scale: 1, filter: "blur(0px)", ease: "expo.inOut", duration: 1.8 }, "pullback")
        .to(card, { y: () => -(window.innerHeight + 300), ease: "power3.in", duration: 1.5 });

      // ---- Tilt del iPhone + luz del sheen con el ratón (desktop, solo
      // mientras la sección está pineada) — rAF-coalesced como el original.
      const onMove = (e: MouseEvent) => {
        if (!pinActiveRef.current || window.innerWidth < 1024) return;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          const phone = phoneRef.current;
          const c = cardRef.current;
          if (!phone || !c) return;
          const rect = c.getBoundingClientRect();
          c.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
          c.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(phone, { rotationY: xVal * 12, rotationX: -yVal * 12, ease: "power3.out", duration: 1.2 });
        });
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      return () => {
        window.removeEventListener("mousemove", onMove);
        cancelAnimationFrame(rafRef.current);
      };
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  const goContacto = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("nxr-contacto");
    if (target) window.__nxrLenis?.scrollTo(target, { duration: 1.4 });
  };

  return (
    <section id="nxr-dwh-iphone" ref={sectionRef} className={reducedMotion ? "nxr-ip nxr-ip-static" : "nxr-ip"}>
      <div className="nxr-ip-stage" ref={stageRef}>
        <div className="nxr-ip-grain" aria-hidden="true" />
        <div className="nxr-ip-grid" aria-hidden="true" />

        {/* Capa de fondo 1: títulos (fase previa a la card) */}
        <div className="nxr-ip-titles">
          <h2 className="nxr-ip-t1">Tu web se escribe</h2>
          <h2 className="nxr-ip-t2">línea a línea.</h2>
        </div>

        {/* Capa de fondo 2: CTA final (se descubre al irse la card) */}
        <div className="nxr-ip-cta">
          <h2 className="nxr-ip-cta-title">¿Construimos la tuya?</h2>
          <p className="nxr-ip-cta-desc">
            Diseño, código y contenido a medida — sin plantillas. Cuéntanos tu proyecto y te enseñamos cómo se vería.
          </p>
          <a href="#nxr-contacto" className="nxr-ip-cta-btn" onClick={goContacto}>
            Empezar proyecto
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Capa frontal: la card física profunda */}
        <div className="nxr-ip-cardwrap">
          <div className="nxr-ip-card nxr-ip-boot" ref={cardRef}>
            <div className="nxr-ip-sheen" aria-hidden="true" />
            <div className="nxr-ip-cardgrid">
              {/* Panel de código: se escribe mientras la web toma forma */}
              <div className="nxr-ip-code">
                <div className="nxr-ip-code-head">
                  <span className="nxr-ip-dot r" />
                  <span className="nxr-ip-dot y" />
                  <span className="nxr-ip-dot g" />
                  <span className="nxr-ip-code-file">tu-web.tsx</span>
                </div>
                <pre className="nxr-ip-code-body" aria-hidden="true">
                  <span className="nxr-ip-chunk" data-chunk="nav">
                    <span className="tok-c">{"// tu-web.tsx — hecho a mano\n"}</span>
                    <span className="tok-t">{"<Nav"}</span> <span className="tok-a">logo</span>=<span className="tok-s">&quot;TuMarca&quot;</span>
                    {"\n  "}
                    <span className="tok-a">links</span>={"{"}
                    <span className="tok-s">[&quot;Carta&quot;, &quot;Reservas&quot;]</span>
                    {"}"} <span className="tok-t">{"/>"}</span>
                    {"\n\n"}
                  </span>
                  <span className="nxr-ip-chunk" data-chunk="hero">
                    <span className="tok-t">{"<Hero>"}</span>
                    {"\n  "}
                    <span className="tok-t">{"<h1>"}</span>Reserva tu mesa<span className="tok-t">{"</h1>"}</span>
                    {"\n  "}
                    <span className="tok-t">{"<Boton>"}</span>Ver la carta<span className="tok-t">{"</Boton>"}</span>
                    {"\n"}
                    <span className="tok-t">{"</Hero>"}</span>
                    {"\n\n"}
                  </span>
                  <span className="nxr-ip-chunk" data-chunk="cards">
                    <span className="tok-t">{"<Servicios>"}</span>
                    {"\n  "}
                    <span className="tok-t">{"<Card"}</span> <span className="tok-a">titulo</span>=<span className="tok-s">&quot;Reservas online&quot;</span> <span className="tok-t">{"/>"}</span>
                    {"\n  "}
                    <span className="tok-t">{"<Card"}</span> <span className="tok-a">titulo</span>=<span className="tok-s">&quot;Pedidos a domicilio&quot;</span> <span className="tok-t">{"/>"}</span>
                    {"\n"}
                    <span className="tok-t">{"</Servicios>"}</span>
                    {"\n\n"}
                  </span>
                  <span className="nxr-ip-chunk" data-chunk="stats">
                    <span className="tok-t">{"<Stats"}</span> <span className="tok-a">reservas</span>=<span className="tok-s">&quot;+120%&quot;</span> <span className="tok-a">resenas</span>=<span className="tok-s">&quot;4.9★&quot;</span> <span className="tok-t">{"/>"}</span>
                    {"\n\n"}
                  </span>
                  <span className="nxr-ip-chunk" data-chunk="footer">
                    <span className="tok-t">{"<Footer"}</span> <span className="tok-a">theme</span>=<span className="tok-s">&quot;dark&quot;</span> <span className="tok-t">{"/>"}</span>
                    {"\n"}
                    <span className="tok-c">{"// lista para vender ✓"}</span>
                  </span>
                </pre>
              </div>

              {/* El iPhone (hardware calcado del original) */}
              <div className="nxr-ip-phonezone">
                {/* phonescale = objetivo de GSAP (entrada 3D/salida);
                    phoneinner = escala CSS estática por breakpoint — mismo
                    reparto que el original para que no se pisen el transform. */}
                <div className="nxr-ip-phonescale">
                  <div className="nxr-ip-phoneinner">
                  <div className="nxr-ip-bezel" ref={phoneRef}>
                    <div className="nxr-ip-hwbtn b1" aria-hidden="true" />
                    <div className="nxr-ip-hwbtn b2" aria-hidden="true" />
                    <div className="nxr-ip-hwbtn b3" aria-hidden="true" />
                    <div className="nxr-ip-hwbtn br" aria-hidden="true" />
                    <div className="nxr-ip-screen">
                      <div className="nxr-ip-glare" aria-hidden="true" />
                      <div className="nxr-ip-island" aria-hidden="true">
                        <span className="nxr-ip-island-led" />
                      </div>
                      {/* La web moderna que se va construyendo */}
                      <div className="nxr-ip-web">
                        <div className="nxr-ip-w-nav">
                          <span className="nxr-ip-w-logo">
                            <span className="nxr-ip-w-logodot" />
                            TuMarca
                          </span>
                          <span className="nxr-ip-w-burger" aria-hidden="true">
                            <i />
                            <i />
                          </span>
                        </div>
                        <div className="nxr-ip-w-hero">
                          <h4>Reserva tu mesa en 10 segundos</h4>
                          <p>Cocina de mercado en el centro de Madrid.</p>
                          <span className="nxr-ip-w-cta">Ver la carta</span>
                        </div>
                        <div className="nxr-ip-w-cards">
                          <div className="nxr-ip-w-card">
                            <span className="nxr-ip-w-cardico lime">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <rect x="3" y="4" width="18" height="17" rx="3" />
                                <path d="M3 9h18M8 2v4M16 2v4" />
                              </svg>
                            </span>
                            <div className="nxr-ip-w-cardtxt">
                              <b>Reservas online</b>
                              <i />
                            </div>
                          </div>
                          <div className="nxr-ip-w-card">
                            <span className="nxr-ip-w-cardico salmon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M8 12l3 3 5-6" />
                              </svg>
                            </span>
                            <div className="nxr-ip-w-cardtxt">
                              <b>Pedidos a domicilio</b>
                              <i />
                            </div>
                          </div>
                        </div>
                        <div className="nxr-ip-w-stats">
                          <div>
                            <b>+120%</b>
                            <span>reservas</span>
                          </div>
                          <div>
                            <b>4.9★</b>
                            <span>reseñas</span>
                          </div>
                          <div>
                            <b>24/7</b>
                            <span>abierta</span>
                          </div>
                        </div>
                        <div className="nxr-ip-w-footer">© TuMarca — hecha por Nexora</div>
                        <div className="nxr-ip-homebar" aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  {/* Badges flotantes de cristal (beats del original) */}
                  <div className="nxr-ip-badge nxr-ip-badge-resp">
                    <span className="nxr-ip-badge-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="2" y="4" width="13" height="10" rx="2" />
                        <rect x="16" y="8" width="6" height="12" rx="2" />
                      </svg>
                    </span>
                    <span>
                      <b>Responsive</b>
                      <i>Móvil · Tablet · Desktop</i>
                    </span>
                  </div>
                  <div className="nxr-ip-badge nxr-ip-badge-perf">
                    <span className="nxr-ip-ringwrap">
                      <svg viewBox="0 0 60 60" aria-hidden="true">
                        <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                        <circle className="nxr-ip-ring" cx="30" cy="30" r="26" fill="none" stroke="var(--c-lime)" strokeWidth="5" />
                      </svg>
                      <b className="nxr-ip-ring-val">100</b>
                    </span>
                    <span>
                      <b>Performance</b>
                      <i>Carga al instante</i>
                    </span>
                  </div>
                  </div>
                </div>
              </div>

              {/* Claim lateral (columna derecha en desktop) */}
              <div className="nxr-ip-claim">
                <h3>
                  Código real,
                  <br />
                  <span className="nxr-gradient-text-lime">en directo.</span>
                </h3>
                <p>
                  Nada de plantillas: cada sección de tu web nace de código escrito a medida. Lo que ves construirse en
                  esta pantalla es exactamente cómo trabajamos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
