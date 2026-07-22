"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// Halo ambiental estilo "activación de Siri" para /agentes-ia: un overlay
// FIJO que abraza el borde del viewport con un marco fino de colores en
// movimiento. Se muestra mientras se reproduce la animación de entrada del
// hero y se retira al terminar, con un fade AUTOMÁTICO por tiempo (transición
// CSS) — NO scrubbeado por scroll (un flick rápido lo hacía aparecer/quitarse
// de golpe). El color/movimiento vive en CSS (rotación por transform de una
// capa cacheada — barato); el marco fino de esquinas internas redondeadas y
// difuminadas lo da una máscara SVG generada inline. Ver globals.css.
export default function AgentesIaGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion) return;
      const el = ref.current;
      if (!el) return;

      // Máscara de MARCO fino con esquinas internas REDONDEADAS y difuminadas.
      // Se genera como SVG inline (una máscara de gradientes lineales daba un
      // rectángulo interior de esquinas rectas; y el minificador de CSS de
      // producción rompe los stops de gradiente en máscara — por eso va inline
      // y por eso SVG). La máscara = rect blanco (todo visible) MENOS un rect
      // negro interior con `rx` (esquinas redondeadas) y feGaussianBlur (borde
      // interior suave). Banda fina; se recalcula al redimensionar.
      const buildFrameMask = () => {
        const W = Math.round(window.innerWidth);
        const H = Math.round(window.innerHeight);
        const mobile = W < 768;
        const band = mobile ? 10 : 12; // grosor del marco (muy fino)
        const r = mobile ? 26 : 40; // radio de las esquinas internas
        const soft = mobile ? 9 : 13; // difuminado del borde interior (glow suave)
        const iw = Math.max(0, W - 2 * band);
        const ih = Math.max(0, H - 2 * band);
        const svg =
          `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'>` +
          `<defs><filter id='s' x='-20%' y='-20%' width='140%' height='140%'>` +
          `<feGaussianBlur stdDeviation='${soft}'/></filter>` +
          `<mask id='m'><rect width='${W}' height='${H}' fill='white'/>` +
          `<rect x='${band}' y='${band}' width='${iw}' height='${ih}' rx='${r}' ry='${r}' fill='black' filter='url(#s)'/>` +
          `</mask></defs>` +
          `<rect width='${W}' height='${H}' fill='white' mask='url(#m)'/></svg>`;
        const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
        el.style.webkitMaskImage = url;
        el.style.maskImage = url;
        el.style.webkitMaskSize = "100% 100%";
        el.style.maskSize = "100% 100%";
        el.style.webkitMaskRepeat = "no-repeat";
        el.style.maskRepeat = "no-repeat";
      };
      buildFrameMask();
      window.addEventListener("resize", buildFrameMask, { passive: true });

      const triggers: ScrollTrigger[] = [];
      // DIFERIDO un frame: este componente monta ANTES que el hero, así que su
      // efecto corre primero; en el siguiente frame el pin del hero ya existe.
      const raf = requestAnimationFrame(() => {
        const hero = document.getElementById("nxr-aia-hero");
        if (!hero) return;
        // Fade AUTOMÁTICO y suave, decoupled del scroll: el ScrollTrigger solo
        // ENCIENDE/APAGA la clase `.nxr-aia-siri-on` según el PROGRESO del pin
        // del hero, y la transición CSS de opacidad hace el fundido por TIEMPO
        // (un flick rápido no lo muestra/oculta de golpe). La ventana [0.1,
        // 0.86] hace que NO aparezca al cargar la página (progreso 0): entra
        // cuando la animación de entrada del título ya ha arrancado (~10% del
        // pin) y se retira antes de que el hero despinee. onToggle fuerza el
        // apagado si se sale del rango de golpe (p. ej. un salto de scroll).
        const gate = (p: number) => el.classList.toggle("nxr-aia-siri-on", p > 0.1 && p < 0.86);
        const st = ScrollTrigger.create({
          trigger: hero,
          start: "top top",
          end: () => (window.innerWidth < 768 ? "+=460%" : "+=540%"),
          invalidateOnRefresh: true,
          onUpdate: (self) => gate(self.progress),
          onToggle: (self) => {
            if (!self.isActive) el.classList.remove("nxr-aia-siri-on");
          },
        });
        triggers.push(st);
        gate(st.progress);
      });
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", buildFrameMask);
        triggers.forEach((t) => t.kill());
      };
    },
    { dependencies: [reducedMotion] }
  );

  // Efecto puramente decorativo y en movimiento: en reduced-motion no se
  // monta (sin overlay fijo que animar, sin coste).
  if (reducedMotion) return null;

  // Una sola capa a propósito (perf): el halo se solapa con la parte MÁS
  // pesada de la página (el hero scrubbeado); una capa con giro rápido ya hace
  // fluir el color por el marco. Ver globals.css.
  return (
    <div className="nxr-aia-siri" aria-hidden="true" ref={ref}>
      <span className="nxr-aia-siri-layer" />
    </div>
  );
}
