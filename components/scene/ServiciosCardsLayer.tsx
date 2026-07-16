"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import VolumetricCard from "./VolumetricCard";
import { useServiciosCardsRegistry, type CardStyle } from "@/store/useServiciosCardsRegistry";
import { nearSections } from "@/store/sceneActivity";

const MAX_CARDS = 5;
const DEFAULT_STYLE: CardStyle = { color: "#0d1520", material: "glass", curveX: 0.06, curveY: 0 };
// Servicios cards are BENT (curved panoramic screen, inverted — centre toward
// the viewer, side edges folded back) rather than pillow-domed. Half-arc at the
// side edges, in radians (~15°) — deliberately gentle so the flat HTML overlay
// riding on the card (the mini-animations) stays within the glass silhouette
// instead of spilling past the curved edges. ZoomParallax cards don't pass
// this, so they keep their convex dome.
const SRV_BEND = 0.26;
// Fully clear fluid glass (the TV-wall background shows through, liquid-
// distorted). Enabled on MOBILE too (user request): the shared transmission
// capture the cards read (`transmissionSampler`) is a single low-res render
// of the TV wall per frame (transmissionResolutionScale 0.35 in
// SceneCanvas.tsx), so the extra cost on phones is one small pass — the
// per-card shader cost is trimmed there via a lower `samples` count instead
// of dropping the effect entirely.
const SRV_TRANSMISSION = 1;
// Servicios.tsx's entrance/tilt math is ported from the CSS/GSAP DOM version,
// where rotationX/rotationY are degrees (CSS transform convention) — but
// Object3D.rotation is in radians, so convert at this R3F consumption boundary.
const DEG2RAD = Math.PI / 180;

