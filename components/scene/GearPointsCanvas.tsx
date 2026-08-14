"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import PixelCamera, { CAMERA_DISTANCE } from "./PixelCamera";
import GearPoints from "./GearPoints";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// ===== Canvas PROPIO para la nube de puntos (V17.88) =====
// La nube vivía dentro del canvas global y eso la ataba a dos límites que no
// son suyos:
//
//  · FLUIDEZ. Ese canvas dibuja el muro (un shader de ~300 líneas a pantalla
//    completa) más Bloom y Vignette. Al mover el ratón había que invalidarlo
//    para que la repulsión respondiera... y eso repinta TODO: la interacción
//    iba al ritmo del muro, no al de los puntos, que cuestan menos de 1ms.
//  · DEFINICIÓN. Ese canvas corre a dpr 1.25 en escritorio y 1 en móvil, y es
//    deliberado: subirlo encarece el muro, que es lo caro. Pero a dpr 1 sobre
//    una pantalla de dpr 3, cada punto se rasteriza a un tercio de resolución
//    y la pantalla lo estira — de ahí que se vieran "en baja resolución" por
//    mucho que se cambiara el fragment.
//
// Con canvas propio, los puntos van a dpr 2 y a 60fps sin arrastrar al muro, y
// el muro deja de repintarse cada vez que el ratón se mueve: la carga total
// BAJA respecto a tenerlos juntos. El precio es un segundo contexto WebGL, que
// aquí solo dibuja 9.000 puntos con un shader de 20 líneas — sin texturas, sin
// postprocesado y sin capturas de transmisión.
//
// z-index -999: por delante del muro (-1000) y por detrás de todo el contenido.
export default function GearPointsCanvas() {
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  // Pestaña oculta = ni un frame. La nube se anima sola (los puntos respiran),
  // así que sin esto seguiría dibujando para nadie.
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100lvh",
        zIndex: -999,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <Canvas
        // "always" mientras se vea: los puntos tienen vida propia y la estela
        // se recompone sola, así que hay algo que dibujar en cada frame. Es
        // asumible justamente porque este canvas no tiene nada más dentro.
        frameloop={visible && !reducedMotion ? "always" : "demand"}
        // dpr 2 — aquí sí. Es lo que hace que el punto se vea DEFINIDO en vez
        // de como una mancha estirada, y sobre 9.000 puntos el coste de
        // duplicar la resolución es despreciable.
        dpr={[1, 2]}
        camera={{ position: [0, 0, CAMERA_DISTANCE], fov: 50, near: 1, far: CAMERA_DISTANCE * 3 }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
      >
        <PixelCamera />
        <GearPoints isMobile={isMobile} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
