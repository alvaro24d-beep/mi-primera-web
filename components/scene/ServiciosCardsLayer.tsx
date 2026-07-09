"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import VolumetricCard from "./VolumetricCard";
import { useServiciosCardsRegistry, type CardStyle } from "@/store/useServiciosCardsRegistry";

const MAX_CARDS = 5;
const DEFAULT_STYLE: CardStyle = { color: "#0d1520", material: "glass", curveX: 0.06, curveY: 0 };
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
function CardSlot({ id }: { id: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { size } = useThree();
  const [dims, setDims] = useState({ width: 420, height: 560 });
  const [style, setStyle] = useState<CardStyle>(DEFAULT_STYLE);
  const lastDims = useRef(dims);
  const lastStyle = useRef(style);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const slot = useServiciosCardsRegistry.getState().slots[id];
    if (!slot?.rect) {
      group.visible = false;
      return;
    }

    group.visible = true;
    const { x, y, width, height } = slot.rect;
    const t = slot.transform;
    group.position.x = x + width / 2 - size.width / 2 + t.x;
    group.position.y = -(y + height / 2 - size.height / 2) + t.y;
    group.position.z = t.z;
    group.rotation.x = t.rotationX * DEG2RAD;
    group.rotation.y = t.rotationY * DEG2RAD;
    group.scale.setScalar(t.scale);

    if (width !== lastDims.current.width || height !== lastDims.current.height) {
      lastDims.current = { width, height };
      setDims({ width, height });
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
  });

  return (
    <group ref={groupRef} visible={false}>
      <VolumetricCard
        width={dims.width}
        height={dims.height}
        thickness={10}
        radius={24}
        curveX={style.curveX}
        curveY={style.curveY}
        color={style.color}
        material={style.material}
      />
    </group>
  );
}

export default function ServiciosCardsLayer({ isMobile }: { isMobile: boolean }) {
  void isMobile;
  return (
    <>
      {Array.from({ length: MAX_CARDS }, (_, i) => (
        <CardSlot key={i} id={i} />
      ))}
    </>
  );
}
