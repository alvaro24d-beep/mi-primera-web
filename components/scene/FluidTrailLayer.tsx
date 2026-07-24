"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

// ESTELA DE HUMO FLUIDO del cursor, DENTRO del canvas WebGL global.
//
// Port de la simulación de fluidos del SplashCursor de React Bits (Pavel
// Dobryakov) a pases de three.js sobre el renderer de la escena. El motivo es
// duro y medido: el componente original monta su PROPIO contexto WebGL
// fullscreen, y la mera existencia de un segundo contexto componiéndose con
// la escena R3F hundía la página de ~60 a ~20 fps al mover el ratón —
// independientemente de la resolución o el ritmo de la simulación. En el
// MISMO contexto no hay segunda superficie que componer ni sincronización
// entre contextos: solo queda el coste de la simulación en sí (framebuffers
// diminutos: sim 96, tinte 720).
//
// La sim corre en useFrame con prioridad negativa (antes del render
// principal) escribiendo a render targets propios; el resultado se compone
// como un plano fullscreen (blending premultiplicado, depthTest off,
// renderOrder alto) que además recibe el Bloom del composer. Se PAUSA sola
// ~4s tras el último movimiento (el tinte ya es invisible) — coste cero en
// reposo. Solo se monta en desktop (SceneCanvas) y se desactiva con
// prefers-reduced-motion.

const SIM_RESOLUTION = 96;
const DYE_RESOLUTION = 720;
const DENSITY_DISSIPATION = 4.5;
const VELOCITY_DISSIPATION = 2;
const PRESSURE = 0.1;
// 8 (original 20, primera adaptación 14): cada iteración es un pase de
// render completo; a 8 los remolinos siguen leyéndose igual sobre este fondo.
const PRESSURE_ITERATIONS = 8;
const CURL = 3;
const SPLAT_RADIUS = 0.12;
const SPLAT_FORCE = 6000;
const IDLE_MS = 4000;

// Triángulo fullscreen con el atributo estándar `position` (el patrón de
// postprocessing de three) — un atributo custom sin `position` hacía que el
// renderer no emitiera el draw.
const BASE_VERT = `
precision highp float;
attribute vec3 position;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = position.xy * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const CLEAR_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`;

const SPLAT_FRAG = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main () {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}`;

const ADVECTION_FRAG = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main () {
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
  vec4 result = texture2D(uSource, coord);
  float decay = 1.0 + dissipation * dt;
  gl_FragColor = result / decay;
}`;

const DIVERGENCE_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

const CURL_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}`;

const VORTICITY_FRAG = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main () {
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * dt;
  velocity = min(max(velocity, -1000.0), 1000.0);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`;

