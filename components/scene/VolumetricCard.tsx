"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MeshTransmissionMaterial } from "@react-three/drei";
import type { ReactNode } from "react";

export interface VolumetricCardProps {
  width?: number;
  height?: number;
  thickness?: number;
  radius?: number;
  /** Bulge amount along X, as a fraction of `width`. 0 = flat along X. */
  curveX?: number;
  /** Bulge amount along Y, as a fraction of `height`. 0 = flat along Y. */
  curveY?: number;
  /**
   * Cylindrical BEND around the vertical axis, in radians of half-arc at the
   * card's side edges. > 0 replaces the convex pillow dome with a clean
   * single-axis fold: the whole slab curves so its centre stays nearest the
   * camera and both side edges rotate BACK, away from the viewer — a curved
   * panoramic screen, but inverted (convex toward you instead of hugging).
   * When set, `curveX`/`curveY` (the dome) are ignored.
   */
  bend?: number;
  /**
   * 0 = opaque dark glass (default — the mobile fallback). > 0 turns the glass
   * frosted/see-through so the background blurs through it. Frosted cards use
   * drei's MeshTransmissionMaterial (the React Bits "FluidGlass" material) in
   * `transmissionSampler` mode, so ALL cards share three.js's single built-in
   * transmission capture (already downscaled via `transmissionResolutionScale`
   * in SceneCanvas.tsx) instead of each material re-rendering the scene to its
   * own FBO per frame (MTM's default, ~1 extra full scene render per card).
   * Callers gate it (desktop-only) — see ServiciosCardsLayer/ZoomParallaxCardsLayer.
   */
  transmission?: number;
  /** RGB fringing at the refracted edges — the FluidGlass signature. Frosted only. */
  chromaticAberration?: number;
  /** Directional smearing of the refracted background — frosted only. */
  anisotropicBlur?: number;
  /** MTM refraction sample count (constructor arg — fixed per mount). Lower on mobile. */
  samples?: number;
  material?: "glass" | "aluminum";
  color?: string;
  interactive?: boolean;
  glow?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** HTML riding on the card's screen projection — see the scroll/content
     bridge in Servicios.tsx. Not rendered by this component directly. */
  content?: ReactNode;
}

// Procedural rounded-rect glass slab with a REAL convex front dome, built
// from concentric-ring tessellation instead of ExtrudeGeometry. Why not
// Extrude + displacement (the previous approach): ExtrudeGeometry earcuts
// its front cap using ONLY the outline vertices — a handful of huge skinny
// triangles spanning the whole face, usually with one dominant diagonal.
// Displacing those sparse vertices into a dome then interpolates normals
// across giant triangles, which renders as a rectangular-looking specular
// patch with square corners plus a visible corner-to-corner diagonal
// crease. Here every ring of vertices is a scaled copy of the rounded-rect
// outline itself, so the tessellation (and therefore the vertex normals
// and the reflections riding on them) follows the rounded corners exactly,
// and there is no interior diagonal at all. Computed once and cached via
// useMemo below — zero per-frame cost.
const CORNER_SEGMENTS = 16;
const STRAIGHT_SEGMENTS = 10;
const DOME_RINGS = 20;

