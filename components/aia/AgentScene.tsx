"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// The WebGL half of the /agentes-ia hero. The DOM half (AgentesIaHero.tsx)
// owns the GSAP ScrollTrigger timeline and writes plain numbers into `drive`;
// this scene only READS them in useFrame (the driver/consumer split mandated
// by AGENTS.md — a ScrollTrigger created inside <Canvas> pins nothing).
//
// Representational, not abstract (golden rule): the scene renders the agent's
// MACHINERY — an AI core chip that wakes up, light beams carrying pulses from
// the customer's chat into the core and out to the tool chips, and an ambient
// neural network — while the story's crisp text (chat bubbles, tool labels)
// stays in the DOM layered on top.

export type AiaDrive = {
  /** 0→1 core wake-up (emissive ramp). */
  core: number;
  /** 0→1 "reading the message": chat→core beam + inbound pulses. */
  read: number;
  /** 0→1 per tool: core→tool beam + outbound pulse. */
  t0: number;
  t1: number;
  t2: number;
  /** 0→1 reply: core→chat beam flash. */
  reply: number;
};

/** Anchor centres in CSS px relative to the stage (== this canvas). Measured
 * by AgentesIaHero from layout offsets (transform-free) and re-broadcast via
 * the "nxr-aia-layout" window event. */
export type AiaLayout = {
  ready: boolean;
  core: { x: number; y: number };
  chat: { x: number; y: number };
  tools: { x: number; y: number }[];
};

type V2 = { x: number; y: number };

// Same pixel-perfect camera math as the global scene's PixelCamera: FOV chosen
// so 1 world unit == 1 CSS px at z=0, letting every position below be plain
// pixel coordinates measured off the DOM.
const CAM_Z = 1000;

function PixelCam() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    camera.position.set(0, 0, CAM_Z);
    camera.fov = (2 * Math.atan(size.height / 2 / CAM_Z) * 180) / Math.PI;
    camera.near = 100;
    camera.far = 4000;
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

/** px (top-left origin) → world units (centre origin, y up). */
function toWorld(p: V2, w: number, h: number): V2 {
  return { x: p.x - w / 2, y: h / 2 - p.y };
}

