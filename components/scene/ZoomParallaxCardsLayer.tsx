"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import VolumetricCard from "./VolumetricCard";
import { useZoomParallaxCardsRegistry, ZP_MAX_CARDS } from "@/store/useZoomParallaxCardsRegistry";

// Every card's geometry is built ONCE at this normalized height (world
// units); its actual on-screen size comes from a per-frame GROUP scale, not
// from re-sizing the geometry. This is the whole trick that makes real
// volumetric cards viable in ZoomParallax: the section scales its cards via
// `transform: scale()` from huge start sizes down (see ZoomParallax.tsx), so
// anchoring geometry to the live rect (as Servicios does) would rebuild the
// bevelled/domed mesh every frame — a permanent hang. Group scale is free.
const BASE_H = 400;

// Per-card dark glass tints echoing each card's accent (the nums/icons use
// lime/salmon/red), same restrained palette as Servicios' CARD_STYLES so the
// two sections read as one material family. curveX/curveY on BOTH axes give
// the convex dome its head-on read.
const ZP_STYLES = [
  { color: "#141018", curveX: 0.09, curveY: 0.09 }, // hero
  { color: "#0e150a", curveX: 0.1, curveY: 0.08 }, // +40 (lime)
  { color: "#1a0f0a", curveX: 0.09, curveY: 0.1 }, // Desarrollo web (red)
  { color: "#160f12", curveX: 0.08, curveY: 0.1 }, // 98% (salmon)
  { color: "#0e150a", curveX: 0.1, curveY: 0.09 }, // Automatizaciones (lime)
  { color: "#141018", curveX: 0.09, curveY: 0.09 }, // 3x
  { color: "#160f12", curveX: 0.09, curveY: 0.1 }, // SEO (salmon)
] as const;

function ZpSlot({ id }: { id: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { size } = useThree();
  const stickyElRef = useRef<HTMLElement | null>(null);
  // Aspect (base width/height) changes only on resize/breakpoint — cheap to
  // hold in state and thus rebuild the geometry only then, never per frame.
  const [aspect, setAspect] = useState(1.5);
  const aspectRef = useRef(1.5);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const anchor = useZoomParallaxCardsRegistry.getState().anchors[id];
    if (!anchor) {
      group.visible = false;
      return;
    }
    if (!stickyElRef.current) {
      stickyElRef.current = document.getElementById("nxr-zoom-sticky");
    }
    // `#nxr-zoom-sticky` is `position: sticky; top: 0`, and its `overflow:
    // hidden` is what actually keeps these (individually huge, wildly
    // offset) cards invisible in the DOM outside the section's pinned
    // scroll range. A `position:sticky` element's rect.top reads as ~0 IF
    // AND ONLY IF it's currently pinned — while the section is still below
    // the viewport it sits in normal flow with rect.top > 0, and once the
    // section has fully scrolled past, it's back in normal flow far ABOVE
    // the viewport (rect.top very negative). Checking that directly (rather
    // than intersecting rects, which reported "visible" the moment the
    // sticky's box merely grazed the viewport — before it was actually
    // pinned/clipped-to-viewport — and let a card mesh render full-size
    // through that sliver) is exact: render nothing at all unless truly
    // pinned, matching precisely when the DOM's own clip window equals the
    // full viewport. This mesh has no ancestor to be clipped by, unlike the
    // (correctly invisible) DOM content it stands in for.
    const stickyRect = stickyElRef.current?.getBoundingClientRect();
    const pinned = !!stickyRect && Math.abs(stickyRect.top) < 2;
    if (!pinned) {
      group.visible = false;
      return;
    }

    const rect = anchor.getBoundingClientRect();
    if (
      rect.width < 2 ||
      rect.height < 2 ||
      rect.right < -80 ||
      rect.left > size.width + 80 ||
      rect.bottom < -80 ||
      rect.top > size.height + 80
    ) {
      group.visible = false;
      return;
    }

    group.visible = true;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Same pixel-accurate mapping as PixelCamera (1 world unit = 1px at z=0).
    group.position.x = cx - size.width / 2;
    group.position.y = -(cy - size.height / 2);
    group.scale.setScalar(rect.height / BASE_H);

    // offsetWidth/offsetHeight are the card's UNTRANSFORMED base size (CSS
    // transforms don't affect layout metrics), so this aspect is stable
    // regardless of the current zoom scale.
    const a = anchor.offsetWidth / anchor.offsetHeight;
    if (a > 0 && Math.abs(a - aspectRef.current) > 0.01) {
      aspectRef.current = a;
      setAspect(a);
    }
  });

  const style = ZP_STYLES[id] ?? ZP_STYLES[0];

  return (
    <group ref={groupRef} visible={false}>
      <VolumetricCard
        width={BASE_H * aspect}
        height={BASE_H}
        thickness={16}
        radius={30}
        curveX={style.curveX}
        curveY={style.curveY}
        color={style.color}
        material="glass"
      />
    </group>
  );
}

export default function ZoomParallaxCardsLayer() {
  return (
    <>
      {Array.from({ length: ZP_MAX_CARDS }, (_, i) => (
        <ZpSlot key={i} id={i} />
      ))}
    </>
  );
}
