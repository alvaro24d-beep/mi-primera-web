"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";

// Fixed camera distance from the z=0 plane where cards live — keeps depth
// math (the entrance spiral's z travel, hover "lift") consistent regardless
// of viewport size.
export const CAMERA_DISTANCE = 1000;

// Recomputes `fov` on mount/resize so that at z=0, 1 Three.js world unit
// equals 1 CSS pixel — this is what lets Servicios.tsx position/size cards
// using the SAME numbers as a normal DOM `getBoundingClientRect()` (width,
// height, and screen-to-world x/y) without a separate unit-conversion table
// scattered across the scroll bridge, HTML overlay, and entrance math.
export default function PixelCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    cam.position.z = CAMERA_DISTANCE;
    cam.fov = (2 * Math.atan(size.height / (2 * CAMERA_DISTANCE)) * 180) / Math.PI;
    cam.aspect = size.width / size.height;
    cam.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}