// ---------------------------------------------------------------------------
// Ambient neural field: dim nodes joined by edges, with a few bright pulses
// travelling along random edges — "a network thinking" as the depth backdrop.
// ---------------------------------------------------------------------------
function NeuralField({ isMobile }: { isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const size = useThree((s) => s.size);

  const net = useMemo(() => {
    const count = isMobile ? 16 : 28;
    const spreadX = size.width * 0.62;
    const spreadY = size.height * 0.55;
    const nodes = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 2 * spreadX,
      y: (Math.random() - 0.5) * 2 * spreadY,
      z: -260 - Math.random() * 480,
    }));
    // Each node links to its 2 nearest neighbours (deduped) — reads as a net,
    // not a scribble.
    const seen = new Set<string>();
    const edges: [number, number][] = [];
    nodes.forEach((a, i) => {
      const byDist = nodes
        .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 }))
        .filter((e) => e.j !== i)
        .sort((p, q) => p.d - q.d)
        .slice(0, 2);
      for (const { j } of byDist) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push(i < j ? [i, j] : [j, i]);
        }
      }
    });

    const linePos = new Float32Array(edges.length * 6);
    edges.forEach(([i, j], k) => {
      linePos.set([nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z], k * 6);
    });

    const pointPos = new Float32Array(count * 3);
    const pointCol = new Float32Array(count * 3);
    const lime = new THREE.Color("#a8f04a");
    const salmon = new THREE.Color("#ff9d7d");
    const dim = new THREE.Color("#9aa3b5");
    nodes.forEach((n, i) => {
      pointPos.set([n.x, n.y, n.z], i * 3);
      const c = i % 5 === 0 ? lime : i % 7 === 0 ? salmon : dim;
      pointCol.set([c.r, c.g, c.b], i * 3);
    });

    const travelers = Array.from({ length: isMobile ? 3 : 5 }, (_, i) => ({
      edge: edges.length ? i % edges.length : 0,
      speed: 0.12 + Math.random() * 0.2,
      phase: Math.random(),
    }));

    return { nodes, edges, linePos, pointPos, pointCol, travelers };
  }, [isMobile, size.width, size.height]);

  const travelerRefs = useRef<(THREE.Mesh | null)[]>([]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    mouse.current.x += (target.current.x - mouse.current.x) * 0.04;
    mouse.current.y += (target.current.y - mouse.current.y) * 0.04;
    const t = state.clock.elapsedTime;
    g.rotation.y = mouse.current.x * 0.08 + Math.sin(t * 0.05) * 0.03;
    g.rotation.x = -mouse.current.y * 0.05;

    net.travelers.forEach((tr, i) => {
      const mesh = travelerRefs.current[i];
      const edge = net.edges[tr.edge];
      if (!mesh || !edge) return;
      const a = net.nodes[edge[0]];
      const b = net.nodes[edge[1]];
      const u = (t * tr.speed + tr.phase) % 1;
      mesh.position.set(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
    });
  });

  return (
    <group ref={groupRef}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[net.linePos, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#8fa0c0" transparent opacity={0.08} depthWrite={false} />
      </lineSegments>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[net.pointPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[net.pointCol, 3]} />
        </bufferGeometry>
        <pointsMaterial vertexColors size={4} sizeAttenuation={false} transparent opacity={0.5} depthWrite={false} />
      </points>
      {net.travelers.map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            travelerRefs.current[i] = m;
          }}
        >
          <sphereGeometry args={[2.4, 8, 8]} />
          <meshBasicMaterial color="#a8f04a" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// The agent's core: a processor chip with brand-lime circuit traces that wakes
// up (emissive ramp) as the timeline reaches the "thinking" phase, plus two
// counter-rotating "reasoning" rings that only exist while it processes.
// ---------------------------------------------------------------------------
function makeCircuitTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  // Transparent background: this texture goes on a meshBasicMaterial plane
  // floating just above the chip face (emissiveMap over drei's RoundedBox
  // UVs rendered as a uniform smear — verified via Playwright screenshot),
  // so only the traces/icon pixels paint.
  ctx.clearRect(0, 0, 256, 256);

  // Circuit traces: elbowed lines running from the edges toward the centre,
  // each ending in a solder pad — the classic PCB read.
  ctx.strokeStyle = "rgba(190, 255, 120, 0.85)";
  ctx.fillStyle = "rgba(190, 255, 120, 0.95)";
  ctx.lineWidth = 3;
  const traces = 14;
  for (let i = 0; i < traces; i++) {
    const side = i % 4;
    const along = 28 + ((i * 67) % 200);
    const depth = 46 + ((i * 41) % 52);
    ctx.beginPath();
    if (side === 0) {
      ctx.moveTo(along, 0);
      ctx.lineTo(along, depth);
      ctx.lineTo(along + (i % 2 ? 22 : -22), depth);
    } else if (side === 1) {
      ctx.moveTo(along, 256);
      ctx.lineTo(along, 256 - depth);
      ctx.lineTo(along + (i % 2 ? 22 : -22), 256 - depth);
    } else if (side === 2) {
      ctx.moveTo(0, along);
      ctx.lineTo(depth, along);
      ctx.lineTo(depth, along + (i % 2 ? 22 : -22));
    } else {
      ctx.moveTo(256, along);
      ctx.lineTo(256 - depth, along);
      ctx.lineTo(256 - depth, along + (i % 2 ? 22 : -22));
    }
    ctx.stroke();
    const px = side === 0 ? along + (i % 2 ? 22 : -22) : side === 1 ? along + (i % 2 ? 22 : -22) : side === 2 ? depth : 256 - depth;
    const py = side === 0 ? depth : side === 1 ? 256 - depth : along + (i % 2 ? 22 : -22);
    ctx.fillRect(px - 4, py - 4, 8, 8);
  }

  // Centre: the same node-asterisk used as the Agentes IA icon in the header
  // dropdown — circle + 8 rays.
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(128, 128, 17, 0, Math.PI * 2);
  ctx.fill();
  for (let r = 0; r < 8; r++) {
    const a = (r / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 26, 128 + Math.sin(a) * 26);
    ctx.lineTo(128 + Math.cos(a) * 44, 128 + Math.sin(a) * 44);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function CoreChip({ drive, pos, isMobile }: { drive: RefObject<AiaDrive>; pos: V2; isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const faceMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  const circuitTex = useMemo(() => makeCircuitTexture(), []);
  useEffect(() => () => circuitTex.dispose(), [circuitTex]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state) => {
    const g = groupRef.current;
    const d = drive.current;
    if (!g || !d) return;
    const t = state.clock.elapsedTime;
    mouse.current.x += (target.current.x - mouse.current.x) * 0.05;
    mouse.current.y += (target.current.y - mouse.current.y) * 0.05;

    g.position.set(pos.x, pos.y + Math.sin(t * 0.9) * 5, 0);
    g.rotation.y = Math.sin(t * 0.4) * 0.16 + mouse.current.x * 0.22;
    g.rotation.x = Math.sin(t * 0.31) * 0.08 - mouse.current.y * 0.14;
    // Phones: the chip lives behind the chat glass — smaller so its glow
    // reads as a core inside the panel, not a slab filling it.
    const base = isMobile ? 0.72 : 1;
    const wake = 1 + d.core * 0.06 + Math.sin(t * 2.2) * 0.008 * d.core;
    g.scale.setScalar(base * wake);

    if (matRef.current) matRef.current.emissiveIntensity = 0.06 + d.core * 0.3;
    if (faceMatRef.current) faceMatRef.current.opacity = 0.3 + d.core * 0.7;

    const think = Math.max(d.read, Math.max(d.t0, Math.max(d.t1, d.t2)) * 0.8);
    if (ringARef.current) {
      ringARef.current.rotation.z = t * (0.4 + think * 2.2);
      (ringARef.current.material as THREE.MeshBasicMaterial).opacity = think * (0.3 + 0.15 * Math.sin(t * 6));
    }
    if (ringBRef.current) {
      ringBRef.current.rotation.z = -t * (0.3 + think * 1.7);
      (ringBRef.current.material as THREE.MeshBasicMaterial).opacity = think * (0.22 + 0.12 * Math.sin(t * 5 + 1.7));
    }
  });

  return (
    <group ref={groupRef}>
      <RoundedBox args={[96, 96, 16]} radius={9} smoothness={3}>
        <meshStandardMaterial
          ref={matRef}
          color="#0f131d"
          metalness={0.55}
          roughness={0.38}
          emissive="#a8f04a"
          emissiveIntensity={0.06}
        />
      </RoundedBox>
      {/* Circuit face: plain textured plane floating over the chip — crisp,
          light-independent, and it catches Bloom as the core wakes. */}
      <mesh position={[0, 0, 8.6]}>
        <planeGeometry args={[86, 86]} />
        <meshBasicMaterial ref={faceMatRef} map={circuitTex} transparent opacity={0.3} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={ringARef} position={[0, 0, 12]}>
        <torusGeometry args={[72, 1.4, 8, 64]} />
        <meshBasicMaterial color="#a8f04a" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ringBRef} position={[0, 0, 10]} rotation={[0.5, 0, 0]}>
        <torusGeometry args={[86, 1.1, 8, 64]} />
        <meshBasicMaterial color="#ff9d7d" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// A beam: bezier tube between two measured anchors + a pulse travelling along
// it. `get` reads the 0→1 phase progress from the drive ref each frame;
// `dir` -1 makes pulses travel b→a (the "reading" beam flows INTO the core).
// ---------------------------------------------------------------------------
function Beam({
  a,
  b,
  color,
  get,
  dir = 1,
  bow = 60,
}: {
  a: V2;
  b: V2;
  color: string;
  get: () => number;
  dir?: 1 | -1;
  bow?: number;
}) {
  const tubeMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const built = useMemo(() => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    // Perpendicular bow so parallel beams don't overlap into one bright bar.
    const nx = -dy / len;
    const ny = dx / len;
    const mid = new THREE.Vector3(a.x + dx / 2 + nx * bow, a.y + dy / 2 + ny * bow, 26);
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(a.x, a.y, 4),
      mid,
      new THREE.Vector3(b.x, b.y, 4)
    );
    return { curve, geo: new THREE.TubeGeometry(curve, 36, 1.4, 6, false) };
  }, [a.x, a.y, b.x, b.y, bow]);

  useEffect(() => () => built.geo.dispose(), [built]);

  useFrame((state) => {
    const p = get();
    if (tubeMatRef.current) tubeMatRef.current.opacity = p * 0.55;
    const pulse = pulseRef.current;
    if (pulse) {
      const visible = p > 0.05;
      pulse.visible = visible;
      if (visible) {
        const u = (state.clock.elapsedTime * 0.55) % 1;
        // While the phase is ramping, the pulse only travels as far as the
        // beam has "grown"; once complete it free-runs end to end.
        const capped = Math.min(u, Math.max(p, 0.02));
        built.curve.getPointAt(dir === 1 ? capped : 1 - capped, pulse.position);
        (pulse.material as THREE.MeshBasicMaterial).opacity = Math.min(1, p * 1.6) * 0.9;
      }
    }
  });

  return (
    <group>
      <mesh geometry={built.geo}>
        <meshBasicMaterial ref={tubeMatRef} color={color} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={pulseRef} visible={false}>
        <sphereGeometry args={[3.6, 10, 10]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene content: waits for the DOM to broadcast measured anchor positions
// (window "nxr-aia-layout" event → React state — NEVER setState inside
// useFrame, see vault Bug-Log-SetState-En-UseFrame-Se-Traga).
// ---------------------------------------------------------------------------
function SceneContent({ drive, layout, isMobile }: { drive: RefObject<AiaDrive>; layout: RefObject<AiaLayout>; isMobile: boolean }) {
  const size = useThree((s) => s.size);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener("nxr-aia-layout", bump);
    return () => window.removeEventListener("nxr-aia-layout", bump);
  }, []);

  // Recompute world-space anchor points whenever the DOM re-measures or the
  // canvas resizes. `version` is the invalidation signal for the mutable ref.
  const anchors = useMemo(() => {
    void version;
    const l = layout.current;
    if (!l || !l.ready) return null;
    return {
      core: toWorld(l.core, size.width, size.height),
      chat: toWorld(l.chat, size.width, size.height),
      tools: l.tools.map((t) => toWorld(t, size.width, size.height)),
    };
  }, [layout, version, size.width, size.height]);

  const d = drive;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[300, 400, 600]} intensity={0.9} />
      <NeuralField isMobile={isMobile} />
      {anchors && (
        <>
          <CoreChip drive={d} pos={anchors.core} isMobile={isMobile} />
          {/* Customer message flowing INTO the core while it reads… */}
          <Beam a={anchors.chat} b={anchors.core} color="#ff9d7d" get={() => Math.max(d.current.read, d.current.reply * 0.85)} dir={-1} bow={-46} />
          {/* …then the core reaches out to each tool… */}
          {anchors.tools.map((t, i) => (
            <Beam
              key={i}
              a={anchors.core}
              b={t}
              color="#a8f04a"
              get={() => (i === 0 ? d.current.t0 : i === 1 ? d.current.t1 : d.current.t2)}
              bow={i === 1 ? 0 : i === 0 ? 44 : -44}
            />
          ))}
          {/* …and replies back to the chat. */}
          <Beam a={anchors.core} b={anchors.chat} color="#a8f04a" get={() => d.current.reply} bow={46} />
        </>
      )}
    </>
  );
}

