"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import VolumetricCard from "./VolumetricCard";
import { useZoomParallaxCardsRegistry, ZP_MAX_CARDS } from "@/store/useZoomParallaxCardsRegistry";

const DEG2RAD = Math.PI / 180;
// Ambient mouse tilt, shared by every card equally — a small "the whole
// scene reacts to you" cue independent of whether the cursor is actually
// over any given card (unlike a hover-only effect, this reads even for
// cards nowhere near the pointer).
const MOUSE_MAX_YAW = 5;
const MOUSE_MAX_PITCH = 3.5;
const MOUSE_SMOOTH = 0.06; // per-frame lerp factor toward the target angle
// "Look toward centre": each card's yaw/pitch is also driven by its OWN
// position on screen — cards far from centre turn slightly inward, the one
// currently near centre (whichever that is) settles near 0° on its own,
// continuously, with no special-casing needed.
const CENTER_YAW_MAX = 10;
const CENTER_PITCH_MAX = 6;

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

// Fixed depth gap between whichever card is CURRENTLY the most dominant
// (largest on screen right now, i.e. still furthest from its own settled
// rest size) and every other card. This has to be decided by ONE shared
// pass comparing all 7 cards together (hence a single useFrame at the layer
// level below, not 7 independent per-card ones as an earlier version had):
// a per-card z derived only from that card's OWN current scale let two
// cards racing through similarly-large scales at the same moment end up at
// nearly the same z — reported on mobile as their edges "cutting" into each
// other (genuine z-fighting from an ambiguous, ever-shifting ranking). A
// single winner with a clear, FIXED gap can't have that ambiguity.
const BEHIND_Z = -30;

// Fluid-glass transmission for ZP cards — every device (user request), with
// a cheaper `samples` count on mobile. Slightly below Servicios' fully-clear
// 1: these cards carry big white stat text directly on the glass, so they
// keep a touch more body for contrast against the bright TV-wall video.
const ZP_TRANSMISSION = 0.9;