function buildCardGeometry(
  width: number,
  height: number,
  thickness: number,
  radius: number,
  curveX: number,
  curveY: number,
  bend: number
) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const halfT = thickness / 2;
  // Gentle MULTIPLICATIVE pillow profile, z = A·cos(πx/2w)·cos(πy/2h):
  //  - multiplicative (not additive) so the rim sits at z≈0 all the way
  //    around and meets the side wall without a crack;
  //  - smooth everywhere (C∞) — an "equal distance from the rim" falloff
  //    would crease along the rectangle's diagonals (medial axis), which
  //    rendered as a bowtie/X of reflections converging at the centre;
  //  - amplitude deliberately a fraction of the raw curveX/curveY sum: a
  //    full-height dome that must reach zero at the whole rim gets steep
  //    (~45°) near the edges and reads as a funnel, not a curved card.
  // The pillow dome is what varies the FRONT-FACE NORMALS toward the rim —
  // and normal variation is what makes refraction visibly bend/magnify the
  // background at the edges (the "liquid glass" read apps are known for; a
  // flat face refracts as one uniform, invisible shift).
  //
  // NOT composed with the cylindrical bend anymore: on bent (Servicios)
  // cards the dome rendered as a corner-to-corner X across the face ("una
  // cruz de esquina a esquina"). The cos·cos pillow sampled on this
  // concentric-ring tessellation shades a faint crease exactly along the
  // diagonals (where every ring turns its corner, so triangle orientation
  // flips), and the bend's horizontal reflection sweep over the bright
  // video wall amplified it into a visible cross. A bend-only face is a
  // clean developable cylinder (normals vary along x only — nothing
  // diagonal to shade), and the liquid read there no longer depends on the
  // dome: MTM's temporal noise distortion (distortion/distortionScale,
  // correctly world-scaled) plus the bend's own edge refraction carry it.
  // A dome-on-bend "half strength" compromise was tried and is what drew
  // the cross — don't reintroduce it.
  const A = bend > 0 ? 0 : 0.2 * (curveX * width + curveY * height);
  const pillowZ = (x: number, y: number) =>
    halfT +
    A *
      Math.cos((Math.PI * Math.min(Math.abs(x) / w, 1)) / 2) *
      Math.cos((Math.PI * Math.min(Math.abs(y) / h, 1)) / 2);

  // Rounded-rect outline, walked by hand — CCW starting at the bottom-left
  // corner's end — with INDEPENDENT control over corner vs. straight-edge
  // density. Two earlier approaches both failed here:
  //  - `shape.getSpacedPoints(N)` samples uniformly by ARC LENGTH across the
  //    whole perimeter; since the straight edges are far longer than the
  //    small rounded corners, that starves each corner down to ~2-3 points
  //    — a couple of straight facets standing in for a curve.
  //  - `shape.getPoints(N)` fixes that (three.js's CurvePath special-cases
  //    LineCurve to exactly 2 points, giving every quadraticCurveTo corner
  //    the FULL `N` regardless of edge length) but overcorrects: those 2
  //    points per straight edge are fine for the flat 2D outline, yet these
  //    same points also sample the DOME's z-bulge (which varies smoothly
  //    with x/y along the *entire* edge length) — 2 points across a long
  //    edge collapses that curvature into one large flat facet, which
  //    showed up as a diagonal crease/X across the face.
  // Manual walking sizes each independently: enough points along even a
  // long straight edge to keep the dome's curvature smooth, AND a full
  // curveSegments sweep on every corner regardless of the card's aspect
  // ratio.
  const outline: { x: number; y: number }[] = [];
  const addEdge = (x0: number, y0: number, x1: number, y1: number) => {
    for (let i = 0; i < STRAIGHT_SEGMENTS; i++) {
      const t = i / STRAIGHT_SEGMENTS;
      outline.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t });
    }
  };
  const addCorner = (cx: number, cy: number, a0: number, a1: number) => {
    for (let i = 0; i < CORNER_SEGMENTS; i++) {
      const a = a0 + ((a1 - a0) * i) / CORNER_SEGMENTS;
      outline.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  };
  const HALF_PI = Math.PI / 2;
  addEdge(-w + r, -h, w - r, -h); // bottom edge, left → right
  addCorner(w - r, -h + r, -HALF_PI, 0); // bottom-right corner
  addEdge(w, -h + r, w, h - r); // right edge, bottom → top
  addCorner(w - r, h - r, 0, HALF_PI); // top-right corner
  addEdge(w - r, h, -w + r, h); // top edge, right → left
  addCorner(-w + r, h - r, HALF_PI, Math.PI); // top-left corner
  addEdge(-w, h - r, -w, -h + r); // left edge, top → bottom
  addCorner(-w + r, -h + r, Math.PI, 3 * HALF_PI); // bottom-left corner
  const P = outline.length;

  // Inward 2D normal per outline point (central differences; the outline is
  // CCW, so "left of the tangent" points into the shape) — used to inset
  // rings for the rounded edge below.
  const inward = outline.map((_, j) => {
    const prev = outline[(j - 1 + P) % P];
    const next = outline[(j + 1) % P];
    let tx = next.x - prev.x;
    let ty = next.y - prev.y;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    return { x: -ty, y: tx };
  });

  // Rounded edge ("canto") radius: the front face rim sits inset by `b` and
  // a quarter-round of BEVEL_RINGS segments wraps out and down to the side
  // wall (mirrored on the back), replacing the hard 90° edge the plain
  // cap→wall junction had. All rings below share vertices with their
  // neighbours, so computeVertexNormals blends smoothly across cap → bevel
  // → wall and the edge catches light as a soft rounded band.
  const b = Math.min(halfT * 0.9, 4.5);
  const BEVEL_RINGS = 4;
  const capOutline = outline.map((p, j) => ({ x: p.x + inward[j].x * b, y: p.y + inward[j].y * b }));

  const positions: number[] = [];
  const indices: number[] = [];
  let prevRing = -1;

  // Adds one ring of P vertices and stitches quads to the previous ring.
  const pushRing = (pt: (j: number) => [number, number, number]) => {
    const start = positions.length / 3;
    for (let j = 0; j < P; j++) positions.push(...pt(j));
    if (prevRing >= 0) {
      for (let j = 0; j < P; j++) {
        const j2 = (j + 1) % P;
        indices.push(prevRing + j, start + j, start + j2);
        indices.push(prevRing + j, start + j2, prevRing + j2);
      }
    }
    prevRing = start;
    return start;
  };

  // ---- Front cap: centre fan + DOME_RINGS scaled copies of the (inset)
  // outline, each vertex lifted by the pillow height at its own (x, y).
  const frontCentre = positions.length / 3;
  positions.push(0, 0, pillowZ(0, 0));
  const firstRing = pushRing((j) => {
    const s = 1 / DOME_RINGS;
    const px = capOutline[j].x * s;
    const py = capOutline[j].y * s;
    return [px, py, pillowZ(px, py)];
  });
  for (let j = 0; j < P; j++) {
    indices.push(frontCentre, firstRing + j, firstRing + ((j + 1) % P));
  }
  for (let k = 2; k <= DOME_RINGS; k++) {
    const s = k / DOME_RINGS;
    pushRing((j) => {
      const px = capOutline[j].x * s;
      const py = capOutline[j].y * s;
      return [px, py, pillowZ(px, py)];
    });
  }

  // ---- Front rounded edge: quarter-round from the cap rim (inset, at the
  // pillow's rim height) out and down to the wall top (outline, halfT - b).
  const rimZ = capOutline.map((p) => pillowZ(p.x, p.y));
  for (let s = 1; s <= BEVEL_RINGS; s++) {
    const phi = (s / BEVEL_RINGS) * (Math.PI / 2);
    pushRing((j) => {
      const inset = b * (1 - Math.sin(phi));
      const x = outline[j].x + inward[j].x * inset;
      const y = outline[j].y + inward[j].y * inset;
      const z = halfT - b + (rimZ[j] - (halfT - b)) * Math.cos(phi);
      return [x, y, z];
    });
  }

  // ---- Side wall (between the two rounded edges).
  pushRing((j) => [outline[j].x, outline[j].y, -halfT + b]);

  // ---- Back rounded edge: mirror of the front one, wrapping from the wall
  // bottom in and down to the flat back face's rim.
  for (let s = 1; s <= BEVEL_RINGS; s++) {
    const phi = (s / BEVEL_RINGS) * (Math.PI / 2);
    pushRing((j) => {
      const inset = b * (1 - Math.cos(phi));
      const x = outline[j].x + inward[j].x * inset;
      const y = outline[j].y + inward[j].y * inset;
      return [x, y, -halfT + b - b * Math.sin(phi)];
    });
  }

  // ---- Back cap: flat centre fan, reversed winding (faces -z).
  const backRim = prevRing;
  const backCentre = positions.length / 3;
  positions.push(0, 0, -halfT);
  for (let j = 0; j < P; j++) {
    indices.push(backCentre, backRim + ((j + 1) % P), backRim + j);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  // Normals are computed on the UN-BENT slab, deliberately BEFORE the bend
  // below. On the flat pre-bend front face every face normal is identical,
  // so the area-weighted vertex normals are EXACT — whereas running
  // computeVertexNormals AFTER the bend estimated them from this
  // concentric-ring tessellation, whose skinny triangles flip orientation
  // exactly along the rectangle's diagonals; the small systematic estimation
  // error changed sign across those lines and shaded a corner-to-corner X
  // on the (brightly backlit) Servicios cards. Removing the dome alone
  // didn't clear it ("se siguen viendo las diagonales") — the estimation
  // error was the remaining source.
  geo.computeVertexNormals();

  // ---- Cylindrical bend around the vertical (Y) axis. Every vertex is wrapped
  // onto a cylinder whose axis sits a distance Rb BEHIND the card's mid-plane,
  // so the centre column keeps its depth (nearest the camera) while the side
  // columns rotate back and recede. Rb = w / bend maps the card's half-width
  // exactly to `bend` radians at the edge. Applied to ALL vertices (front,
  // bevels, wall, back) so the whole slab folds at constant thickness — not a
  // domed front on a flat back. Normals transform ANALYTICALLY: the bend's
  // local frame at pre-bend x is a pure rotation by θ = x/Rb around Y (the
  // arc-length scaling only stretches the x-tangent's magnitude, not any
  // direction), so each exact pre-bend normal is rotated by its vertex's own
  // θ — smooth true-cylinder normals with zero tessellation artifacts.
  if (bend > 0) {
    const Rb = w / bend;
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const nrm = geo.getAttribute("normal") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      const theta = px / Rb;
      const rr = Rb + pz;
      const sin = Math.sin(theta);
      const cos = Math.cos(theta);
      pos.setXYZ(i, rr * sin, pos.getY(i), rr * cos - Rb);
      const nx = nrm.getX(i);
      const nz = nrm.getZ(i);
      nrm.setXYZ(i, nx * cos + nz * sin, nrm.getY(i), -nx * sin + nz * cos);
    }
  }
  return geo;
}

