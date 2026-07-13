import { create } from "zustand";

export type GlassPanelStyle = {
  color: string;
  /** Corner radius in px (match the DOM card's border-radius). */
  radius: number;
};

export type GlassPanel = {
  id: number;
  anchor: HTMLElement;
  style: GlassPanelStyle;
  /** Layout size the geometry is built at (kept fresh by a ResizeObserver in
     useGlassPanels). Per-frame size differences are handled by SCALING the
     mesh, never by rebuilding — see GlassPanelsLayer. */
  width: number;
  height: number;
  /** id of the hosting <section> — checked against store/sceneActivity.ts'
     nearSections each frame so far-away panels skip all DOM reads. */
  sectionId: string | null;
  /** LIVE CSSStyleDeclarations for the anchor + up to 3 ancestors, captured
     once at registration (getComputedStyle returns a live view, so reading
     .opacity per frame stays current WITHOUT re-resolving the element each
     frame — the per-frame getComputedStyle calls were measurable). */
  styles: CSSStyleDeclaration[];
};

type Registry = {
  panels: GlassPanel[];
  add: (
    anchor: HTMLElement,
    style: GlassPanelStyle,
    width: number,
    height: number,
    sectionId: string | null,
    styles: CSSStyleDeclaration[]
  ) => number;
  updateDims: (id: number, width: number, height: number) => void;
  remove: (id: number) => void;
};

let nextId = 1;

// Generic DOM→WebGL bridge for the site-wide flat fluid-glass cards (Intro,
// Proceso, Contacto — NOT Servicios/ZoomParallax, which keep their own
// specialized registries with per-frame transforms). Registration, dims
// updates and removal are all RARE (mount/unmount, ResizeObserver events), so
// plain reactive zustand state is fine — the hot per-frame rect reads happen
// in GlassPanelsLayer via the anchor elements themselves.
//
// Dims live HERE (captured at registration + refreshed by ResizeObserver)
// instead of in per-slot React state set from useFrame: a setState issued
// inside the R3F frame loop proved to get silently dropped for these slots
// (the mesh stayed at its default size while a ref-based gate prevented any
// retry). Zustand set() → layer re-render → geometry rebuild is deterministic.
export const useGlassPanelsRegistry = create<Registry>((set) => ({
  panels: [],
  add: (anchor, style, width, height, sectionId, styles) => {
    const id = nextId++;
    set((s) => ({ panels: [...s.panels, { id, anchor, style, width, height, sectionId, styles }] }));
    return id;
  },
  updateDims: (id, width, height) =>
    set((s) => ({
      panels: s.panels.map((p) => (p.id === id ? { ...p, width, height } : p)),
    })),
  remove: (id) => set((s) => ({ panels: s.panels.filter((p) => p.id !== id) })),
}));
