import { create } from "zustand";

export type CardRect = { x: number; y: number; width: number; height: number };

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
};

type Slot = { rect: CardRect | null; style: CardStyle; transform: CardTransform };

const MAX_CARDS = 5;

type Registry = {
  slots: Slot[];
  setRect: (id: number, rect: CardRect) => void;
  setStyle: (id: number, style: CardStyle) => void;
  setTransform: (id: number, transform: CardTransform) => void;
  clear: (id: number) => void;
};

const defaultTransform = (): CardTransform => ({ x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, scale: 1 });

const emptySlot = (): Slot => ({
  rect: null,
  style: { color: "#0d1520", material: "glass", curveX: 0.06, curveY: 0 },
  transform: defaultTransform(),
});

// Bridge from Servicios.tsx (page tree, under app/layout.tsx's {children})
// to SceneCanvas.tsx (mounted as a sibling ABOVE {children} in the root
// layout) — the only way for the page component to tell the always-mounted
// global canvas where its cards should render. Read via `.getState()` only
// inside SceneCanvas's per-frame update (never the reactive `useServicios...()`
// hook form), same no-re-render pattern as store/useCardDisturbance.ts.
export const useServiciosCardsRegistry = create<Registry>((set) => ({
  slots: Array.from({ length: MAX_CARDS }, emptySlot),
  setRect: (id, rect) =>
    set((s) => {
      const slots = s.slots.slice();
      slots[id] = { ...slots[id], rect };
      return { slots };
    }),
  setStyle: (id, style) =>
    set((s) => {
      const slots = s.slots.slice();
      slots[id] = { ...slots[id], style };
      return { slots };
    }),
  setTransform: (id, transform) =>
    set((s) => {
      const slots = s.slots.slice();
      slots[id] = { ...slots[id], transform };
      return { slots };
    }),
  clear: (id) =>
    set((s) => {
      const slots = s.slots.slice();
      slots[id] = emptySlot();
      return { slots };
    }),
}));
