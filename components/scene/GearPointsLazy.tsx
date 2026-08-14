"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Mismo trato que SceneCanvasLazy: el canvas de la nube se monta tras la
// hidratación, en el primer hueco de inactividad, para no meter WebGL en el
// camino del primer pintado. Su chunk además es pequeño — three ya viene
// cargado por el canvas global — pero la compilación del shader y la creación
// del contexto sí querrían el hilo principal, y ahí no los queremos.
const GearPointsCanvas = dynamic(() => import("./GearPointsCanvas"), { ssr: false });

export default function GearPointsLazy() {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setListo(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setListo(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  return listo ? <GearPointsCanvas /> : null;
}
