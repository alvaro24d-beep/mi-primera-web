"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// Halo ambiental estilo "activación de Siri" para /agentes-ia: un overlay
// FIJO que abraza el borde del viewport con colores difuminados en
// movimiento. Aparece cuando la animación de entrada del hero SALE — no toca
// el timeline del hero (que está afinado); en su lugar dos ScrollTriggers
// autónomos suben `--siri-in` conforme la sección siguiente (#nxr-aia-noche)
// entra por abajo, y bajan `--siri-out` al llegar a Contacto, para que el
// halo aparezca y se retire de forma suave. El color/movimiento vive en CSS
// (rotación por transform de una capa ya difuminada — barato para el
// compositor, sin invalidar el canvas WebGL global). Ver globals.css,
// sección "Siri ambient edge glow".
export default function AgentesIaGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion) return;
      const el = ref.current;
      if (!el) return;
      const setVar = (name: string, v: number) => el.style.setProperty(name, String(v));
      setVar("--siri-op", 0);

      // Máscara elíptica INLINE (no en globals.css) a propósito: el minificador
      // de CSS del build de producción colapsa la posición del stop a `0px`
      // en máscaras radiales de tamaño ≥100% (deja de recortar el centro y el
      // color lava toda la pantalla) — un estilo inline nunca pasa por el
      // minificador. Radio alto + centro transparente amplio ⇒ el color queda
      // CONFINADO al borde. Móvil (vertical) usa una elipse más cerrada.
      const applyMask = () => {
        const m =
          window.innerWidth < 768
            ? "radial-gradient(62% 74% at 50% 50%, rgba(0,0,0,0) 78%, #000 100%)"
            : "radial-gradient(122% 122% at 50% 50%, rgba(0,0,0,0) 68%, #000 100%)";
        el.style.webkitMask = m;
        el.style.mask = m;
      };
      applyMask();
      window.addEventListener("resize", applyMask, { passive: true });

      const triggers: ScrollTrigger[] = [];
      // DIFERIDO un frame: este componente monta ANTES que el hero, así que su
      // efecto corre primero; en el siguiente frame el pin del hero ya existe
      // y cualquier refresh cae con las posiciones buenas.
      const raf = requestAnimationFrame(() => {
        const hero = document.getElementById("nxr-aia-hero");
        if (!hero) return;
        // El halo vive SOLO durante la animación de entrada del hero y se
        // quita al terminar. Se engancha al MISMO rango de scroll que el pin
        // del hero (mismo start/end que su ScrollTrigger, ver AgentesIaHero),
        // así el progreso coincide con el de la animación: aparece rápido al
        // empezar a scrollear y se desvanece cuando la gestión ya está
        // resuelta (~90% del pin), antes de que el hero despinee.
        triggers.push(
          ScrollTrigger.create({
            trigger: hero,
            start: "top top",
            end: () => (window.innerWidth < 768 ? "+=460%" : "+=540%"),
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const p = self.progress;
              const appear = Math.min(1, p / 0.04); // entra en el primer 4%
              const leave = Math.min(1, Math.max(0, (0.9 - p) / 0.12)); // sale 78%→90%
              setVar("--siri-op", Math.min(appear, leave));
            },
          })
        );
      });
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", applyMask);
        triggers.forEach((t) => t.kill());
      };
    },
    { dependencies: [reducedMotion] }
  );

  // Efecto puramente decorativo y en movimiento: en reduced-motion no se
  // monta (sin overlay fijo que animar, sin coste).
  if (reducedMotion) return null;

  // Una sola capa a propósito: el halo se solapa con la parte MÁS pesada de la
  // página (el hero scrubbeado). Una segunda capa difuminada duplicaba el
  // blend fullscreen por frame y costaba ~4 fps ahí; una capa con giro +
  // respiración ya hace fluir el color por el borde. Ver globals.css.
  return (
    <div className="nxr-aia-siri" aria-hidden="true" ref={ref}>
      <span className="nxr-aia-siri-layer" />
    </div>
  );
}
