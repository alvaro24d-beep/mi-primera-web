"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import TargetCursor from "@/components/TargetCursor";

const noopSubscribe = () => () => {};

// Montaje del cursor personalizado (TargetCursor de React Bits, adaptado):
// - Gate `mounted`: TargetCursor decide isMobile leyendo window, así que
//   renderizarlo en SSR daría mismatch de hidratación; hasta el primer efecto
//   no se pinta nada (el cursor nativo sigue ahí, sin flash).
// - reduced-motion: no se monta (el cursor nativo queda intacto) — un cursor
//   girando permanente es justo lo que ese ajuste pide evitar.
// - Targets: los interactivos reales del sitio (enlaces y botones), sin tener
//   que ir añadiendo clases por componente.
// - spinDuration 6: giro lento y elegante (el default 2s distraía).
export default function CursorFx() {
  const reducedMotion = useReducedMotion();
  // false en SSR/primera hidratación, true en cliente — mismo patrón que
  // useReducedMotion (useSyncExternalStore), sin setState-en-efecto.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
  if (!mounted || reducedMotion) return null;
  return <TargetCursor targetSelector="a, button, [role='button']" spinDuration={6} />;
}