// Reads store/useServiciosCardsRegistry.ts every frame (`.getState()`, not
// the reactive hook — position tracking must not cost a React render at
// scroll/mousemove frequency) and keeps this card's mesh positioned exactly
// under wherever Servicios.tsx's matching anchor div currently sits on
// screen. Width/height/style change rarely (resize, or once at mount), so
// those go through real React state instead of being read every frame.
function CardSlot({ id, isMobile }: { id: number; isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { size } = useThree();
  const [dims, setDims] = useState({ width: 560, height: 373 });
  const [style, setStyle] = useState<CardStyle>(DEFAULT_STYLE);
  const lastDims = useRef(dims);
  const lastStyle = useRef(style);
  const lastOpacity = useRef(1);
  // Frames already spent warming this mesh up (see the visibility gate).
  const warmFrames = useRef(0);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    // Section-proximity early-out (see store/sceneActivity.ts): while the
    // reel is nowhere near the viewport this slot must not pay a DOM rect
    // read on every rendered frame (the TV-wall video keeps the canvas
    // rendering page-wide).
    if (!nearSections.has("nxr-servicios")) {
      group.visible = false;
      return;
    }
    const slot = useServiciosCardsRegistry.getState().slots[id];
    // Measured HERE, inside the render frame, so the mesh always uses the
    // DOM's current-frame position — never a stale rect from a previous
    // frame (which made the glass trail its text during fast scrolls).
    const rect = slot?.anchor?.getBoundingClientRect();
    if (!rect || rect.width < 1 || rect.height < 1) {
      group.visible = false;
      return;
    }

    // ---- Geometry/style measurement, deliberately BEFORE the on-screen
    // cull below: as soon as the section is near (nearSections), every slot
    // measures its anchor and rebuilds its ExtrudeGeometry while still
    // off-screen, so a card scrolling in for the first time already has the
    // right-sized mesh waiting at the edge instead of building it mid-entry.
    const rw = Math.round(rect.width);
    const rh = Math.round(rect.height);
    // Rounded + tolerance-gated: sub-pixel float jitter in getBoundingClientRect
    // (e.g. while sibling GSAP transforms recompute layout during the scroll-
    // driven spiral in Servicios.tsx) must never flip this comparison, since
    // any change here rebuilds VolumetricCard's ExtrudeGeometry — cheap once,
    // catastrophic if it fires every frame.
    if (Math.abs(rw - lastDims.current.width) > 1 || Math.abs(rh - lastDims.current.height) > 1) {
      lastDims.current = { width: rw, height: rh };
      setDims({ width: rw, height: rh });
    }
    const st = slot.style;
    if (
      st.color !== lastStyle.current.color ||
      st.material !== lastStyle.current.material ||
      st.curveX !== lastStyle.current.curveX ||
      st.curveY !== lastStyle.current.curveY
    ) {
      lastStyle.current = st;
      setStyle(st);
    }

    // The reel's own GSAP ScrollTrigger stops updating once the pin's
    // scroll range is exhausted, freezing the sticky's last scrub position
    // as it un-pins and returns to normal flow — but a card's rect is still
    // perfectly well-defined at that frozen position, so without an
    // explicit on-screen check the mesh kept rendering (a stray,
    // mid-transition-yawed glass card) as that frozen content scrolled
    // past on its way off, well after the section itself was behind you.
    if (rect.right < -80 || rect.left > size.width + 80 || rect.bottom < -80 || rect.top > size.height + 80) {
      group.visible = false;
      return;
    }

    const { left: x, top: y, width, height } = rect;
    const t = slot.transform;
    // Skip drawing a card the exit-fade has already taken to ~0 — no point
    // paying its (transmission) render pass while it's invisible. ALSO never
    // draw while the React-state geometry hasn't caught up with the anchor's
    // measured size: `dims` applies one render after the setDims above, and
    // drawing that frame anyway used the DEFAULT 560×373 slab — which
    // flashed as an oversized glass card at the right edge the FIRST time
    // each card scrolled in on mobile (first pass only, since dims stay
    // cached afterwards).
    // ---- One-time warm-up: the first ~30 near-frames draw the mesh even
    // while the spiral tail still holds it at opacity 0 (a fully transparent
    // draw is invisible but real): the transmission material's shader
    // compiles and the shared transmission capture spins up BEFORE the
    // card's first actual materialization. Without this, both first-time
    // costs landed exactly on the first visible frame — a one-off stutter /
    // garbage flash as the first cards appeared on mobile ("las cards
    // aparecen un poco bugeadas la primera vez"). The prologue (title hold)
    // provides plenty of hidden frames for this to complete.
    const warming = warmFrames.current < 45;
    if (warming) warmFrames.current++;
    group.visible =
      (warming || t.opacity > 0.01) && Math.abs(rw - dims.width) <= 1 && Math.abs(rh - dims.height) <= 1;
    if (!group.visible) return;
    group.position.x = x + width / 2 - size.width / 2 + t.x;
    group.position.y = -(y + height / 2 - size.height / 2) + t.y;
    group.position.z = t.z;
    group.rotation.x = t.rotationX * DEG2RAD;
    group.rotation.y = t.rotationY * DEG2RAD;
    group.scale.setScalar(t.scale);
    // Desktop-only exit fade (see updateSpiral in Servicios.tsx): mutated
    // directly on the material, never through a React prop, so this stays
    // off the per-frame React render path — same reasoning as position/
    // rotation/scale above. `transparent` is always on for this material
    // (VolumetricCard.tsx) so opacity < 1 actually renders. Only walked when
    // the value actually moved — at rest it's pinned at 1.
    if (Math.abs(t.opacity - lastOpacity.current) > 0.002) {
      lastOpacity.current = t.opacity;
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          (mesh.material as THREE.MeshPhysicalMaterial).opacity = t.opacity;
        }
      });
    }

  });

  return (
    <group ref={groupRef} visible={false}>
      <VolumetricCard
        width={dims.width}
        height={dims.height}
        thickness={10}
        radius={30}
        curveX={style.curveX}
        curveY={style.curveY}
        bend={SRV_BEND}
        transmission={SRV_TRANSMISSION}
        // Perf pass: 4/3 (was 6/4) — with anisotropicBlur + the downscaled
        // shared transmission capture already softening the refraction, the
        // extra samples were indistinguishable; per-pixel MTM cost drops ~33%.
        samples={isMobile ? 3 : 4}
        color={style.color}
        material={style.material}
      />
    </group>
  );
}

export default function ServiciosCardsLayer({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      {Array.from({ length: MAX_CARDS }, (_, i) => (
        <CardSlot key={i} id={i} isMobile={isMobile} />
      ))}
    </>
  );
}