export default function ZoomParallaxCardsLayer({ isMobile }: { isMobile: boolean }) {
  const { size } = useThree();
  const groupRefs = useRef<(THREE.Group | null)[]>(Array.from({ length: ZP_MAX_CARDS }, () => null));
  const sectionElRef = useRef<HTMLElement | null>(null);
  const aspectsRef = useRef<number[]>(Array.from({ length: ZP_MAX_CARDS }, () => 1.5));
  const [aspects, setAspects] = useState<number[]>(() => Array.from({ length: ZP_MAX_CARDS }, () => 1.5));
  const mouseTarget = useRef({ nx: 0, ny: 0 });
  const mouseCurrent = useRef({ nx: 0, ny: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseTarget.current.nx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseTarget.current.ny = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    // Smoothed toward the live cursor position every frame — a direct,
    // unsmoothed assignment would snap instantly on each mousemove event
    // instead of reading as a soft, weighted reaction.
    mouseCurrent.current.nx += (mouseTarget.current.nx - mouseCurrent.current.nx) * MOUSE_SMOOTH;
    mouseCurrent.current.ny += (mouseTarget.current.ny - mouseCurrent.current.ny) * MOUSE_SMOOTH;
    const mouseYaw = mouseCurrent.current.nx * MOUSE_MAX_YAW;
    const mousePitch = -mouseCurrent.current.ny * MOUSE_MAX_PITCH;
    if (!sectionElRef.current) {
      sectionElRef.current = document.getElementById("nxr-zoom-parallax");
    }
    const sectionRect = sectionElRef.current?.getBoundingClientRect();
    if (!sectionRect) {
      groupRefs.current.forEach((g) => {
        if (g) g.visible = false;
      });
      return;
    }

    // Before the section reaches its pinned range, every card OTHER than
    // the hero (id 0) sits at an extreme, only-coherent-once-pinned CSS
    // offset (see the `nth-child` rules in globals.css) — showing them this
    // early risks the original "giant misplaced card" bug (a wildly-offset
    // card's rect can, purely by coincidence of where the not-yet-pinned
    // sticky currently sits in normal flow, land back inside the viewport).
    // The hero doesn't have this problem: its rest position is roughly
    // screen-centred even at progress=0 (pre-pin) and again once fully
    // settled (post-pin, scrolling away with the rest of the grid), so its
    // OWN live rect is always meaningfully computed — letting it through
    // unconditionally is what makes it appear the instant it's actually
    // first visible arriving at the section, and stay visible all the way
    // out, instead of popping in/out at an artificial boundary.
    const notYetPinned = sectionRect.top > 2;

    let bestIdx = -1;
    let bestScale = 0;
    const scales: number[] = new Array(ZP_MAX_CARDS).fill(0);
    const rects: (DOMRect | null)[] = new Array(ZP_MAX_CARDS).fill(null);
    let aspectsChanged = false;

    for (let i = 0; i < ZP_MAX_CARDS; i++) {
      if (i !== 0 && notYetPinned) continue;
      const anchor = useZoomParallaxCardsRegistry.getState().anchors[i];
      if (!anchor) continue;
      const rect = anchor.getBoundingClientRect();
      const offscreen =
        rect.width < 2 ||
        rect.height < 2 ||
        rect.right < -80 ||
        rect.left > size.width + 80 ||
        rect.bottom < -80 ||
        rect.top > size.height + 80;
      if (offscreen) continue;
      rects[i] = rect;
      const s = rect.height / BASE_H;
      scales[i] = s;
      if (s > bestScale) {
        bestScale = s;
        bestIdx = i;
      }

      // offsetWidth/offsetHeight are the card's UNTRANSFORMED base size
      // (CSS transforms don't affect layout metrics), so this aspect is
      // stable regardless of the current zoom scale.
      const a = anchor.offsetWidth / anchor.offsetHeight;
      if (a > 0 && Math.abs(a - aspectsRef.current[i]) > 0.01) {
        aspectsRef.current[i] = a;
        aspectsChanged = true;
      }
    }

    for (let i = 0; i < ZP_MAX_CARDS; i++) {
      const group = groupRefs.current[i];
      if (!group) continue;
      const rect = rects[i];
      if (!rect) {
        group.visible = false;
        continue;
      }
      group.visible = true;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Same pixel-accurate mapping as PixelCamera (1 world unit = 1px at z=0).
      group.position.x = cx - size.width / 2;
      group.position.y = -(cy - size.height / 2);
      group.scale.setScalar(scales[i]);
      // Only the single currently-most-dominant card gets pushed behind;
      // everyone else sits neutral/in-front — see BEHIND_Z's comment above.
      group.position.z = i === bestIdx ? BEHIND_Z : 0;

      // "Look toward centre", continuously from each card's OWN current
      // screen position — the same sign convention verified in Servicios'
      // cover-flow yaw (positive lateral offset → positive rotationY reads
      // as "facing into the centre"). Whichever card is currently near
      // screen-centre naturally settles near 0° on its own; nothing here is
      // keyed to `bestIdx` specifically. Added to the shared ambient mouse
      // tilt so the whole reel reacts a little to the cursor even when it
      // isn't over any particular card.
      const nx = THREE.MathUtils.clamp(group.position.x / (size.width * 0.5), -1, 1);
      const ny = THREE.MathUtils.clamp(group.position.y / (size.height * 0.5), -1, 1);
      group.rotation.y = (nx * CENTER_YAW_MAX + mouseYaw) * DEG2RAD;
      group.rotation.x = (ny * CENTER_PITCH_MAX + mousePitch) * DEG2RAD;
    }

    if (aspectsChanged) setAspects([...aspectsRef.current]);
  });

  return (
    <>
      {Array.from({ length: ZP_MAX_CARDS }, (_, i) => {
        const style = ZP_STYLES[i] ?? ZP_STYLES[0];
        return (
          <group
            key={i}
            ref={(el) => {
              groupRefs.current[i] = el;
            }}
            visible={false}
          >
            <VolumetricCard
              width={BASE_H * aspects[i]}
              height={BASE_H}
              thickness={16}
              radius={30}
              curveX={style.curveX}
              curveY={style.curveY}
              transmission={ZP_TRANSMISSION}
              samples={isMobile ? 4 : 6}
              color={style.color}
              material="glass"
            />
          </group>
        );
      })}
    </>
  );
}