export default function AgentScene({ drive, layout }: { drive: RefObject<AiaDrive>; layout: RefObject<AiaLayout> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Same mobile split as dwh/HeroScene: no post-processing, no antialias and a
  // lower DPR cap on phones (Bloom is the top heat source) — a CSS radial
  // vignette on the wrapper stands in for the framing.
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  // Render only while on-screen + tab visible (the page is long; this stops
  // the loop for most of the scroll).
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let inView = true;
    let visible = document.visibilityState === "visible";
    const update = () => setActive(inView && visible);
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        update();
      },
      { rootMargin: "150px" }
    );
    io.observe(el);
    const onVis = () => {
      visible = document.visibilityState === "visible";
      update();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <Canvas
      ref={canvasRef}
      frameloop={active ? "always" : "never"}
      dpr={isMobile ? [1, 1.25] : [1, 2]}
      gl={{ alpha: true, antialias: !isMobile, powerPreference: "high-performance" }}
    >
      <PixelCam />
      <SceneContent drive={drive} layout={layout} isMobile={isMobile} />
      {!isMobile && (
        <EffectComposer multisampling={2}>
          <Bloom mipmapBlur luminanceThreshold={0.5} luminanceSmoothing={0.3} intensity={0.45} />
          <Vignette eskil={false} offset={0.3} darkness={0.65} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
