"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ---- Concave "inside a cylinder" backdrop, now a TV wall ------------------
// A large vertical-axis cylindrical wall section behind everything in the
// shared scene, so the whole site reads as living inside a softly-curved tube
// (reference: alche.studio). The centre of the arc is pushed FARthest from the
// camera and both side edges wrap FORWARD toward it — that forward wrap is the
// concave read. The inner face shows a pixelated CRT "screen": a looping video
// (the `videoSrc` prop — SceneCanvas.tsx picks a portrait or landscape clip to
// match the live viewport orientation) or, as a zero-asset placeholder/
// fallback, a procedurally-generated TV test signal (colour bars + rolling
// static) shown until that video's first frame is ready. The grid + depth-glow
// ride on top of it.
//
// All numbers are world units: 1 unit == 1 CSS pixel at z=0 (see PixelCamera).
//
// TWO WALLS, one per orientation (deep-tube + barrel, alche.studio ref): a
// phone only ever sees the central ~half of a desktop-sized drum — its
// geometrically FLATTEST region — so no landscape tuning can ever read as
// curved through a 390px-wide window (measured: ~7px of row bow). Portrait
// therefore gets its OWN much tighter drum: small R puts the curvature
// INSIDE the visible window (~22px+ of bow per row), sized to the phone's
// own coverage needs. The geometry rebuilds on orientation flip — the same
// live signal that already swaps the portrait/landscape video clip.
//   R        cylinder radius (smaller = tighter horizontal curve)
//   PHI      horizontal half-arc (rad): forward wrap of the side edges
//   Z        depth of the farthest (central) column
//   H        projected vertical span
//   PSI      vertical half-arc (rad): BARREL bow — the reference curves on
//            BOTH axes, top/bottom rows wrap forward like a barrel interior
//   PANELS_X monitor-tile columns of the panel wall (rows derive from aspect)
type WallMode = { R: number; PHI: number; Z: number; H: number; PSI: number; PANELS_X: number };
const WALL_MODES: { landscape: WallMode; portrait: WallMode } = {
  landscape: { R: 1600, PHI: 1.4, Z: -1900, H: 3400, PSI: 0.6, PANELS_X: 15 },
  portrait: { R: 700, PHI: 1.35, Z: -1500, H: 2600, PSI: 0.8, PANELS_X: 8 },
};
// Unrolled surface width (2·R·φmax) over height — the wall's TRUE aspect for
// cover/pixel/panel math, since u parameterizes angle (≈ arc length), not
// the chord. Videos must be "cover"-mapped against THIS or they stretch.
const wallAspect = (m: WallMode) => (2 * m.R * m.PHI) / m.H;
const COLS = 220;
const ROWS = 72;

