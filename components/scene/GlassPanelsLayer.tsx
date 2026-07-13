"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import VolumetricCard from "./VolumetricCard";
import { useGlassPanelsRegistry, type GlassPanel } from "@/store/useGlassPanelsRegistry";

// Renders one flat fluid-glass mesh docked to a registered DOM anchor (see
// hooks/useGlassPanels.ts). Geometry is built ONCE from the panel's
// registered dims (kept fresh by the hook's ResizeObserver → zustand → React
// re-render — deterministic); the per-frame path below only mutates the
// group's position/scale/visibility/opacity. Deliberately NO setState inside
// useFrame: a first version updated dims that way and the state update was
// silently dropped, leaving the mesh frozen at its default size while a
// ref-based gate prevented any retry.
function PanelSlot({ panel, isMobile }: { panel: GlassPanel; isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { size } = useThree();

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const rect = panel.anchor.getBoundingClientRect();
    if (
      rect.width < 1 ||
      rect.height < 1 ||
      rect.right < -80 ||
      rect.left > size.width + 80 ||
      rect.bottom < -80 ||
      rect.top > size.height + 80
    ) {
      group.visible = false;
      return;
    }
    // Effective opacity of the anchor (own × up to 3 ancestors): entrance
    // animations here fade a WRAPPER (Proceso's .nxr-paso-tilt) or the card
    // itself (Intro, via GSAP) — the glass must fade WITH the content, not
    // stand around as an empty slab before the reveal.
    let opacity = 1;
    let el: HTMLElement | null = panel.anchor;
    for (let i = 0; i < 4 && el; i++) {
      // NOT `parseFloat(...) || 1`: opacity "0" parses to 0, which is falsy —
      // the || fallback silently replaced exactly the value that must hide
      // the glass (bit us: reveal-hidden cards showed a full-brightness
      // empty slab).
      const o = parseFloat(getComputedStyle(el).opacity);
      opacity *= Number.isNaN(o) ? 1 : o;
      if (opacity <= 0.02) break;
      el = el.parentElement;
    }
    if (opacity <= 0.02) {
      group.visible = false;
      return;
    }
    group.visible = true;
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) (mesh.material as THREE.MeshPhysicalMaterial).opacity = opacity;
    });
    group.position.x = rect.left + rect.width / 2 - size.width / 2;
    group.position.y = -(rect.top + rect.height / 2 - size.height / 2);
    // Live rect vs registered geometry size: pure transform (≈1 in steady
    // state; covers the moments between a layout change and the
    // ResizeObserver-driven rebuild). Z uses the mean so the bevel scales
    // proportionally instead of shearing.
    const sx = rect.width / panel.width;
    const sy = rect.height / panel.height;
    group.scale.set(sx, sy, (sx + sy) / 2);
  });

  return (
    <group ref={groupRef} visible={false}>
      <VolumetricCard
        width={panel.width}
        height={panel.height}
        thickness={10}
        radius={panel.style.radius}
        // "Sin la curvatura": no cylindrical bend, and only a whisper of dome
        // — visually flat, but enough edge-normal variation for the liquid
        // refraction to read at the rims (a perfectly flat face shows none).
        curveX={0.05}
        curveY={0.05}
        transmission={1}
        samples={isMobile ? 4 : 6}
        color={panel.style.color}
        material="glass"
      />
    </group>
  );
}

export default function GlassPanelsLayer({ isMobile }: { isMobile: boolean }) {
  // Reactive subscription is fine here: the list only changes on section
  // mount/unmount, not per frame.
  const panels = useGlassPanelsRegistry((s) => s.panels);
  return (
    <>
      {panels.map((p) => (
        <PanelSlot key={p.id} panel={p} isMobile={isMobile} />
      ))}
    </>
  );
}
