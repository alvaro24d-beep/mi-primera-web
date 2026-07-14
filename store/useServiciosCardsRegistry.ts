import { create } from "zustand";

export type CardStyle = {
  color: string;
  material: "glass" | "aluminum";
  curveX: number;
  curveY: number;
};

// Additional transform layered ON TOP OF the base scroll-tracked position
// (see CardSlot in ServiciosCardsLayer.tsx) — this is where the GSAP spiral
// entrance and physical hover-tilt (still driven from Servicios.tsx, same
// math as the HTML version, now writing here instead of a CSS transform)
// actually live. `scale` doubles as the entrance's grow-in-from-nothing
// visibility, avoiding a separate per-frame material-opacity uniform.
export type CardTransform = {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  scale: number;
  opacity: number;
};

// The slot holds the anchor ELEMENT, not a measured rect: CardSlot (in the
// R3F tree) calls getBoundingClientRect() on it INSIDE its own useFrame, so
// the mesh is positioned from the DOM's state in the very same frame it
// renders. Publishing pre-measured rects from a separate rAF loop (the
// previous design) meant the mesh could consume a one-frame-old position —
// during fast scrolling the glass visibly trailed/stretched relative to its
// text content.
type Slot = { anchor: HTMLElement | null; style: CardStyle; transform: CardTransform };

const MAX_CARDS = 5;

type Registry = {
  slots: Slot[];
  setAnchor: (id: number, anchor: HTMLElement | null) => void;
  setStyle: (id: number, style: CardStyle) => void;
  setTransform: (id: number, transform: CardTransform) => void;
  clear: (id: number) => void;
};

const defaultTransform = (): CardTransform => ({ x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, scale: 1, opacity: 1 });

const emptySlot = (): Slot => ({
  anchor: null,
  style: { color: "#0d1520", material: "glass", curveX: 0.06, curveY: 0 },
  transform: defaultTransform(),
});

// Bridge from Servicios.tsx (page tree, under app/layout.tsx's {children})
// to SceneCanvas.tsx (mounted as a sibling ABOVE {children} in the root
// layout) — the only way for the page component to tell the always-mounted
// global canvas where its cards should render. Read via `.getState()` only
// inside SceneCanvas's per-frame update (never the reactive `useServicios...()`
// hook form), so per-frame reads never trigger a React re-render.
export const useServiciosCardsRegistry = create<Registry>((set, get) => ({
  slots: Array.from({ length: MAX_CARDS }, emptySlot),
  setAnchor: (id, anchor) =>
    set((s) => {
      const slots = s.slots.slice();
      slots[id] = { ...slots[id], anchor };
      return { slots };
    }),
  setStyle: (id, style) =>
    set((s) => {
      const slots = s.slots.slice();
      slots[id] = { ...slots[id], style };
      return { slots };
    }),
  // Hot path (written every frame from GSAP ticks AND the idle drift, for
  // all five cards): a plain in-place mutation, NOT a zustand set(). Nothing
  // subscribes reactively to transforms — the only consumer is CardSlot's
  // useFrame reading via getState() — so immutable array copies here were
  // pure per-frame garbage-collector churn.
  setTransform: (id, transform) => {
    const slot = get().slots[id];
    if (slot) slot.transform = transform;
  },
  clear: (id) =>
    set((s) => {
      const slots = s.slots.slice();
      slots[id] = emptySlot();
      return { slots };
    }),
}));
