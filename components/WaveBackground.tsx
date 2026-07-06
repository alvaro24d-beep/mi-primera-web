"use client";

import { useEffect, useRef } from "react";

export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const off = document.createElement("canvas");
    const octx = off.getContext("2d", { alpha: false });
    if (!octx) return;

    const isMobile = window.innerWidth < 768;
    const BASE_SCALE = isMobile ? 5 : 3;
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const FPS = isMobile ? 20 : 30;
    const FRAME_TIME = 1000 / FPS;
    let lastFrame = 0;
    let width = 0;
    let height = 0;
    let imageData: ImageData | null = null;
    let data: Uint8ClampedArray | null = null;

    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;

    const SIN = new Float32Array(1024);
    const COS = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const a = (i / 1024) * Math.PI * 2;
      SIN[i] = Math.sin(a);
      COS[i] = Math.cos(a);
    }
    const fastSin = (x: number) => SIN[((x * 159.1549) | 0) & 1023];
    const fastCos = (x: number) => COS[((x * 159.1549) | 0) & 1023];

    function resize(force: boolean) {
      const dw = window.innerWidth;
      const dh = window.innerHeight;
      // Ignore height-only changes below this threshold: that's the mobile
      // toolbar showing/hiding, not a real resize or orientation change.
      if (!force && dw === lastWidth && Math.abs(dh - lastHeight) < 150) return;
      lastWidth = dw;
      lastHeight = dh;
      canvas!.width = Math.round(dw * dpr);
      canvas!.height = Math.round(dh * dpr);
      off.width = (dw / BASE_SCALE) | 0;
      off.height = (dh / BASE_SCALE) | 0;
      width = off.width;
      height = off.height;
      imageData = octx!.createImageData(width, height);
      data = imageData.data;
    }

    const onResize = () => resize(false);
    window.addEventListener("resize", onResize);
    resize(true);

    const start = Date.now();
    let rafId = 0;

    function render(now: number) {
      rafId = requestAnimationFrame(render);
      if (now - lastFrame < FRAME_TIME) return;
      lastFrame = now;
      if (!data) return;

      const time = (Date.now() - start) * 0.001;
      const t05 = time * 0.5;
      const t03 = time * 0.3;
      const t02 = time * 0.2;
      const w = width;
      const h = height;

      for (let y = 0; y < h; y++) {
        const uy = (y * 2 - h) / h;
        for (let x = 0; x < w; x++) {
          const ux = (x * 2 - w) / h;
          let aa = 0;
          let d = 0;
          for (let ii = 0; ii < 4; ii++) {
            aa += fastCos(ii - d + t05 - aa * ux);
            d += fastSin(ii * uy + aa);
          }
          const wave = (fastSin(aa) + fastCos(d)) * 0.5;
          const intensity = 0.3 + 0.4 * wave;
          const baseVal = 0.1 + 0.15 * fastCos(ux + uy + t03);
          const blueAcc = 0.2 * fastSin(aa * 1.5 + t02);
          const purpAcc = 0.15 * fastCos(d * 2 + t02);

          const r = (baseVal + purpAcc * 0.8) * intensity;
          const g = (baseVal + blueAcc * 0.6) * intensity;
          const b = (baseVal + blueAcc * 1.2 + purpAcc * 0.4) * intensity;

          const i4 = (y * w + x) * 4;
          data[i4] = r < 0 ? 0 : r > 1 ? 255 : (r * 255) | 0;
          data[i4 + 1] = g < 0 ? 0 : g > 1 ? 255 : (g * 255) | 0;
          data[i4 + 2] = b < 0 ? 0 : b > 1 ? 255 : (b * 255) | 0;
          data[i4 + 3] = 255;
        }
      }

      octx!.putImageData(imageData!, 0, 0);
      ctx!.drawImage(off, 0, 0, width, height, 0, 0, canvas!.width, canvas!.height);
    }

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
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
