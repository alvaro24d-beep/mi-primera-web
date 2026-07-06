"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const SEC_IDS = [
  "nxr-hero",
  "nxr-intro",
  "nxr-servicios",
  "nxr-zoom-parallax",
  "nxr-proceso",
  "nxr-tech",
  "nxr-contacto",
] as const;

type SecId = (typeof SEC_IDS)[number];

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mobile browsers resize the viewport (and fire `resize`) as their
    // address/tab bar collapses on scroll. Reacting to that live would make
    // the scene's camera/particle sizing lurch every time it happens, so we
    // track a "stable" size that only updates on real resizes (orientation
    // change, actual window resize) — see `onResize` below.
    let stableW = window.innerWidth;
    let stableH = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, stableW / stableH, 1, 3000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(stableW, stableH);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const isMobile = stableW < 768;
    const COUNT = isMobile ? 1000 : 2200;

    const geo = new THREE.SphereGeometry(isMobile ? 0.4 : 0.6, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xa8f04a),
      transparent: true,
      opacity: 0.85,
    });

    const mesh = new THREE.InstancedMesh(geo, mat, COUNT);
    scene.add(mesh);

    const dummy = new THREE.Object3D();
    const pos: THREE.Vector3[] = [];
    const tgt: THREE.Vector3[] = [];
    type Meta = {
      phi: number;
      theta: number;
      ex: number;
      ey: number;
      ez: number;
      phase: number;
      speed: number;
      offset: number;
      lane: number;
    };
    const meta: Meta[] = [];

    for (let i = 0; i < COUNT; i++) {
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * 900,
        (Math.random() - 0.5) * 700,
        (Math.random() - 0.5) * 300
      );
      pos.push(v.clone());
      tgt.push(v.clone());

      const phi = Math.acos(-1 + (2 * i) / COUNT);
      const theta = Math.sqrt(COUNT * Math.PI) * phi;

      let ex = Math.random() - 0.5;
      let ey = Math.random() - 0.5;
      let ez = (Math.random() - 0.5) * 0.35;
      const el = Math.sqrt(ex * ex + ey * ey + ez * ez) + 0.0001;
      ex /= el;
      ey /= el;
      ez /= el;

      meta.push({
        phi,
        theta,
        ex,
        ey,
        ez,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
        offset: Math.random(),
        lane: i % 7,
      });
    }

    const dom: Partial<Record<SecId, { top: number; height: number }>> = {};

    function detect() {
      SEC_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        dom[id] = {
          top: el.getBoundingClientRect().top + scrollY,
          height: el.offsetHeight,
        };
      });
    }

    function getState(sy: number) {
      const vh = stableH;

      let activeSec: SecId = SEC_IDS[0];
      let secT = 0;
      for (let i = SEC_IDS.length - 1; i >= 0; i--) {
        const s = dom[SEC_IDS[i]];
        if (!s) continue;
        if (sy + vh * 0.4 >= s.top) {
          activeSec = SEC_IDS[i];
          secT = Math.max(0, Math.min(1, (sy + vh * 0.4 - s.top) / (s.height + vh * 0.3)));
          break;
        }
      }

      const zs = dom["nxr-zoom-parallax"];
      const ss = dom["nxr-servicios"];

      const pastZoom = zs ? sy >= zs.top + zs.height * 0.85 : false;

      let preZoom = 0;
      if (!pastZoom && activeSec !== "nxr-zoom-parallax" && zs && ss) {
        const start = ss.top + ss.height * 0.5;
        const end = zs.top;
        if (end > start && sy < end) {
          preZoom = Math.max(0, Math.min(1, (sy - start) / (end - start)));
        }
      }

      let postZoom = 0;
      if (zs) {
        postZoom = Math.max(0, Math.min(1, (sy - zs.top) / zs.height));
      }

      // 0 while still inside the intro sphere, ramping to 1 over a scroll
      // window right after it — lets the sphere's rotation/breathing relax
      // into free floating gradually instead of snapping to it the instant
      // "servicios" becomes the active section.
      let introRelease = 1;
      const introDom = dom["nxr-intro"];
      if (introDom) {
        const introBottom = introDom.top + introDom.height;
        const progressPastIntro = sy + vh * 0.4 - introBottom;
        introRelease = progressPastIntro <= 0 ? 0 : Math.min(1, progressPastIntro / (vh * 0.8));
      }

      return { activeSec, secT, preZoom, postZoom, pastZoom, introRelease };
    }

    const ss3 = (t: number) => t * t * (3 - 2 * t);

    function targetSphere(i: number, m: Meta, radius: number, time: number) {
      const breathe = Math.sin(time * m.speed * 0.5 + m.phase) * 9;
      const r = radius + breathe;
      const th = m.theta + time * 0.05;
      tgt[i].set(
        r * Math.cos(th) * Math.sin(m.phi),
        r * Math.sin(th) * Math.sin(m.phi),
        r * Math.cos(m.phi) * 0.55
      );
    }

    function targetExplosion(i: number, m: Meta, postZoom: number, time: number) {
      const t = Math.min(postZoom * 1.4, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const r = ease * (180 + m.offset * 440);
      const spin = time * (0.2 + m.speed * 0.12);
      const drift = ease * 18;
      tgt[i].set(
        m.ex * r + Math.sin(spin + m.phase) * drift,
        m.ey * r + Math.cos(spin * 0.65 + m.phase) * drift,
        m.ez * r + Math.sin(spin * 0.4 + m.phase) * drift * 0.4
      );
    }

    function targetFlow(i: number, m: Meta, time: number) {
      const wx = Math.sin(time * m.speed * 0.22 + m.phase) * 70;
      const wy = Math.cos(time * m.speed * 0.17 + m.phase * 1.4) * 55;
      const wz = Math.sin(time * m.speed * 0.11 + m.phase * 0.9) * 30;
      tgt[i].set(pos[i].x + wx, pos[i].y + wy, pos[i].z + wz);
    }

    const COLOR = new THREE.Color(0xffffff);

    let sy = 0;
    let ty = 0;
    let mx = 0;
    let my = 0;
    let prevSec = "";
    let colorT = 1;
    const curCol = new THREE.Color(0xa8f04a);
    const nxtCol = new THREE.Color(0xa8f04a);
    const eio = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    const onScroll = () => {
      ty = scrollY;
    };
    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
    };
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Ignore height-only changes below this threshold: that's the mobile
      // toolbar showing/hiding, not a real resize or orientation change.
      const widthChanged = w !== stableW;
      const heightJump = Math.abs(h - stableH) >= 150;
      if (!widthChanged && !heightJump) return;

      stableW = w;
      stableH = h;
      camera.aspect = stableW / stableH;
      camera.updateProjectionMatrix();
      renderer.setSize(stableW, stableH);
      detect();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("resize", onResize);

    let time = 0;
    let rafId = 0;

    function animate() {
      rafId = requestAnimationFrame(animate);
      time += 0.016;

      sy += (ty - sy) * 0.07;

      const { activeSec, secT, preZoom, postZoom, pastZoom, introRelease } = getState(sy);

      if (activeSec !== prevSec) {
        prevSec = activeSec;
        curCol.copy(mat.color);
        nxtCol.copy(COLOR);
        colorT = 0;
      }
      colorT = Math.min(1, colorT + 0.025);
      mat.color.copy(curCol).lerp(nxtCol, eio(colorT));

      camera.position.x += (mx * 50 - camera.position.x) * 0.04;
      camera.position.y += (-my * 50 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      const isMobileNow = stableW < 768;

      for (let i = 0; i < COUNT; i++) {
        const m = meta[i];

        if (pastZoom) {
          targetFlow(i, m, time);
        } else if (activeSec === "nxr-zoom-parallax") {
          targetExplosion(i, m, postZoom, time);
        } else if (preZoom > 0.001) {
          if (activeSec === "nxr-hero" || activeSec === "nxr-intro") {
            targetSphere(i, m, 220, time);
          } else {
            targetFlow(i, m, time);
          }
          const fx = tgt[i].x;
          const fy = tgt[i].y;
          const fz = tgt[i].z;

          const p = ss3(preZoom);
          const r = 350 * (1 - p);
          const th = m.theta + time * 0.1;
          const gx = r * Math.cos(th) * Math.sin(m.phi);
          const gy = r * Math.sin(th) * Math.sin(m.phi);
          const gz = r * Math.cos(m.phi) * 0.4;

          const blend = eio(preZoom);
          tgt[i].set(fx + (gx - fx) * blend, fy + (gy - fy) * blend, fz + (gz - fz) * blend);
        } else if (activeSec === "nxr-hero" || activeSec === "nxr-intro") {
          const radius =
            activeSec === "nxr-hero"
              ? (isMobileNow ? 90 : 180) + secT * (isMobileNow ? 20 : 80)
              : (isMobileNow ? 180 : 260) + secT * (isMobileNow ? 60 : 100);
          targetSphere(i, m, radius, time);
        } else if (introRelease < 1) {
          // Just past the intro sphere: crossfade its shape into free
          // floating over `introRelease` instead of snapping to it the
          // instant the section boundary is crossed.
          const introEndRadius = isMobileNow ? 240 : 360;
          targetSphere(i, m, introEndRadius, time);
          const sx = tgt[i].x;
          const sy2 = tgt[i].y;
          const sz = tgt[i].z;

          targetFlow(i, m, time);

          const blend = eio(introRelease);
          tgt[i].set(sx + (tgt[i].x - sx) * blend, sy2 + (tgt[i].y - sy2) * blend, sz + (tgt[i].z - sz) * blend);
        } else {
          targetFlow(i, m, time);
        }

        pos[i].lerp(tgt[i], 0.05);
        dummy.position.copy(pos[i]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    }

    detect();
    window.addEventListener("load", detect);
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", detect);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100lvh",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}