const PRESSURE_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float divergence = texture2D(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

const GRADIENT_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`;

// Display: en la ESCENA principal (proyección de three + sombreado del humo).
const DISPLAY_VERT = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = uv;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const DISPLAY_FRAG = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uTexture;
uniform vec2 texelSize;
void main () {
  vec3 c = texture2D(uTexture, vUv).rgb;
  vec3 lc = texture2D(uTexture, vL).rgb;
  vec3 rc = texture2D(uTexture, vR).rgb;
  vec3 tc = texture2D(uTexture, vT).rgb;
  vec3 bc = texture2D(uTexture, vB).rgb;
  float dx = length(rc) - length(lc);
  float dy = length(tc) - length(bc);
  vec3 n = normalize(vec3(dx, dy, length(texelSize)));
  vec3 l = vec3(0.0, 0.0, 1.0);
  float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
  c *= diffuse;
  float a = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c, a);
}`;

interface DoubleFBO {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  texelSize: THREE.Vector2;
  swap: () => void;
  dispose: () => void;
}

function makeTarget(w: number, h: number, linear: boolean): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: linear ? THREE.LinearFilter : THREE.NearestFilter,
    magFilter: linear ? THREE.LinearFilter : THREE.NearestFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

function makeDoubleFBO(w: number, h: number, linear: boolean): DoubleFBO {
  const fbo = {
    read: makeTarget(w, h, linear),
    write: makeTarget(w, h, linear),
    texelSize: new THREE.Vector2(1 / w, 1 / h),
    swap() {
      const t = fbo.read;
      fbo.read = fbo.write;
      fbo.write = t;
    },
    dispose() {
      fbo.read.dispose();
      fbo.write.dispose();
    },
  };
  return fbo;
}

function makePassMaterial(frag: string, uniforms: Record<string, THREE.IUniform>): THREE.RawShaderMaterial {
  return new THREE.RawShaderMaterial({
    vertexShader: BASE_VERT,
    fragmentShader: frag,
    uniforms: { texelSize: { value: new THREE.Vector2() }, ...uniforms },
    depthTest: false,
    depthWrite: false,
  });
}

function generateColor(): THREE.Vector3 {
  // HSV aleatorio (s=1, v=1) → RGB, atenuado 0.15 — el rainbow del original.
  const h = Math.random();
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const q = 1 - f;
  let r = 0;
  let g = 0;
  let b = 0;
  switch (i % 6) {
    case 0: r = 1; g = f; b = 0; break;
    case 1: r = q; g = 1; b = 0; break;
    case 2: r = 0; g = 1; b = f; break;
    case 3: r = 0; g = q; b = 1; break;
    case 4: r = f; g = 0; b = 1; break;
    default: r = 1; g = 0; b = q; break;
  }
  return new THREE.Vector3(r * 0.15, g * 0.15, b * 0.15);
}

export default function FluidTrailLayer() {
  const { size } = useThree();
  const displayMeshRef = useRef<THREE.Mesh>(null);

  // Estado del puntero + cola de splats (escrito por listeners, leído en useFrame).
  const state = useRef({
    lastInput: 0,
    texX: 0,
    texY: 0,
    prevX: 0,
    prevY: 0,
    dx: 0,
    dy: 0,
    moved: false,
    started: false,
    color: new THREE.Vector3(0.05, 0.05, 0.05),
    colorTimer: 0,
    clickSplat: null as null | { x: number; y: number; color: THREE.Vector3 },
    reduced: false,
    // Throttle a ~30Hz: la sim corre un frame de cada dos (con dt acumulado
    // para que la física no vaya a cámara lenta). El humo es difuso — a 30
    // sigue leyéndose fluido — y el resto del canvas conserva sus fps.
    frameFlip: false,
    accum: 0,
  });

  // Recursos GPU: escena de pases + materiales + FBOs. Se reconstruyen si
  // cambia el tamaño del canvas (los FBOs dependen del aspect).
  const res = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // Triángulo que cubre todo el clip space (el clásico fullscreen triangle).
    geo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const passScene = new THREE.Scene();
    const passCamera = new THREE.Camera();
    const passMesh = new THREE.Mesh(geo);
    passMesh.frustumCulled = false;
    passScene.add(passMesh);

    const mats = {
      clear: makePassMaterial(CLEAR_FRAG, { uTexture: { value: null }, value: { value: PRESSURE } }),
      splat: makePassMaterial(SPLAT_FRAG, {
        uTarget: { value: null },
        aspectRatio: { value: 1 },
        color: { value: new THREE.Vector3() },
        point: { value: new THREE.Vector2() },
        radius: { value: 1 },
      }),
      advection: makePassMaterial(ADVECTION_FRAG, {
        uVelocity: { value: null },
        uSource: { value: null },
        dt: { value: 0.016 },
        dissipation: { value: 1 },
      }),
      divergence: makePassMaterial(DIVERGENCE_FRAG, { uVelocity: { value: null } }),
      curl: makePassMaterial(CURL_FRAG, { uVelocity: { value: null } }),
      vorticity: makePassMaterial(VORTICITY_FRAG, {
        uVelocity: { value: null },
        uCurl: { value: null },
        curl: { value: CURL },
        dt: { value: 0.016 },
      }),
      pressure: makePassMaterial(PRESSURE_FRAG, { uPressure: { value: null }, uDivergence: { value: null } }),
      gradient: makePassMaterial(GRADIENT_FRAG, { uPressure: { value: null }, uVelocity: { value: null } }),
    };
    return { passScene, passCamera, passMesh, mats, geo };
  }, []);

  const fbos = useMemo(() => {
    const aspect = size.width / size.height;
    const simH = SIM_RESOLUTION;
    const simW = Math.round(SIM_RESOLUTION * Math.max(aspect, 1 / aspect));
    const dyeH = DYE_RESOLUTION;
    const dyeW = Math.round(DYE_RESOLUTION * Math.max(aspect, 1 / aspect));
    const horizontal = aspect >= 1;
    return {
      velocity: makeDoubleFBO(horizontal ? simW : simH, horizontal ? simH : simW, true),
      dye: makeDoubleFBO(horizontal ? dyeW : dyeH, horizontal ? dyeH : dyeW, true),
      pressure: makeDoubleFBO(horizontal ? simW : simH, horizontal ? simH : simW, false),
      divergence: makeTarget(horizontal ? simW : simH, horizontal ? simH : simW, false),
      curl: makeTarget(horizontal ? simW : simH, horizontal ? simH : simW, false),
    };
     
  }, [size.width, size.height]);

  const displayMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DISPLAY_VERT,
        fragmentShader: DISPLAY_FRAG,
        uniforms: { uTexture: { value: null }, texelSize: { value: new THREE.Vector2() } },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
      }),
    []
  );

  // Listeners de puntero (solo ratón — la capa solo se monta en desktop).
  useEffect(() => {
    const s = state.current;
    s.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (s.reduced) return;
    const onMove = (e: MouseEvent) => {
      const aspect = window.innerWidth / window.innerHeight;
      const x = e.clientX / window.innerWidth;
      const y = 1 - e.clientY / window.innerHeight;
      if (!s.started) {
        s.texX = x;
        s.texY = y;
        s.started = true;
      }
      s.prevX = s.texX;
      s.prevY = s.texY;
      s.texX = x;
      s.texY = y;
      let dx = s.texX - s.prevX;
      let dy = s.texY - s.prevY;
      if (aspect < 1) dx *= aspect;
      if (aspect > 1) dy /= aspect;
      s.dx = dx;
      s.dy = dy;
      s.moved = s.moved || Math.abs(dx) > 0 || Math.abs(dy) > 0;
      s.lastInput = performance.now();
    };
    const onDown = (e: MouseEvent) => {
      const c = generateColor().multiplyScalar(10);
      s.clickSplat = { x: e.clientX / window.innerWidth, y: 1 - e.clientY / window.innerHeight, color: c };
      s.lastInput = performance.now();
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
    };
  }, []);

  // Limpieza de GPU al desmontar/reconstruir.
  useEffect(() => {
    const f = fbos;
    return () => {
      f.velocity.dispose();
      f.dye.dispose();
      f.pressure.dispose();
      f.divergence.dispose();
      f.curl.dispose();
    };
  }, [fbos]);
  useEffect(() => {
    const r = res;
    const dm = displayMaterial;
    return () => {
      Object.values(r.mats).forEach((m) => m.dispose());
      r.geo.dispose();
      dm.dispose();
    };
  }, [res, displayMaterial]);

  useFrame((frameState, delta) => {
    const s = state.current;
    const mesh = displayMeshRef.current;
    if (!mesh) return;
    if (s.reduced || performance.now() - s.lastInput > IDLE_MS) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    // Un frame de cada dos: acumula dt y sal — el display sigue mostrando la
    // última textura del dye (persistente), solo la FÍSICA va a 30Hz.
    s.accum += delta;
    s.frameFlip = !s.frameFlip;
    if (s.frameFlip) return;
    const gl = frameState.gl;
    const { passScene, passCamera, passMesh, mats } = res;
    const { velocity, dye, pressure, divergence, curl } = fbos;
    const dt = Math.min(s.accum, 0.034);
    s.accum = 0;
    const aspect = size.width / size.height;

    const prevTarget = gl.getRenderTarget();
    const prevAutoClear = gl.autoClear;
    gl.autoClear = false;

    const blit = (mat: THREE.RawShaderMaterial, target: THREE.WebGLRenderTarget) => {
      passMesh.material = mat;
      gl.setRenderTarget(target);
      gl.render(passScene, passCamera);
    };

    // Color del trazo: rota cada ~decisegundo (COLOR_UPDATE_SPEED 10 original).
    s.colorTimer += dt * 10;
    if (s.colorTimer >= 1) {
      s.colorTimer %= 1;
      s.color = generateColor();
    }

    // ---- Splats de entrada ----
    const doSplat = (x: number, y: number, dx: number, dy: number, color: THREE.Vector3) => {
      let radius = SPLAT_RADIUS / 100;
      if (aspect > 1) radius *= aspect;
      mats.splat.uniforms.aspectRatio.value = aspect;
      mats.splat.uniforms.point.value.set(x, y);
      mats.splat.uniforms.radius.value = radius;
      mats.splat.uniforms.uTarget.value = velocity.read.texture;
      mats.splat.uniforms.color.value.set(dx, dy, 0);
      mats.splat.uniforms.texelSize.value.copy(velocity.texelSize);
      blit(mats.splat, velocity.write);
      velocity.swap();
      mats.splat.uniforms.uTarget.value = dye.read.texture;
      mats.splat.uniforms.color.value.copy(color);
      blit(mats.splat, dye.write);
      dye.swap();
    };
    if (s.moved) {
      s.moved = false;
      doSplat(s.texX, s.texY, s.dx * SPLAT_FORCE, s.dy * SPLAT_FORCE, s.color);
    }
    if (s.clickSplat) {
      doSplat(s.clickSplat.x, s.clickSplat.y, 10 * (Math.random() - 0.5), 30 * (Math.random() - 0.5), s.clickSplat.color);
      s.clickSplat = null;
    }

    // ---- Paso de simulación (mismo orden que el original) ----
    mats.curl.uniforms.texelSize.value.copy(velocity.texelSize);
    mats.curl.uniforms.uVelocity.value = velocity.read.texture;
    blit(mats.curl, curl);

    mats.vorticity.uniforms.texelSize.value.copy(velocity.texelSize);
    mats.vorticity.uniforms.uVelocity.value = velocity.read.texture;
    mats.vorticity.uniforms.uCurl.value = curl.texture;
    mats.vorticity.uniforms.dt.value = dt;
    blit(mats.vorticity, velocity.write);
    velocity.swap();

    mats.divergence.uniforms.texelSize.value.copy(velocity.texelSize);
    mats.divergence.uniforms.uVelocity.value = velocity.read.texture;
    blit(mats.divergence, divergence);

    mats.clear.uniforms.texelSize.value.copy(velocity.texelSize);
    mats.clear.uniforms.uTexture.value = pressure.read.texture;
    blit(mats.clear, pressure.write);
    pressure.swap();

    mats.pressure.uniforms.texelSize.value.copy(velocity.texelSize);
    mats.pressure.uniforms.uDivergence.value = divergence.texture;
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      mats.pressure.uniforms.uPressure.value = pressure.read.texture;
      blit(mats.pressure, pressure.write);
      pressure.swap();
    }

    mats.gradient.uniforms.texelSize.value.copy(velocity.texelSize);
    mats.gradient.uniforms.uPressure.value = pressure.read.texture;
    mats.gradient.uniforms.uVelocity.value = velocity.read.texture;
    blit(mats.gradient, velocity.write);
    velocity.swap();

    mats.advection.uniforms.texelSize.value.copy(velocity.texelSize);
    mats.advection.uniforms.uVelocity.value = velocity.read.texture;
    mats.advection.uniforms.uSource.value = velocity.read.texture;
    mats.advection.uniforms.dt.value = dt;
    mats.advection.uniforms.dissipation.value = VELOCITY_DISSIPATION;
    blit(mats.advection, velocity.write);
    velocity.swap();

    mats.advection.uniforms.uVelocity.value = velocity.read.texture;
    mats.advection.uniforms.uSource.value = dye.read.texture;
    mats.advection.uniforms.dissipation.value = DENSITY_DISSIPATION;
    blit(mats.advection, dye.write);
    dye.swap();

    gl.setRenderTarget(prevTarget);
    gl.autoClear = prevAutoClear;

    // El plano de display muestra el dye recién avanzado.
    displayMaterial.uniforms.uTexture.value = dye.read.texture;
    displayMaterial.uniforms.texelSize.value.copy(dye.texelSize);
  }, -1);

  return (
    <mesh
      ref={displayMeshRef}
      material={displayMaterial}
      // Plano fullscreen en coords de PixelCamera (1 unidad = 1px a z=0),
      // pintado el último sobre todo lo del canvas (renderOrder + no depth).
      scale={[size.width, size.height, 1]}
      renderOrder={10000}
      frustumCulled={false}
      visible={false}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
