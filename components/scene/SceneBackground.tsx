"use client";

// Placeholder for now — step 6 of the build replaces this with the ported
// WaveBackground.tsx GLSL (fbm-style gradient) as a Three.js ShaderMaterial
// on a full-screen plane, wired to store/useCardDisturbance.ts. Kept as its
// own file/component from the start so that swap doesn't touch SceneCanvas.
export default function SceneBackground() {
  return (
    <mesh position={[0, 0, -600]}>
      <planeGeometry args={[6000, 6000]} />
      <meshBasicMaterial color="#05070d" />
    </mesh>
  );
}
