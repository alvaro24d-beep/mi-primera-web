"use client";

import { useEffect, useRef } from "react";
import { useCardDisturbance } from "@/store/useCardDisturbance";

const MAX_DISTURB = 5;

// Same math as the original per-pixel canvas version, translated to GLSL so
// the GPU evaluates every pixel in parallel instead of a serial JS loop —
// this is what made the effect expensive (main-thread CPU, one pixel at a
// time). Native `sin`/`cos` replace the old lookup-table approximation since
// the GPU runs them at full precision for free.
const VERTEX_SRC = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SRC = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uDisturbPos[5];
uniform float uDisturbStrength[5];

void main() {
  vec2 fc = gl_FragCoord.xy;
  float ux = (fc.x * 2.0 - uResolution.x) / uResolution.y;
  float uy = (fc.y * 2.0 - uResolution.y) / uResolution.y;

  float t05 = uTime * 0.5;
  float t03 = uTime * 0.3;
  float t02 = uTime * 0.2;

  float aa = 0.0;
  float d = 0.0;
  for (int ii = 0; ii < 4; ii++) {
    float fi = float(ii);
    aa += cos(fi - d + t05 - aa * ux);
    d += sin(fi * uy + aa);
  }

  float wave = (sin(aa) + cos(d)) * 0.5;
  float intensity = 0.3 + 0.4 * wave;
  float baseVal = 0.1 + 0.15 * cos(ux + uy + t03);
  float blueAcc = 0.2 * sin(aa * 1.5 + t02);
  float purpAcc = 0.15 * cos(d * 2.0 + t02);

  float r = (baseVal + purpAcc * 0.8) * intensity;
  float g = (baseVal + blueAcc * 0.6) * intensity;
  float b = (baseVal + blueAcc * 1.2 + purpAcc * 0.4) * intensity;

  // Servicios cards (DOM, not WebGL) push their screen-space position + hover
  // strength into store/useCardDisturbance.ts; read here each frame so
  // hovering/tilting a glass card visibly disturbs the ambient canvas behind
  // it — same normalized/aspect-corrected space as the wave math above, so
  // the ripple lines up with the actual card position on screen.
  for (int di = 0; di < 5; di++) {
    float str = uDisturbStrength[di];
    if (str <= 0.001) continue;
    vec2 dScreen = vec2(uDisturbPos[di].x * uResolution.x, (1.0 - uDisturbPos[di].y) * uResolution.y);
    float dux = (dScreen.x * 2.0 - uResolution.x) / uResolution.y;
    float duy = (dScreen.y * 2.0 - uResolution.y) / uResolution.y;
    float dist = distance(vec2(ux, uy), vec2(dux, duy));
    float ripple = sin(dist * 10.0 - uTime * 2.0) * 0.5 + 0.5;
    float falloff = smoothstep(0.9, 0.0, dist) * str;
    float bump = falloff * (0.16 + 0.1 * ripple);
    r += bump * 0.85;
    g += bump * 1.0;
    b += bump * 1.15;
  }

  gl_FragColor = vec4(clamp(r, 0.0, 1.0), clamp(g, 0.0, 1.0), clamp(b, 0.0, 1.0), 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const resolutionLoc = gl.getUniformLocation(program, "uResolution");
    const timeLoc = gl.getUniformLocation(program, "uTime");
    const disturbPosLoc = gl.getUniformLocation(program, "uDisturbPos");
    const disturbStrengthLoc = gl.getUniformLocation(program, "uDisturbStrength");
    // Reused every frame instead of allocated fresh — avoids GC churn in the
    // render loop for what's otherwise a tiny, fixed-size payload.
    const disturbPosArr = new Float32Array(MAX_DISTURB * 2);
    const disturbStrengthArr = new Float32Array(MAX_DISTURB);

    // A soft, slow gradient doesn't need retina resolution — capping the pixel
    // ratio (esp. on phones, where the backing store is otherwise 2-3x the CSS
    // pixels) is the single biggest GPU/heat saving here for zero visible loss.
    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);
    let stableW = window.innerWidth;
    let stableH = window.innerHeight;

    function resize() {
      canvas!.width = Math.round(stableW * dpr);
      canvas!.height = Math.round(stableH * dpr);
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();

    // Ignore height-only changes below this threshold: that's the mobile
    // toolbar showing/hiding, not a real resize or orientation change.
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const widthChanged = w !== stableW;
      const heightJump = Math.abs(h - stableH) >= 150;
      if (!widthChanged && !heightJump) return;
      stableW = w;
      stableH = h;
      resize();
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Throttle to ~30fps: the wave animates slowly, so half the frames look
    // identical to the eye but cost half the GPU fill. `uTime` is derived from
    // the real timestamp (not a frame counter), so dropping frames keeps the
    // motion perfectly time-accurate.
    const frameInterval = 1000 / 30;
    const start = performance.now();
    let rafId = 0;
    let lastDraw = -Infinity;
    let running = true;

    function render(now: number) {
      rafId = requestAnimationFrame(render);
      if (now - lastDraw < frameInterval) return;
      lastDraw = now;
      gl!.uniform2f(resolutionLoc, canvas!.width, canvas!.height);
      gl!.uniform1f(timeLoc, (now - start) * 0.001);

      // `.getState()` (not the reactive `useCardDisturbance()` hook) — this
      // is a plain read every frame, same as `dom{}`/scroll state elsewhere
      // in this file, so Servicios.tsx writing to the store on every
      // mousemove never triggers a React re-render anywhere.
      const points = useCardDisturbance.getState().points;
      for (let i = 0; i < MAX_DISTURB; i++) {
        const p = points[i];
        if (p) {
          disturbPosArr[i * 2] = p.x;
          disturbPosArr[i * 2 + 1] = p.y;
          disturbStrengthArr[i] = p.strength;
        } else {
          disturbStrengthArr[i] = 0;
        }
      }
      gl!.uniform2fv(disturbPosLoc, disturbPosArr);
      gl!.uniform1fv(disturbStrengthLoc, disturbStrengthArr);

      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }

    // Don't burn the GPU animating a background nobody is looking at (tab in the
    // background / screen off) — a major battery + heat win.
    const onVisibility = () => {
      if (document.hidden) {
        if (running) {
          running = false;
          cancelAnimationFrame(rafId);
        }
      } else if (!running) {
        running = true;
        lastDraw = -Infinity;
        rafId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100lvh",
        zIndex: -1000,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
