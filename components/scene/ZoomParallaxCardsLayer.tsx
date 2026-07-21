"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import VolumetricCard from "./VolumetricCard";
import { useZoomParallaxCardsRegistry, ZP_MAX_CARDS } from "@/store/useZoomParallaxCardsRegistry";
import { nearSections } from "@/store/sceneActivity";

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

// Fluid-glass transmission for ZP cards — every device, with a cheaper
// `samples` count on mobile. 1, SAME as Servicios/panels: the old 0.9 ("a
// touch more body for the white stat text") routed 10% of the light through
// the diffuse path and read as milky grey next to the other cards ("se ven
// más opacas y grises, tienen que ser como las demás"). Text contrast is
// carried by the mesh's frosted blur alone, like everywhere else.
const ZP_TRANSMISSION = 1;

export default function ZoomParallaxCardsLayer({ isMobile }: { isMobile: boolean }) {
  const { size } = useThree();
  const groupRefs = useRef<(THREE.Group | null)[]>(Array.from({ length: ZP_MAX_CARDS }, () => null));
  const sectionElRef = useRef<HTMLElement | null>(null);
  const stickyElRef = useRef<HTMLElement | null>(null);
  const aspectsRef = useRef<number[]>(Array.from({ length: ZP_MAX_CARDS }, () => 1.5));
  const [aspects, setAspects] = useState<number[]>(() => Array.from({ length: ZP_MAX_CARDS }, () => 1.5));
  const mouseTarget = useRef({ nx: 0, ny: 0 });
  const mouseCurrent = useRef({ nx: 0, ny: 0 });
  const lastOpacity = useRef<number[]>(Array.from({ length: ZP_MAX_CARDS }, () => 1));
  const zCurrent = useRef<number[]>(Array.from({ length: ZP_MAX_CARDS }, () => 0));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseTarget.current.nx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseTarget.current.ny = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    // Section-proximity early-out (see store/sceneActivity.ts): skip the 7
    // per-card rect reads on every video-driven render while the section is
    // nowhere near the viewport.
    if (!nearSections.has("nxr-zoom-parallax")) {
      groupRefs.current.forEach((g) => {
        if (g && g.visible) g.visible = false;
      });
      return;
    }
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

    // CLIP-GUARD (V16.39, "a veces sale en grande la card de +40 sobre la
    // última card de Servicios"): el DOM de las cards se recorta por el
    // overflow:hidden de #nxr-zoom-sticky, pero los meshes nunca lo
    // respetaron — una card que sobresale del box por ARRIBA (la card 1
    // arranca en top:-28vh) puede pintarse sobre la sección anterior en los
    // frames de transición. Un mesh no se puede recortar, así que se OCULTA
    // mientras la parte que sobresale por arriba supere el 35% de su altura.
    if (!stickyElRef.current) {
      stickyElRef.current = document.getElementById("nxr-zoom-sticky");
    }
    const stickyTop = stickyElRef.current ? stickyElRef.current.getBoundingClientRect().top : -Infinity;

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
      // V16.20 móvil: la card central es SOLO texto ("quítale la card en
      // sí, deja solo el texto de encima") — su cuerpo de cristal no se
      // dibuja nunca en móvil. El anchor sigue registrado y el resto del
      // pipeline (glitch por opacity inline, ranking de dominancia) intacto.
      if (i === 0 && isMobile) {
        group.visible = false;
        continue;
      }
      const rect = rects[i];
      if (!rect) {
        group.visible = false;
        continue;
      }
      // Mirror the anchor's INLINE opacity (mobile centre-card dissolve —
      // see ZoomParallax.tsx): inline style read only, no getComputedStyle.
      const anchor = useZoomParallaxCardsRegistry.getState().anchors[i];
      const opStr = anchor?.style.opacity ?? "";
      const opacity = opStr === "" ? 1 : parseFloat(opStr) || 0;
      if (opacity <= 0.02) {
        group.visible = false;
        continue;
      }
      // Clip-guard: si el BORDE SUPERIOR del box del sticky está en
      // pantalla (sección aún no pineada / saliendo) y el mesh lo
      // sobrepasa por arriba, se oculta — el DOM equivalente lo recorta el
      // overflow:hidden, y el mesh no debe pintarse jamás sobre la sección
      // anterior. Con el box pineado (top ≈ 0) el guard no actúa: lo que
      // sobresale queda fuera del viewport por sí solo.
      if (stickyTop > 4 && stickyTop - rect.top > 8) {
        group.visible = false;
        continue;
      }
      if (Math.abs(opacity - lastOpacity.current[i]) > 0.002) {
        lastOpacity.current[i] = opacity;
        group.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) (mesh.material as THREE.MeshPhysicalMaterial).opacity = opacity;
        });
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
      // SMOOTHED, not snapped: with the pixel camera at z=1000, a card
      // jumping the 30-unit gap instantly changes its projected size by ~3%
      // in one frame. Worst case was the mobile pin moment: pre-pin the hero
      // is the only ranked card (so it holds BEHIND_Z), and the instant the
      // giant neighbours join the ranking it lost dominance and popped 3%
      // bigger ("pega un salto"). The lerp turns every dominance handoff
      // into a ~0.3s glide; the fixed-gap ORDERING that kills z-fighting is
      // untouched (targets stay 0 / BEHIND_Z, both cards keep moving apart).
      const zTarget = i === bestIdx ? BEHIND_Z : 0;
      const zc = zCurrent.current;
      zc[i] += (zTarget - zc[i]) * 0.14;
      if (Math.abs(zTarget - zc[i]) < 0.05) zc[i] = zTarget;
      group.position.z = zc[i];

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
              // Perf pass: 4/3 (was 6/4) — see ServiciosCardsLayer.
              samples={isMobile ? 3 : 4}
              color={style.color}
              material="glass"
            />
          </group>
        );
      })}
    </>
  );
}
