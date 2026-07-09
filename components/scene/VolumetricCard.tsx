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

// Procedural rounded-rect glass slab: real front/back/side faces + bevel via
// THREE.Shape + ExtrudeGeometry (proper rounded-corner outline + bevel —
// no hand-derived cube-face trig needed, unlike the DOM/CSS version this
// replaces), then a ONE-TIME vertex displacement bulges the front cap
// outward — cylindrical when only curveX or curveY is set, dome-like when
// both are ("pantalla OLED curva" per spec). Real geometry, not a
// shader/CSS illusion; computed once and cached via useMemo below, so it's
// zero per-frame cost regardless of how many cards use it.
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

  const bevelThickness = Math.min(thickness * 0.28, 3);
  const bevelSize = Math.min(thickness * 0.22, 2.4);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments: 6,
    curveSegments: 20,
    steps: 1,
  });

  // Bulge only the front cap (z at the extrusion's forward face) — the back
  // and bevel/side vertices stay put, so the slab keeps real, flat-ish
  // thickness at the edges while the front reads as a convex lens.
  const pos = geo.attributes.position;
  const frontZ = thickness;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (z > frontZ - 0.02) {
      const nx = Math.min(Math.abs(x / w), 1);
      const ny = Math.min(Math.abs(y / h), 1);
      const falloffX = Math.cos((nx * Math.PI) / 2);
      const falloffY = Math.cos((ny * Math.PI) / 2);
      const bulge = curveX * width * falloffX + curveY * height * falloffY;
      pos.setZ(i, z + bulge);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.center();
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
          // Roughness bumped from a near-perfect-mirror 0.05 up to ~0.14:
          // at very low roughness the specular highlight from an area light
          // is a tiny, angle-critical pinprick — near-invisible on a card
          // facing the camera dead-on (no hover tilt/bank applied), which
          // defeats the "convex even head-on" requirement. This spreads the
          // highlight broadly enough to read at any viewing angle while
          // staying glossy, not matte.
          roughness={0.13 + roughnessJitter}
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
