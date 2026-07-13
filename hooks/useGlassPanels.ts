"use client";

import { useEffect, type RefObject } from "react";
import { useGlassPanelsRegistry } from "@/store/useGlassPanelsRegistry";

/**
 * Registers every `selector` match inside `rootRef` as a flat volumetric
 * fluid-glass panel (rendered by components/scene/GlassPanelsLayer.tsx in the
 * global SceneCanvas). The DOM element keeps its layout/content and drops its
 * CSS glass styling — the WebGL mesh IS the glass. Corner radius is read from
 * the element's computed border-radius so mesh and layout always agree.
 *
 * Geometry dims are captured here at registration and kept fresh with a
 * ResizeObserver (fonts loading, responsive breakpoints, Contacto's form
 * changing height between steps) — the per-frame path in GlassPanelsLayer
 * only ever SCALES the mesh, it never rebuilds geometry itself.
 *
 * `deps` should include anything that remounts the matched elements (e.g. a
 * reduced-motion re-render), mirroring Servicios' anchor-registration effect.
 */
export function useGlassPanels(
  rootRef: RefObject<HTMLElement | null>,
  selector: string,
  color: string,
  deps: readonly unknown[] = []
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reg = useGlassPanelsRegistry.getState();
    const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (!els.length) return;

    const entries = els.map((el) => {
      const r = el.getBoundingClientRect();
      // Clamp to just under half the shorter side: pill-shaped anchors (the
      // hero CTA declares border-radius: 100px on a ~48px-tall button) would
      // otherwise hit the geometry builder's r == h case, where the straight
      // edge runs collapse to repeated identical points whose central-
      // difference inward normals go zero-length → degenerate bevel quads.
      const radius = Math.min(
        parseFloat(getComputedStyle(el).borderRadius) || 20,
        Math.max(2, Math.min(r.width, r.height) / 2 - 1)
      );
      const id = reg.add(el, { color, radius }, Math.max(2, Math.round(r.width)), Math.max(2, Math.round(r.height)));
      return { el, id };
    });

    // One observer for all this section's panels. Fires once on observe with
    // the current size, then on every real size change. borderBox keeps the
    // measured size aligned with getBoundingClientRect (untransformed layout).
    const ro = new ResizeObserver((obs) => {
      for (const entry of obs) {
        const match = entries.find((e) => e.el === entry.target);
        if (!match) continue;
        const box = entry.borderBoxSize?.[0];
        const w = box ? box.inlineSize : (entry.target as HTMLElement).offsetWidth;
        const h = box ? box.blockSize : (entry.target as HTMLElement).offsetHeight;
        if (w > 2 && h > 2) {
          useGlassPanelsRegistry.getState().updateDims(match.id, Math.round(w), Math.round(h));
        }
      }
    });
    entries.forEach(({ el }) => ro.observe(el));

    return () => {
      ro.disconnect();
      entries.forEach(({ id }) => useGlassPanelsRegistry.getState().remove(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