function buildArcGeometry(m: WallMode) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Vertical barrel radius: derived so the projected vertical span still
  // equals m.H (rows near the middle unchanged; extreme rows come forward).
  const rv = m.H / (2 * Math.sin(m.PSI));

  for (let j = 0; j <= ROWS; j++) {
    const v = j / ROWS;
    // Barrel: each row rides its own vertical arc — y follows sin(ψ) and
    // the row's z comes FORWARD by rv·(1−cos ψ) toward top/bottom.
    const psi = (v - 0.5) * 2 * m.PSI;
    const y = rv * Math.sin(psi);
    const zBow = rv * (1 - Math.cos(psi));
    for (let i = 0; i <= COLS; i++) {
      const u = i / COLS;
      const phi = (u - 0.5) * 2 * m.PHI;
      const x = m.R * Math.sin(phi);
      const z = m.Z + m.R * (1 - Math.cos(phi)) + zBow;
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = COLS + 1;
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const a = j * stride + i;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uCells;
  uniform vec3 uBase;
  uniform vec3 uLine;
  uniform vec3 uGlowCol;
  uniform vec2 uFocus;
  uniform float uTv;       // 1 = show the CRT wall, 0 = plain grid (mobile fallback)
  uniform float uHasVideo; // 1 = sample uSource (real video), 0 = procedural test signal
  uniform sampler2D uSource;
  uniform vec2 uPixel;     // pixelation resolution (cells across / down)
  uniform vec2 uCoverScale; // aspect-correct "cover" crop: fraction of the video sampled per axis
  uniform vec2 uPanels;    // monitor-tile counts (across / down) for the panel-wall read
  uniform vec2 uRes;       // drawing-buffer size, for the SCREEN-SPACE edge vignette
  uniform float uDim;      // atenuación global del muro (1 móvil, <1 desktop)
  uniform float uGridShift; // deriva vertical de la cuadrícula con el scroll (V17.5)
  uniform float uPower;    // encendido de la pantalla (V17.10): 0 = apagada
                           // (gris oscuro, sin vídeo ni glow), 1 = normal
  uniform float uTime;     // segundos, para el parpadeo de celdas en reposo
  uniform float uOffLift;  // luz extra del estado APAGADO (V17.16): 1 en
                           // desktop; >1 en móvil, donde el casi-negro que
                           // en monitor se lee bien desaparece en el panel
                           // del teléfono

  vec3 sampleSource(vec2 uv) {
    if (uHasVideo > 0.5) {
      // "cover" mapping: sample only the central uCoverScale fraction of the
      // video so it fills the wall at its NATIVE aspect (excess is cropped,
      // never stretched) — computed in JS from videoWidth/Height vs the
      // wall's unrolled aspect.
      vec2 cuv = vec2(0.5) + (uv - vec2(0.5)) * uCoverScale;
      return texture2D(uSource, cuv).rgb;
    }
    // Pre-video / video-failed fallback: the plain dark base — the grid and
    // depth glow on top still read as the designed wall. (The old SMPTE
    // colour-bars placeholder flashed before every video start and was
    // removed on request.)
    return uBase;
  }

  void main() {
    // Deriva de la CUADRÍCULA con el scroll (V17.5): solo la textura de
    // pantalla (rejilla fina + paneles) se desplaza en V — en el espacio UV
    // del cilindro, así la cuadrícula se deforma siguiendo la perspectiva
    // curvada exactamente igual que en reposo. El VÍDEO (pixelación,
    // scanlines) y el glow/viñetas siguen muestreando vUv fijo.
    vec2 gv = vec2(vUv.x, vUv.y - uGridShift);

    // Crisp grid via screen-space derivatives (constant ~1px lines).
    vec2 g = gv * uCells;
    vec2 gr = abs(fract(g - 0.5) - 0.5) / fwidth(g);
    float line = 1.0 - min(min(gr.x, gr.y), 1.0);

    // ---- Panel wall (alche.studio reference): thick dark separators split
    // the surface into individual "monitor" tiles, and each tile carries its
    // own luminance so the wall reads as MANY PHYSICAL SCREENS, not one
    // continuous texture. Screen-space band width via fwidth = constant
    // ~2.5px separators regardless of depth/curvature.
    vec2 p = gv * uPanels;
    vec2 pid = floor(p);
    vec2 pr = abs(fract(p - 0.5) - 0.5) / fwidth(p);
    float sep = 1.0 - smoothstep(0.0, 2.5, min(pr.x, pr.y));
    float ph = fract(sin(dot(pid, vec2(127.1, 311.7))) * 43758.5453);
    float panelLum = 0.84 + 0.32 * ph;

    // ===== Encendido por PANELES (V17.12, "cuadrantes que se van cargando
    // de manera aleatoria con falla digital") =====
    // Cada monitor tiene su umbral aleatorio (hash independiente del de
    // luminancia) escalado a 0.85: al llegar uPower a 1 ningún panel
    // conserva el fallo residual. tileOn es un step DURO — el panel salta
    // de apagado a vídeo de golpe, nada de fundido difuminado — y glitch
    // es una banda corta tras el umbral: el destello/desgarro del arranque,
    // que recorre el muro en cascada mientras uPower rampa.
    float thr = fract(sin(dot(pid, vec2(269.5, 183.3))) * 951.1357) * 0.85;
    float tileOn = step(thr, uPower);
    float glitch = tileOn * (1.0 - smoothstep(0.0, 0.09, uPower - thr));

    // Depth: light pooling toward uFocus + outward vignette.
    float d = distance(vUv, uFocus);
    float glow = smoothstep(0.85, 0.0, d);
    float vig = smoothstep(1.2, 0.1, d);

    vec3 fill;
    if (uTv > 0.5) {
      // Chunky pixelation (in the curved UV, so the pixels follow the
      // concave deformation) + RGB split + scanlines = CRT screen.
      vec2 puv = (floor(vUv * uPixel) + 0.5) / uPixel;
      // Desgarro horizontal del arranque (V17.12): mientras el panel está
      // en su banda de fallo, su vídeo entra desplazado en X y recoloca.
      puv.x += (ph - 0.5) * 0.14 * glitch;
      float o = 1.3 / uPixel.x;
      float r = sampleSource(puv + vec2(o, 0.0)).r;
      float gg = sampleSource(puv).g;
      float b = sampleSource(puv - vec2(o, 0.0)).b;
      vec3 tv = vec3(r, gg, b);
      tv *= 0.78 + 0.22 * sin(vUv.y * uPixel.y * 6.28318);
      // Dim + tint toward the site's dark base so overlaid text stays legible.
      // (El "vídeo limpio en móvil" de V16.94 duró un día: V16.95 restaura
      // el sombreado completo también ahí, ya con el clip de montañas.)
      fill = mix(uBase * 0.7, tv, 0.5);
    } else {
      fill = uBase;
    }

    // Panel APAGADO (V17.13, "quita lo gris, casi negro"): fondo casi negro
    // — la lectura de "pantalla apagada" la dan la CUADRÍCULA (más clara en
    // reposo, ver el coeficiente de uLine abajo) y los biseles. El paso
    // apagado→vídeo es POR PANEL (tileOn) y duro, con el destello
    // blanco-frío del fallo digital encima.
    vec3 offCol = vec3(0.013, 0.014, 0.018) * uOffLift;
    fill = mix(offCol, fill, tileOn);
    fill += vec3(0.55, 0.6, 0.7) * glitch * (0.35 + 0.45 * ph);

    vec3 col = fill * panelLum;
    col += uGlowCol * glow * 0.10 * uPower;
    // Apagada, la cuadrícula sube a 0.16 (V17.13, "que se vea que está
    // ahí") — sobre el fondo casi negro es lo único que dibuja la pantalla.
    // En móvil sube vía uOffLift con tope 2.4: la base necesita más (x4.8)
    // pero unas líneas a ese múltiplo serían protagonistas.
    col += uLine * line * (mix(0.16 * min(uOffLift, 2.4), 0.05, uPower) + 0.28 * glow * uPower);

    // Parpadeo en reposo (V17.15, "que la pantalla apagada no esté
    // estática"): ~8% de las celdas de la cuadrícula respiran un poco más
    // claras, cada una con su fase y velocidad propias. Solo apagada
    // (factor 1-uPower); mientras tanto el vídeo sigue decodificando detrás
    // y su rVFC invalida ~30fps, así que la animación corre sola.
    vec2 cid = floor(g);
    float ch = fract(sin(dot(cid, vec2(419.2, 371.9))) * 833.7);
    float tw = step(0.92, ch) * (0.5 + 0.5 * sin(uTime * (1.2 + ch * 2.5) + ch * 40.0));
    col += uLine * tw * 0.16 * min(uOffLift, 2.4) * (1.0 - uPower);
    // Deep dark gaps between the monitor tiles — applied AFTER glow/grid so
    // the separators cut through everything, like real bezels.
    col = mix(col, col * 0.16, sep);

    // (Los LEDs de standby rojos de V17.12 se retiraron en V17.13 a
    // petición: "quita los puntos rojos esos".)
    col *= (0.42 + 0.58 * vig);

    // SCREEN-SPACE edge vignette ("sombra del vídeo de fondo") — inside the
    // wall shader on purpose: it dims ONLY the wall/video; the glass cards
    // render after and stay untouched by construction. Rebajada en V17.14
    // ("reduce el oscurecimiento del borde", desktop Y móvil — mismo path):
    // antes 0.45/0.40 con tope 0.85 (esquinas al 15% de brillo), ahora
    // ~0.28 a medio campo y esquinas al 42%.
    vec2 sc = gl_FragCoord.xy / uRes;
    vec2 sd = vec2((sc.x - 0.5) * 2.0, ((sc.y - 0.52) * 2.0) / 0.85);
    float rr = length(sd);
    float edge = 0.28 * smoothstep(0.38, 0.72, rr) + 0.30 * smoothstep(0.72, 1.0, rr);
    col *= (1.0 - min(edge, 0.58));

    // Atenuación global del muro (petición: "oscurece un poco el fondo en
    // ordenador") — solo <1 en desktop, ver el efecto de orientación en JS.
    // Apagada casi no se atenúa (suelo 0.9): uDim existe para domar el
    // BRILLO del vídeo bajo el texto; el apagado ya es casi negro de por
    // sí y los LEDs/rejilla deben seguir leyéndose (V17.12).
    col *= mix(0.9, uDim, uPower);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function SceneBackground({
  tv,
  videoSrc,
  active,
  portrait,
}: {
  tv: boolean;
  videoSrc: string | null;
  active: boolean;
  portrait: boolean;
}) {
  // Stable per-orientation references (WALL_MODES entries never change), so
  // the geometry memo only rebuilds on a real orientation flip.
  const mode = portrait ? WALL_MODES.portrait : WALL_MODES.landscape;
  const geometry = useMemo(() => buildArcGeometry(mode), [mode]);
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const invalidate = useThree((s) => s.invalidate);

  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const scratchSize = useRef(new THREE.Vector2());
  // Encendido de pantalla (V17.10): en la home el muro arranca APAGADO en
  // la hero y se enciende al llegar la Intro. `null` = primer frame (se
  // fija al target sin rampa, para no ver un flash de encendido/apagado al
  // cargar en mitad de la página o en otra ruta).
  const introElRef = useRef<HTMLElement | null>(null);
  const powerRef = useRef<number | null>(null);
  // Live handle to the current <video> for the keep-alive interval below —
  // rendering must never depend on the video actually playing (phones can
  // refuse/delay autoplay, and in "demand" mode the video's rVFC is the
  // page-wide invalidation source: a stalled video used to freeze ALL
  // demand-mode rendering, including the hero CTA's glass panel).
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  // Always-valid 1x1 texture so `uSource` samples something before/without a
  // real video (the procedural path ignores it, but the sampler must be bound).
  const blankTex = useMemo(() => {
    const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    t.needsUpdate = true;
    return t;
  }, []);

  const uniforms = useMemo(
    () => ({
      uCells: { value: new THREE.Vector2(52, 40) },
      uBase: { value: new THREE.Color("#070b13") },
      uLine: { value: new THREE.Color("#33445f") },
      uGlowCol: { value: new THREE.Color("#1b2942") },
      uFocus: { value: new THREE.Vector2(0.5, 0.46) },
      uTv: { value: tv ? 1 : 0 },
      uHasVideo: { value: 0 },
      uSource: { value: blankTex as THREE.Texture },
      // Square CRT pixels / square-ish monitor tiles: initialized for
      // landscape; the [mode] effect below re-derives both from the ACTIVE
      // wall's unrolled aspect (portrait wall has its own).
      uPixel: { value: new THREE.Vector2(180, Math.round(180 / wallAspect(WALL_MODES.landscape))) },
      uCoverScale: { value: new THREE.Vector2(1, 1) },
      uPanels: { value: new THREE.Vector2(15, Math.round(15 / wallAspect(WALL_MODES.landscape))) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uDim: { value: 1 },
      uGridShift: { value: 0 },
      uPower: { value: 1 },
      uTime: { value: 0 },
      uOffLift: { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uTv.value = tv ? 1 : 0;
  }, [tv]);

  // Re-derive the aspect-dependent uniforms for the ACTIVE wall on
  // orientation flips (pixel grid and panel tiles must stay square-ish on
  // both drums).
  useEffect(() => {
    const mat = matRef.current;
    if (!mat) return;
    const a = wallAspect(mode);
    (mat.uniforms.uPixel.value as THREE.Vector2).set(180, Math.round(180 / a));
    (mat.uniforms.uPanels.value as THREE.Vector2).set(
      mode.PANELS_X,
      Math.max(2, Math.round(mode.PANELS_X / a))
    );
    // Desktop CASI NEGRO (petición V16.66: "quiero que se vea casi negro");
    // móvil sin cambio.
    // 1.35 en móvil (V17.15 subió a 1.2; V17.16 otro punto, "se ve super
    // oscuro"): levanta el muro entero solo en portrait; desktop igual.
    mat.uniforms.uDim.value = mode === WALL_MODES.portrait ? 1.35 : 0.32;
    // Luz extra del estado APAGADO solo en móvil (V17.16 x3.2 → V17.17
    // x4.8, "aumenta más el brillo solo de la parte apagada"): multiplica
    // la base apagada; la cuadrícula y el parpadeo van con tope en el
    // shader (x2.4). En desktop 1 = sin cambio.
    mat.uniforms.uOffLift.value = mode === WALL_MODES.portrait ? 4.8 : 1;
    invalidate();
  }, [mode, invalidate]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => blankTex.dispose(), [blankTex]);

  // Real video → VideoTexture. No-op while `videoSrc` is null (the procedural
  // placeholder runs instead). Depends on `videoSrc` itself (not just `tv`),
  // so an orientation flip (SceneCanvas.tsx swaps portrait/landscape clips)
  // tears down this video/texture and builds the other one, rather than
  // trying to swap `.src` on a live VideoTexture. Playback/invalidation is tuned
  // to decode and render no more than the video actually needs:
  //  - `requestVideoFrameCallback` (rVFC) invalidates the canvas exactly when
  //    a NEW decoded frame is ready — never faster than the video's own frame
  //    rate, and it naturally stops firing if the video stalls/buffers, unlike
  //    a blind interval that would keep invalidating (and re-rendering the
  //    whole scene) for nothing.
  //  - The `<video>` itself is paused (not just "not rendered") on
  //    visibilitychange, so a hidden tab does zero decode work, not just zero
  //    GPU upload.
  //  - `preload="auto"` + eager `.play()` on `loadeddata` so the loop is
  //    already primed by the time anyone scrolls to where it's visible —
  //    there's only one instance for the whole site, so this is a single
  //    decode pipeline, not one per section.
  useEffect(() => {
    if (!tv || !videoSrc) return;
    const video = document.createElement("video");
    // Attributes AND properties: some engines only honor autoplay policy
    // exemptions for detached videos when the muted/playsinline ATTRIBUTES
    // are present (the property alone was why phones waited for a touch).
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;
    video.preload = "auto";
    video.src = videoSrc;
    // Play IMMEDIATELY — play() before data is legal (the promise settles
    // when playback actually starts), so the very first decoded frame plays
    // instead of waiting for `loadeddata` to round-trip first.
    video.play().catch(() => {});
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter; // keep the pixelation crisp
    tex.minFilter = THREE.LinearFilter;
    // The zoomed-out sampling below can step slightly outside [0,1] on the
    // wall's (mostly off-screen) outer fringes — mirror instead of clamped
    // edge streaks. (WebGL2: fine on NPOT video textures.)
    tex.wrapS = THREE.MirroredRepeatWrapping;
    tex.wrapT = THREE.MirroredRepeatWrapping;
    // Captured once — the material is stable for this component's lifetime, so
    // the same instance is valid across every callback/cleanup below.
    const mat = matRef.current;

    const supportsRVFC = typeof video.requestVideoFrameCallback === "function";
    let rvfcId: number | null = null;
    // (Las transiciones de loop probadas — dip a oscuro V16.63 y crossfade al
    // primer frame V16.64 — se retiraron a petición: el vídeo loopea a corte
    // directo, sin efecto.)
    const onFrame = () => {
      invalidate();
      if (!document.hidden) rvfcId = video.requestVideoFrameCallback(onFrame);
    };

    // Señal one-shot para la barra de carga (components/LoadProgress.tsx):
    // "el muro ya asentó" — primer frame del vídeo listo O fallo definitivo
    // (en cuyo caso pinta el fallback procedural y no hay nada más que
    // esperar). El guard en window sobrevive al re-run de este efecto por
    // flip de orientación, que NO debe re-disparar la barra.
    const settleWall = () => {
      if (!window.__nxrWallSettled) {
        window.__nxrWallSettled = true;
        window.dispatchEvent(new Event("nxr:wall-settled"));
      }
    };

    const onReady = () => {
      settleWall();
      if (mat) {
        mat.uniforms.uSource.value = tex;
        mat.uniforms.uHasVideo.value = 1;
        // Aspect-correct cover crop for THIS clip against the ACTIVE wall's
        // unrolled aspect (see sampleSource in the fragment shader).
        const va = video.videoWidth / video.videoHeight || 1;
        const wa = wallAspect(portrait ? WALL_MODES.portrait : WALL_MODES.landscape);
        const cover = mat.uniforms.uCoverScale.value as THREE.Vector2;
        // Landscape (desktop) clips read "too close": pure cover sampled
        // only the central 62% of the frame's width, and the wall's
        // top/bottom overshoot the viewport, hiding another ~30% of its
        // height. ZOOM = uniform zoom-out of the sampling on BOTH axes
        // (aspect preserved, nothing stretches): at 1.3 a 900px-tall
        // desktop sees ~92% of the frame's height and ~81% of its width.
        // Out-of-range sampling on the off-screen fringes mirrors (see the
        // texture wrap above). Portrait clips are authored 1:1 for phones.
        const zoom = va > 1 ? 1.3 : 1;
        if (va > wa) cover.set((wa / va) * zoom, zoom);
        else cover.set(zoom, (va / wa) * zoom);
      }
      video.play().catch(() => {});
      if (supportsRVFC) rvfcId = video.requestVideoFrameCallback(onFrame);
    };
    video.addEventListener("loadeddata", onReady);

    // Fallback ONLY for browsers without rVFC — a light interval just to keep
    // the canvas repainting while the video plays.
    let fallbackInterval: number | null = null;
    if (!supportsRVFC) {
      fallbackInterval = window.setInterval(() => {
        if (!document.hidden) invalidate();
      }, 33);
    }

    const onVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
        if (supportsRVFC) rvfcId = video.requestVideoFrameCallback(onFrame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Phones can refuse the eager autoplay (data saver, low-power mode,
    // browser quirks) — retry on any real user gesture, which always
    // satisfies autoplay policies. Cheap no-op once playing.
    const kick = () => {
      if (video.paused && !document.hidden) video.play().catch(() => {});
    };
    window.addEventListener("touchstart", kick, { passive: true });
    window.addEventListener("pointerdown", kick, { passive: true });

    // Decode/network failure → fall back to the procedural TV signal (the
    // keep-alive interval below animates it) instead of a frozen dark wall.
    const onError = () => {
      settleWall();
      if (mat) {
        mat.uniforms.uHasVideo.value = 0;
        mat.uniforms.uSource.value = blankTex;
      }
    };
    video.addEventListener("error", onError);

    videoElRef.current = video;

    return () => {
      videoElRef.current = null;
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);
      window.removeEventListener("touchstart", kick);
      window.removeEventListener("pointerdown", kick);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rvfcId !== null) video.cancelVideoFrameCallback(rvfcId);
      if (fallbackInterval !== null) window.clearInterval(fallbackInterval);
      video.pause();
      video.src = "";
      tex.dispose();
      if (mat) {
        mat.uniforms.uHasVideo.value = 0;
        mat.uniforms.uSource.value = blankTex;
      }
    };
  }, [tv, videoSrc, blankTex, invalidate, portrait]);

  // Cursor parallax. Each mousemove kicks a render (the canvas runs
  // "demand" off the card sections), and the ease-out below re-invalidates
  // itself until it settles.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
      invalidate();
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [invalidate]);

  // Keep-alive invalidation at ~30fps whenever the video is NOT actually
  // producing frames (no video configured, still loading/buffering, autoplay
  // refused, decode error). While the video plays, its rVFC is the exact
  // per-decoded-frame invalidation source and this tick is a no-op check —
  // so there's never a redundant second source, but demand-mode rendering
  // (the wall, the hero CTA's glass panel) can no longer be starved by a
  // stalled video, which on some phones froze the whole backdrop. Paused
  // while the tab is hidden; `tv=false` stays fully demand-idle.
  useEffect(() => {
    if (!tv || !active) return;
    const id = window.setInterval(() => {
      const v = videoElRef.current;
      const videoPlaying = v && !v.paused && v.readyState >= 3;
      if (!document.hidden && !videoPlaying) invalidate();
    }, 33);
    return () => window.clearInterval(id);
  }, [tv, active, invalidate]);

  useFrame(({ gl, clock }) => {
    // Drawing-buffer size for the screen-space vignette (scratch vector
    // reused — correct across resizes and DPR changes for free).
    const matV = matRef.current;
    if (matV) {
      gl.getDrawingBufferSize(scratchSize.current);
      (matV.uniforms.uRes.value as THREE.Vector2).copy(scratchSize.current);
      matV.uniforms.uTime.value = clock.elapsedTime;
      // Deriva de la cuadrícula ligada al scroll REAL (Lenis conduce el
      // scroll nativo, ya suavizado): al bajar, la cuadrícula sube
      // lentamente y viceversa. Signo: restar el shift en el shader mueve
      // el patrón hacia V creciente (arriba) cuando scrollY crece. Lectura
      // de window.scrollY sin coste de layout; se refresca en cada frame
      // renderizado (vídeo ~30fps / always al scrollear).
      // 0.00006 (V17.10 "más despacio"; historial: 0.00004 → 0.00009 en
      // V17.6 → punto medio): ~200px de deriva visual por 1000px de scroll.
      matV.uniforms.uGridShift.value = window.scrollY * 0.00006;

      // ===== Pantalla apagada en la hero de la home (V17.10) =====
      // "Al cargar la home no quiero que se vea el vídeo; que la pantalla
      // se encienda al llegar a la Intro". El target sale del rect de
      // #nxr-intro (medido en vivo, patrón de las capas — nunca st.start
      // cacheado): 0 mientras la Intro está por debajo del 95% del viewport
      // (toda la hero pineada incluida), rampa a 1 cuando su top alcanza el
      // 55%. En rutas sin #nxr-intro el muro queda siempre encendido. El
      // valor renderizado persigue al target con amortiguación (~medio
      // segundo), así el encendido se ve como una TV encendiéndose y no
      // como un corte, y es reversible al volver a subir.
      let intro = introElRef.current;
      if (!intro || !intro.isConnected) {
        intro = introElRef.current = document.getElementById("nxr-intro");
      }
      let pTarget = 1;
      if (intro) {
        const vh = window.innerHeight;
        const top = intro.getBoundingClientRect().top;
        pTarget = Math.min(1, Math.max(0, (vh * 0.95 - top) / (vh * 0.4)));
      }
      const pPrev = powerRef.current;
      // 0.07 (V17.12): rampa algo más larga (~0.8s) para que la cascada de
      // paneles encendiéndose con su fallo digital se pueda LEER.
      const pNext = pPrev === null ? pTarget : pPrev + (pTarget - pPrev) * 0.07;
      powerRef.current = pNext;
      matV.uniforms.uPower.value = pNext;
      // Sigue invalidando mientras la rampa no asiente (modo demand).
      if (pPrev !== null && Math.abs(pTarget - pNext) > 0.002) invalidate();
    }
    const c = current.current;
    const t = target.current;
    c.x += (t.x - c.x) * 0.09;
    c.y += (t.y - c.y) * 0.09;

    const group = groupRef.current;
    if (group) {
      group.rotation.y = c.x * 0.09;
      group.rotation.x = -c.y * 0.065;
    }
    const mat = matRef.current;
    if (mat) {
      (mat.uniforms.uFocus.value as THREE.Vector2).set(0.5 + c.x * 0.14, 0.46 - c.y * 0.11);
    }

    if (Math.abs(t.x - c.x) > 0.001 || Math.abs(t.y - c.y) > 0.001) invalidate();
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} frustumCulled={false} renderOrder={-10}>
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
