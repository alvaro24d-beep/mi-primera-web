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
      setVar("--siri-in", 0);
      setVar("--siri-out", 1);

      const triggers: ScrollTrigger[] = [];
      // DIFERIDO un frame a propósito: este componente se monta ANTES que el
      // hero, así que su efecto corre primero — si creáramos los triggers
      // aquí, sus start/end se calcularían contra un documento SIN el
      // pin-spacer del hero (que añade ~540% de alto), dejando a Noche y
      // Contacto en posiciones obsoletas (el fade-out saltaría durante el
      // propio hero). En el siguiente frame el pin-spacer ya existe y las
      // posiciones salen correctas; GSAP mantiene el resto sincronizado en
      // cada refresh.
      const raf = requestAnimationFrame(() => {
        const noche = document.getElementById("nxr-aia-noche");
        const contacto = document.getElementById("nxr-contacto");
        // Aparición: la sección posterior al hero subiendo desde abajo ES la
        // animación de entrada saliendo (el hero está pineado, así que Noche
        // solo asoma cuando el pin se completa).
        if (noche) {
          triggers.push(
            ScrollTrigger.create({
              trigger: noche,
              start: "top 92%",
              end: "top 45%",
              onUpdate: (self) => setVar("--siri-in", self.progress),
            })
          );
        }
        // Retirada suave al final del recorrido de Agentes IA.
        if (contacto) {
          triggers.push(
            ScrollTrigger.create({
              trigger: contacto,
              start: "top 55%",
              end: "top top",
              onUpdate: (self) => setVar("--siri-out", 1 - self.progress),
            })
          );
        }
      });
      return () => {
        cancelAnimationFrame(raf);
        triggers.forEach((t) => t.kill());
      };
    },
    { dependencies: [reducedMotion] }
  );

  // Efecto puramente decorativo y en movimiento: en reduced-motion no se
  // monta (sin overlay fijo que animar, sin coste).
  if (reducedMotion) return null;

  return (
    <div className="nxr-aia-siri" aria-hidden="true" ref={ref}>
      <span className="nxr-aia-siri-layer" />
      <span className="nxr-aia-siri-layer nxr-aia-siri-layer-b" />
    </div>
  );
}
