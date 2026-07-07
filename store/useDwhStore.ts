import { create } from "zustand";

// Bridges the R3F scene (which drives this via a GSAP ScrollTrigger, not
// React state, for per-frame perf) with the DOM overlay label panel, which
// only needs to re-render on the ~4 discrete facet changes, not every frame.
type DwhStore = {
  activeFacet: number;
  setActiveFacet: (i: number) => void;
};

export const useDwhStore = create<DwhStore>((set) => ({
  activeFacet: 0,
  setActiveFacet: (i) => set((s) => (s.activeFacet === i ? s : { activeFacet: i })),
}));
