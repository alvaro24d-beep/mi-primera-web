import { create } from "zustand";

export type DisturbancePoint = { x: number; y: number; strength: number };

// Fixed-size slot per Servicios card (5 cards today) so the WaveBackground
// shader can read a constant-size uniform array every frame instead of a
// variable-length list — bounds the shader cost regardless of hover count.
const MAX_POINTS = 5;

type CardDisturbanceStore = {
  points: (DisturbancePoint | null)[];
  setPoint: (id: number, x: number, y: number, strength: number) => void;
  clearPoint: (id: number) => void;
};

// Read via `useCardDisturbance.getState()` from WaveBackground.tsx's existing
// rAF loop and written via the same from Servicios.tsx's mousemove handler —
// never through the reactive `useCardDisturbance()` hook form on either side,
// so these updates never trigger a React re-render (matches the "no reflows"
// requirement: this is a plain shared mutable-ish object, GSAP/rAF read it
// directly, same DOM↔canvas bridge pattern already established by
// `useDwhStore.ts`).
export const useCardDisturbance = create<CardDisturbanceStore>((set) => ({
  points: new Array(MAX_POINTS).fill(null),
  setPoint: (id, x, y, strength) =>
    set((s) => {
      const points = s.points.slice();
      points[id] = { x, y, strength };
      return { points };
    }),
  clearPoint: (id) =>
    set((s) => {
      const points = s.points.slice();
      points[id] = null;
      return { points };
    }),
}));
