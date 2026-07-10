"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
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
const PERIM_SEGMENTS = 96;
const DOME_RINGS = 20;

function buildCardGeometry(
  width: number,
  height: number,
  thickness: number,
  radius: number,
  curveX: number,
  curveY: number
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
  const A = 0.2 * (curveX * width + curveY * height);
  const pillowZ = (x: number, y: number) =>
    halfT +
    A *
      Math.cos((Math.PI * Math.min(Math.abs(x) / w, 1)) / 2) *
      Math.cos((Math.PI * Math.min(Math.abs(y) / h, 1)) / 2);

  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  shape.closePath();

  // Evenly-spaced points along the closed outline (last point duplicates
  // the first on a closed path — drop it and wrap indices instead).
  const outline = shape.getSpacedPoints(PERIM_SEGMENTS).slice(0, PERIM_SEGMENTS);
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
  geo.computeVertexNormals();
  return geo;
}

export default function VolumetricCard({
  width = 420,
  height = 560,
  thickness = 10,
  radius = 24,
  curveX = 0.08,
  curveY = 0,
  material = "glass",
  color = "#0d1520",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: VolumetricCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(
    () => buildCardGeometry(width, height, thickness, radius, curveX, curveY),
    [width, height, thickness, radius, curveX, curveY]
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

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} rotation={rotation} castShadow receiveShadow>
      {isGlass ? (
        <meshPhysicalMaterial
          color={color}
          transmission={0.55}
          thickness={thickness * 1.6}
          // ~0.16: the env reflection blurs into ONE broad sheen that bends
          // across the dome — the elegant "curved glass" read — instead of
          // several sharp-edged blobs (each light source wrapping into its
          // own patch), while staying well above the near-mirror 0.05 whose
          // pinprick highlight vanishes on a card facing the camera dead-on.
          roughness={0.16 + roughnessJitter}
          clearcoat={1}
          clearcoatRoughness={0.08}
          ior={1.5}
          reflectivity={0.55}
          metalness={0.04}
          envMapIntensity={1.6}
        />
      ) : (
        <meshPhysicalMaterial
          color={color}
          transmission={0}
          roughness={0.32 + roughnessJitter}
          clearcoat={0.5}
          clearcoatRoughness={0.25}
          metalness={0.85}
          envMapIntensity={1.1}
        />
      )}
    </mesh>
  );
}
