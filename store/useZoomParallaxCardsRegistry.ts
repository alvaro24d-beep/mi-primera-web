import { create } from "zustand";

// Bridge from ZoomParallax.tsx (page tree, under app/layout.tsx's {children})
// to the global SceneCanvas (root-layout tree, above {children}) — same
// cross-tree pattern as store/useServiciosCardsRegistry.ts, but leaner: this
// only carries each card's DOM anchor (`.nxr-zp-img`). Everything the mesh
// needs each frame — on-screen centre and size — is read straight off that
// anchor's getBoundingClientRect() inside ZoomParallaxCardsLayer's useFrame
// (same-frame reads, no stale-position trailing), and the per-card visual
// style is a module constant next to the layer, so it never needs plumbing.
const MAX_CARDS = 7;

type Registry = {
  anchors: (HTMLElement | null)[];
  setAnchor: (id: number, anchor: HTMLElement | null) => void;
  clearAll: () => void;
};

export const useZoomParallaxCardsRegistry = create<Registry>((set) => ({
  anchors: Array.from({ length: MAX_CARDS }, () => null),
  setAnchor: (id, anchor) =>
    set((s) => {
      const anchors = s.anchors.slice();
      anchors[id] = anchor;
      return { anchors };
    }),
  clearAll: () => set({ anchors: Array.from({ length: MAX_CARDS }, () => null) }),
}));

export const ZP_MAX_CARDS = MAX_CARDS;