export default function VolumetricCard({
  width = 420,
  height = 560,
  thickness = 10,
  radius = 24,
  curveX = 0.08,
  curveY = 0,
  bend = 0,
  transmission = 0,
  chromaticAberration = 0.16,
  anisotropicBlur = 0.15,
  samples = 6,
  material = "glass",
  color = "#0d1520",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: VolumetricCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(
    () => buildCardGeometry(width, height, thickness, radius, curveX, curveY, bend),
    [width, height, thickness, radius, curveX, curveY, bend]
  );

  // Small per-instance roughness jitter — a fixed seed at mount, not re-rolled
  // per frame — so several cards sharing the same material preset don't read
  // as perfectly identical/plastic ("pequeñas variaciones de roughness para
  // romper la perfección" per spec).
  const roughnessJitter = useMemo(() => Math.random() * 0.04, []);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  const isGlass = material === "glass";
  const isFrosted = isGlass && transmission > 0;

  // `color` on a transmissive MeshPhysicalMaterial acts as an absorption tint
  // on the transmitted light too — the near-black brand colors tuned for the
  // OPAQUE cards (where `color` only shades the reflection) absorb virtually
  // everything passing through, so raising `transmission` alone did nothing:
  // the card just looked opaque regardless of its value. Lightening the
  // surface colour toward white is what actually lets the background show
  // through; the original brand tint moves to `attenuationColor` below, which
  // colours the transmitted light WITHOUT blocking it, so the frosted look
  // keeps its per-card hue instead of going flat white.
  // 0.85 toward white, not a subtle lightening: with the earlier 0.45 the
  // near-black brand colors still landed on a MID-GREY that tinted everything
  // transmitted — the card read as "grey plastic", not clear glass (user
  // feedback, twice). Real liquid glass wants a near-clear base; the brand
  // hue survives via attenuationColor below.
  const glassColor = useMemo(
    () => (isFrosted ? new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.85) : color),
    [color, isFrosted]
  );

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} rotation={rotation} castShadow receiveShadow>
      {isGlass && isFrosted ? (
        // ---- Frosted "fluid glass" (React Bits FluidGlass look, adapted) ----
        // drei's MeshTransmissionMaterial = MeshPhysicalMaterial + multi-sample
        // refraction with chromatic aberration / anisotropic blur — the
        // FluidGlass component's material, WITHOUT its per-instance <Canvas>
        // (12+ WebGL contexts) or its per-material FBO. `transmissionSampler`
        // makes it read three.js's single shared transmission capture, which
        // SceneCanvas already downscales (transmissionResolutionScale) — so
        // the fancy refraction costs no extra scene renders at all.
        //
        // Everything else carries over the hard-won grey-glass lessons (see
        // the Obsidian Bug-Log): light glassColor (dark base colors absorb
        // the transmitted light), brand tint via attenuationColor (tints
        // without blocking), thin thickness + long attenuationDistance,
        // metalness LOW (metalness kills transmission at the shader level —
        // the shine comes from clearcoat, a separate layer that doesn't).
        <MeshTransmissionMaterial
          transmissionSampler
          samples={samples}
          transparent
          color={glassColor}
          transmission={transmission}
          // Thicker (26) purely for a stronger refraction bend at the curved
          // edges — the darkening that thickness used to cause is offset by
          // the longer attenuationDistance (380) and near-clear glassColor.
          // 52, up from 40 (and 26 before that): `thickness` is the
          // refraction budget — the maximum ON-SCREEN displacement the
          // refracted background can have is proportional to it (the shader
          // marches thickness·refract and reprojects). At 26px the liquid
          // warp maxed out around ~10px of displacement, invisible over an
          // already-blurred backdrop; 40 made it perceivable; 52 makes the
          // wobble unmistakable (user request: "que lo de detrás se
          // distorsione como liquid glass"). Side effect kept in mind:
          // thickness also feeds the frost smear (thickness·roughness^⅓),
          // so going much higher than this mushes the transmitted image.
          thickness={52}
          attenuationColor={color}
          // Long distance: with the near-black attenuation tints, anything
          // shorter visibly darkens the transmitted light ("grey glass").
          attenuationDistance={900}
          // Low roughness = the transmitted image stays legible — SEEING the
          // background clearly through the card is what makes it read as
          // transparent at a glance. Also feeds thickness_smear (frost
          // spread): thickness·max(roughness^⅓, anisotropicBlur) — kept in
          // check so the bigger thickness doesn't turn into mush.
          roughness={0.12 + roughnessJitter}
          chromaticAberration={chromaticAberration}
          anisotropicBlur={anisotropicBlur}
          // The moving "LIQUID" part: noise-warped refraction drifting over
          // time (drei updates the `time` uniform every frame). CRITICAL
          // SCALE NOTE: MTM feeds worldPosition·distortionScale into its
          // noise, and this scene's world units are PIXELS (PixelCamera) —
          // drei's demo-sized default (0.5, meshes ~1 unit) put the noise at
          // per-pixel frequency here, which averaged out to nothing. 0.006 ≈
          // one smooth wave every ~165px — broad ripples gliding across the
          // glass (slightly broader than the previous 0.007 so the stronger
          // displacement below reads as liquid, not noise); distortion 1.35
          // (was 0.8) tilts the sampling normal hard enough for the ripples
          // to clearly bend the background, and temporalDistortion 0.55
          // (was 0.4) keeps them drifting at a livelier pace. All three are
          // plain shader uniforms — raising them costs zero extra GPU (the
          // expensive knobs are `samples` and the capture resolution, which
          // stay untouched).
          // envMapIntensity 1.6 → 1.0 → 0.4 → 0.15 y clearcoat 0.35 → 0.15 (V16.11, tercera bajada:
          // 1.1 → 0.3 en el metálico) — V16.9/16.10, "que sean sutiles": los brochazos casi desaparecen — 
          // brochazos de los Lightformers bajan ~35% de intensidad.
          distortion={1.35}
          distortionScale={0.006}
          temporalDistortion={0.55}
          clearcoat={0.05}
          clearcoatRoughness={0.3}
          ior={1.5}
          reflectivity={0.2}
          metalness={0.04}
          envMapIntensity={0.05}
        />
      ) : isGlass ? (
        // ---- Opaque dark glass (mobile fallback — transmission off) ----
        // `transparent` stays on even at opacity 1: Servicios' exit-fade
        // mutates `.opacity` directly per frame, and toggling `transparent`
        // at runtime would recompile the shader.
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          transmission={0}
          thickness={0}
          attenuationColor={color}
          attenuationDistance={1}
          roughness={0.16 + roughnessJitter}
          clearcoat={0.05}
          clearcoatRoughness={0.3}
          ior={1.5}
          reflectivity={0.2}
          metalness={0.04}
          envMapIntensity={0.05}
        />
      ) : (
        <meshPhysicalMaterial
          color={color}
          transmission={0}
          roughness={0.32 + roughnessJitter}
          clearcoat={0.5}
          clearcoatRoughness={0.25}
          metalness={0.85}
          envMapIntensity={0.05}
        />
      )}
    </mesh>
  );
}
