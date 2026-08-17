"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RIPPLE } from "./rippleParams";

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

// Celdas del pixelado CRT a lo ancho del arco. 180 -> 240 (V17.69, "reduce un
// poco el pixelado de los vídeos"): el arco mide 2*R*PHI = 4480 unidades, así
// que cada bloque pasa de ~24.9 a ~18.7 unidades — y como el muro está a
// z=-1900 con la cámara a 1000, en pantalla eso son ~8.6px -> ~6.4px.
// El techo lo pone el CLIP, no el shader: los vídeos son de 640x360 y 432x768
// y el recorte "cover" deja ~474 y ~432 téxeles a lo ancho del muro, o sea
// ~2 téxeles por celda a 240. Subir mucho más solo replicaría téxeles (el
// bloque lo acabaría marcando el propio vídeo, y encima irregular por el
// NearestFilter). El split RGB y las scanlines NO siguen a este número: van
// ancladas a la rejilla de 180 dentro del shader (ver refPixel).
const PIXEL_X = 240;

const RIPPLE_DUR = RIPPLE.DUR;
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

// Los números de la onda se INTERPOLAN en el GLSL desde rippleParams para que
// muro y textos no puedan desincronizarse. toFixed obliga a escribirlos con
// decimales: en GLSL un "46" pelado es un int y no compila contra un float.
const R = RIPPLE;
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
  uniform float uRipT;     // piedra en el agua (V17.70): segundos desde el
                           // impacto en el centro de pantalla. <0 = inactivo
  uniform float uDim;      // atenuación global del muro (1 móvil, <1 desktop)
  uniform float uPower;    // encendido de la pantalla (V17.10): 0 = apagada
                           // (gris oscuro, sin vídeo ni glow), 1 = normal
  uniform float uTime;     // segundos, para el parpadeo de celdas en reposo
  uniform float uOffLift;  // luz extra del estado APAGADO (V17.16): 1 en
                           // desktop; >1 en móvil, donde el casi-negro que
                           // en monitor se lee bien desaparece en el panel
                           // del teléfono
  uniform float uFrameShade; // marco de sombra del viewport (V17.21):
                             // 1 desktop, 0 móvil
  uniform sampler2D uSourceB; // clip ENTRANTE del cambio de vídeo (V17.22)
  uniform vec2 uCoverScaleB;  // cover-crop del clip entrante
  uniform float uHasVideoB;   // 1 = uSourceB listo (ya reproduciendo)
  uniform float uSwitch;      // progreso 0→1 del cambio de vídeo POR PANEL
  uniform float uVidGamma;    // contraste del vídeo (V17.31): >1 solo en
                              // desktop, hunde los negros que el mix con la
                              // base + uDim 0.32 dejaban en gris azulado
  uniform float uVidSat;      // saturación del vídeo (V17.43): 1 = sin tocar,
                              // >1 expande el color. Más alto en desktop, que
                              // pasa por gamma 1.45 + uDim 0.32 y pierde más
                              // color percibido al hundirse la luminancia

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

  // Muestreo del vídeo ACTIVO por panel (V17.22): los paneles que ya
  // saltaron al clip entrante (useB) leen uSourceB con su propio cover;
  // el resto sigue en el pipeline A (con su fallback procedural).
  vec3 sampleActive(vec2 uv, float useB) {
    if (useB > 0.5 && uHasVideoB > 0.5) {
      vec2 cuv = vec2(0.5) + (uv - vec2(0.5)) * uCoverScaleB;
      return texture2D(uSourceB, cuv).rgb;
    }
    return sampleSource(uv);
  }

  void main() {
    // ===== PIEDRA EN EL AGUA (V17.70) =====
    // Un único frente circular que sale del centro de la PANTALLA (no del UV
    // del muro: la onda tiene que leerse redonda en el monitor del usuario, y
    // el muro es un arco deformado por la curvatura y el aspecto).
    //
    // Se desplaza vUv ANTES de todo lo demás, así que ondula la superficie
    // ENTERA —vídeo, cuadrícula fina y biseles de los monitores— igual que el
    // reflejo en un estanque. Deformar solo el vídeo habría dejado la rejilla
    // quieta por encima y el efecto se leería como un filtro pegado, no como
    // agua. ripW sale también del bloque para modular el brillo más abajo:
    // sin ese realce en las crestas la ondulación se nota en la geometría pero
    // no "brilla", que es lo que la hace pasar por refracción.
    vec2 uvW = vUv;
    float ripW = 0.0;
    if (uRipT >= 0.0) {
      // Coordenada de pantalla corregida por aspecto: sin el factor x/y la
      // onda saldría elíptica en pantallas anchas.
      vec2 dv = (gl_FragCoord.xy / uRes - vec2(0.5)) * vec2(uRes.x / uRes.y, 1.0);
      float r = length(dv);
      // Todos estos números salen de rippleParams (ver allí el porqué de cada
      // uno); se interpolan para que el chapoteo de los textos de la hero,
      // que corre en JS, evalúe EXACTAMENTE la misma onda.
      float dr = r - uRipT * ${R.VEL.toFixed(3)};
      // Tren de crestas dentro de una campana que viaja con el frente, más
      // amortiguación global: la primera cresta es la fuerte y las de detrás se
      // van apagando, como el agua de verdad.
      ripW = sin(dr * ${R.FREQ.toFixed(1)}) * exp(-dr * dr * ${R.BELL.toFixed(1)}) * exp(-uRipT * ${R.DECAY.toFixed(2)});
      uvW += (r > 0.0001 ? dv / r : vec2(0.0)) * ripW * ${R.AMP_UV.toFixed(3)};
    }

    // (La deriva de la cuadrícula con el scroll — uGridShift, V17.5 — se
    // retiró en V17.28 a petición: la textura de pantalla queda fija.)
    // Crisp grid via screen-space derivatives (constant ~1px lines).
    vec2 g = uvW * uCells;
    vec2 gr = abs(fract(g - 0.5) - 0.5) / fwidth(g);
    float line = 1.0 - min(min(gr.x, gr.y), 1.0);

    // ---- Panel wall (alche.studio reference): thick dark separators split
    // the surface into individual "monitor" tiles, and each tile carries its
    // own luminance so the wall reads as MANY PHYSICAL SCREENS, not one
    // continuous texture. Screen-space band width via fwidth = constant
    // ~2.5px separators regardless of depth/curvature.
    vec2 p = uvW * uPanels;
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

    // Cambio de VÍDEO por paneles (V17.22): mismo lenguaje que el
    // encendido, pero DIRECTO de clip a clip (sin apagado intermedio) —
    // cada monitor salta al vídeo entrante en orden aleatorio (hash
    // propio, distinto del de power) con su destello de fallo. Cuando la
    // cascada completa, el finalize de JS mueve el clip al slot frontal y
    // devuelve uSwitch a 0 en el mismo frame: ningún píxel cambia.
    float thrB = fract(sin(dot(pid, vec2(157.9, 421.7))) * 723.417) * 0.85;
    float useB = step(thrB, uSwitch);
    float glitchB = useB * (1.0 - smoothstep(0.0, 0.09, uSwitch - thrB));
    float gAll = max(glitch, glitchB);

    // Depth: light pooling toward uFocus + outward vignette.
    float d = distance(uvW, uFocus);
    float glow = smoothstep(0.85, 0.0, d);
    float vig = smoothstep(1.2, 0.1, d);

    vec3 fill;
    // uPower > 0 en la condición (V17.76, perf): con la pantalla APAGADA del
    // todo —la hero de la home— tileOn vale 0 en todos los paneles y el
    // resultado de este bloque lo descarta entero el mix(offCol, fill, tileOn)
    // (OJO: ni un backtick en este bloque — el shader entero vive dentro de un
    // template literal de JS y uno solo lo cierra a media cadena.)
    // de más abajo. Calcularlo igualmente costaba los 3 texture fetch del
    // split RGB + gamma + saturación por píxel de pantalla, a ~30fps, en la
    // primera sección que ve el visitante. La condición es UNIFORME (los dos
    // uniformes valen lo mismo para todos los fragmentos), así que el salto es
    // coherente para todo el warp y prácticamente gratis.
    if (uTv > 0.5 && uPower > 0.0) {
      // Chunky pixelation (in the curved UV, so the pixels follow the
      // concave deformation) + RGB split + scanlines = CRT screen.
      vec2 puv = (floor(uvW * uPixel) + 0.5) / uPixel;
      // Rejilla de REFERENCIA (las 180 celdas de siempre). El split RGB y las
      // scanlines de abajo se calibraron contra ella y se anclan aquí a
      // propósito: al afinar uPixel para reducir el pixelado encogerían con
      // él, y son dos efectos aparte que ya estaban ajustados (el split, a
      // mano en V17.44). Así lo único que cambia es el tamaño del bloque.
      vec2 refPixel = uPixel * (180.0 / uPixel.x);
      // Desgarro horizontal del arranque (V17.12): mientras el panel está
      // en su banda de fallo (de encendido O de cambio de clip), su vídeo
      // entra desplazado en X y recoloca.
      puv.x += (ph - 0.5) * 0.14 * gAll;
      // Separación del RGB split, en fracción de celda de píxel CRT.
      // 1.3 -> 0.5 (V17.44, "no quiero que esté tan distorsionado"): el
      // desdoblamiento rojo/azul se nota ahora menos de la mitad y el clip se
      // lee limpio, pero sigue habiendo franja de color en los bordes de alto
      // contraste, que es lo que da la lectura de CRT. Se retoca JUSTO después
      // de subir uVidSat a 1.85 (V17.43) y no es casualidad: saturar amplifica
      // precisamente las franjas de color que crea este split, así que el
      // mismo 1.3 de siempre pasó a leerse mucho más agresivo. A 0 el efecto
      // desaparece del todo.
      float o = 0.5 / refPixel.x;
      float r = sampleActive(puv + vec2(o, 0.0), useB).r;
      float gg = sampleActive(puv, useB).g;
      float b = sampleActive(puv - vec2(o, 0.0), useB).b;
      vec3 tv = vec3(r, gg, b);
      // Contraste del clip (V17.31, "en ordenador se ven grisáceos"):
      // gamma >1 solo desktop — móvil (uDim 1.35) ya estira el contraste.
      tv = pow(tv, vec3(uVidGamma));
      // Saturación del clip (V17.43, "se ven muy apagados"). Se aplica AQUÍ,
      // sobre el vídeo puro y ANTES del mix con la base: lo que de verdad
      // apaga el color es el mix(uBase * 0.7, tv, 0.5) de abajo — mezclar
      // al 50% con un azul-gris plano —, pero ese mix es justo lo que
      // (OJO: nada de backticks en este bloque; el shader entero vive dentro
      // de un template literal de JS y uno solo lo cierra a media cadena.)
      // mantiene legible el texto que va encima, así que no se toca. Entrando
      // el vídeo más saturado a la mezcla se recupera el color sin alterar ni
      // la luminancia ni el contraste que ya estaban afinados.
      // Separar el gris de su desviación cromática: >1 la expande.
      tv = mix(vec3(dot(tv, vec3(0.2126, 0.7152, 0.0722))), tv, uVidSat);
      tv = max(tv, 0.0); // saturar puede empujar un canal por debajo de 0
      tv *= 0.78 + 0.22 * sin(uvW.y * refPixel.y * 6.28318);
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
    fill += vec3(0.55, 0.6, 0.7) * gAll * (0.35 + 0.45 * ph);

    vec3 col = fill * panelLum;

    // ===== Detalle por CELDA pequeña, estado apagado (V17.34) =====
    // Cada casilla de la cuadrícula fina (4x4 por monitor) con respuesta
    // propia, como bloques de píxel reales: luminancia ligeramente
    // distinta por celda, pocillo interior (bordes hundidos, centro con
    // leve realce) y micro-tinte subpíxel por canal. Se aplica ANTES de
    // sumar la rejilla para no ensuciar sus líneas, y desaparece al
    // encender. (cid se declara aquí y lo reutiliza el parpadeo de abajo.)
    //
    // TODO el estado apagado va bajo uPower < 1.0 (V17.76, perf). No es una
    // aproximación: con la pantalla encendida cada uno de estos términos ya
    // valía exactamente su neutro (mix(x, y, 0) = x, y las sumas van
    // multiplicadas por 1.0 - uPower = 0), así que el píxel sale idéntico —
    // lo único que cambia es que deja de calcularse. Son ~6 hashes
    // sin/fract, 8 smoothsteps y un grano por píxel de pantalla, a ~30fps,
    // en TODA la web salvo la hero. La condición es uniforme (mismo valor
    // para todos los fragmentos), no divergente.
    // OJO: depende de que uPower llegue a 1.0 EXACTO — su rampa amortiguada
    // en useFrame hace snap al target por ese motivo; si se quita el snap,
    // esto se queda encendido para siempre en 0.998 y el ahorro desaparece.
    vec2 cid = floor(g);
    if (uPower < 1.0) {
      vec2 cf = fract(g);
      float cl = fract(sin(dot(cid, vec2(213.7, 152.9))) * 641.3);
      float well = smoothstep(0.0, 0.28, cf.x) * smoothstep(1.0, 0.72, cf.x)
                 * smoothstep(0.0, 0.34, cf.y) * smoothstep(1.0, 0.66, cf.y);
      float cellShade = mix(0.82, 1.0, well) * (0.88 + 0.24 * cl);
      col *= mix(1.0, cellShade, 1.0 - uPower);
      vec3 subpx = vec3(
        1.0 + 0.05 * (fract(cl * 7.3) - 0.5),
        1.0 + 0.05 * (fract(cl * 13.7) - 0.5),
        1.0 + 0.08 * (fract(cl * 29.1) - 0.5)
      );
      col *= mix(vec3(1.0), subpx, 1.0 - uPower);
    }

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
    if (uPower < 1.0) {
    float ch = fract(sin(dot(cid, vec2(419.2, 371.9))) * 833.7);
    // chd (V17.36): hash RE-ESPARCIDO para velocidad/fase. El propio ch no
    // sirve — las celdas elegidas viven en [0.92,1) por construcción, así
    // que todas parpadeaban casi a la misma velocidad y en fase, y el
    // conjunto leía como brillo cuasi-fijo. chd las reparte por todo [0,1):
    // periodos de ~1.8 a 7s y fases 0..2π de verdad.
    float chd = fract(ch * 913.37);
    // Velocidad (V17.47, "mucho más brillante y rápido"): 0.9 + chd*2.6 daba
    // periodos de ~1.8 a 7s, que a simple vista era un respirar lento. Ahora
    // 3.2 + chd*6.4 → periodos de ~0.65 a 2s: parpadeo de verdad, y sigue
    // repartido para que no vayan todos a una.
    float tw = step(0.92, ch) * (0.5 + 0.5 * sin(uTime * (3.2 + chd * 6.4) + chd * 6.2832));
    // Brillo 0.45 → 1.15 (V17.47). Es el término dominante del estado apagado:
    // la rejilla base va a 0.16 y estas celdas ahora la superan con holgura,
    // que es justo lo que se pedía — que destaquen sobre la cuadrícula.
    col += uLine * tw * 1.15 * (1.0 - uPower);

    // ===== Textura extra del estado APAGADO (V17.18, "más detalle y
    // textura") — todo escala con (1-uPower): desaparece al encender. =====
    float offAmt = 1.0 - uPower;
    float offL = min(uOffLift, 2.4);
    vec2 tp = fract(p);
    // a) El cristal de cada monitor se hunde hacia su marco: sombra
    // interior por tile, volumen físico de cada pantalla.
    float inset = smoothstep(0.0, 0.18, tp.x) * smoothstep(1.0, 0.82, tp.x)
                * smoothstep(0.0, 0.22, tp.y) * smoothstep(1.0, 0.78, tp.y);
    // 0.55 → 0.72 (V17.20) → 0.86 (V17.21): sombra apenas insinuada.
    col *= mix(1.0, mix(0.86, 1.0, inset), offAmt);
    // b) Brillo de cristal: banda diagonal tenue por panel, cada uno con
    // posición e intensidad propias — luz ambiente reflejada en el vidrio.
    float sh = fract(sin(dot(pid, vec2(93.7, 211.3))) * 611.9);
    float bandPos = tp.x * 0.8 + tp.y * 0.5;
    float sheen = max(0.0, (1.0 - abs(bandPos - (0.35 + 0.5 * sh))) * 1.6 - 0.9);
    col += vec3(0.032, 0.035, 0.045) * sheen * (0.4 + 0.6 * ph) * offL * offAmt;
    // c) Subpíxeles "atascados": celdas sueltas (~0.2%) tenuemente
    // encendidas en azulado o verdoso. Ya NO fijas (V17.35, "que no se
    // quede fijo ninguno"): respiran lento, cada una con fase y velocidad
    // propias — entre el 25% y el 100% de su brillo.
    float sp = fract(sin(dot(cid, vec2(741.3, 128.5))) * 397.1);
    vec3 stuckCol = mix(vec3(0.05, 0.07, 0.10), vec3(0.045, 0.085, 0.065), step(0.5, fract(sp * 37.0)));
    // spd (V17.36): mismo problema de apiñamiento que chd — sp de los
    // elegidos vive en [0.998,1) y el pulso de V17.35 salía sincronizado
    // (leía como fijo). Re-esparcido + pulso profundo (10%→100%): ninguno
    // mantiene brillo constante.
    float spd = fract(sp * 1543.7);
    float stuckPulse = 0.1 + 0.9 * (0.5 + 0.5 * sin(uTime * (0.5 + spd * 1.8) + spd * 6.2832));
    col += stuckCol * step(0.998, sp) * stuckPulse * offL * offAmt;
    // d) Grano sutil animado: la superficie respira vista de cerca.
    // (grain, no "gr": gr ya existe arriba como vec2 de la rejilla — la
    // redefinición rompía la compilación del programa entero, V17.19.)
    float grain = fract(sin(dot(gl_FragCoord.xy + vec2(uTime * 60.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
    col += vec3((grain - 0.5) * 0.006 * offL) * offAmt;
    }
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

    // Marco del viewport (V17.21, "sombreado fino pero intenso alrededor
    // de la pantalla, solo en ordenador"): banda de ~90px de buffer pegada
    // a los 4 bordes con caída cuadrática — intensa en el borde mismo,
    // desaparece rápido hacia dentro. uFrameShade = 1 solo en desktop.
    float ebp = min(min(gl_FragCoord.x, uRes.x - gl_FragCoord.x), min(gl_FragCoord.y, uRes.y - gl_FragCoord.y));
    float frame = 1.0 - smoothstep(0.0, 90.0, ebp);
    col *= 1.0 - frame * frame * 0.85 * uFrameShade;

    // Atenuación global del muro (petición: "oscurece un poco el fondo en
    // ordenador") — solo <1 en desktop, ver el efecto de orientación en JS.
    // Apagada casi no se atenúa (suelo 0.9): uDim existe para domar el
    // BRILLO del vídeo bajo el texto; el apagado ya es casi negro de por
    // sí y los LEDs/rejilla deben seguir leyéndose (V17.12).
    col *= mix(0.9, uDim, uPower);

    // Brillo de las crestas de la onda: la cara del agua que se inclina hacia
    // la luz devuelve más. Va AL FINAL, después de las atenuaciones, para que
    // el destello no se lo coma la viñeta ni uDim — es el remate que hace que
    // la deformación se lea como refracción y no como un pandeo de la imagen.
    col *= 1.0 + ripW * 0.75;

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
  // Cambio de vídeo por paneles (V17.22): valor renderizado y target de
  // uSwitch, el finalize que registra el efecto gestor (lo llama useFrame
  // al completarse la cascada) y el vídeo override activo (para que el
  // keep-alive y los guards del pipeline por defecto sepan quién manda).
  const switchRef = useRef(0);
  const switchTargetRef = useRef(0);
  const finalizeSwitchRef = useRef<(() => void) | null>(null);
  const overrideVideoRef = useRef<HTMLVideoElement | null>(null);
  // Live handle to the current <video> for the keep-alive interval below —
  // rendering must never depend on the video actually playing (phones can
  // refuse/delay autoplay, and in "demand" mode the video's rVFC is the
  // page-wide invalidation source: a stalled video used to freeze ALL
  // demand-mode rendering, including the hero CTA's glass panel).
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  // Piedra en el agua (V17.70). `pending` lo levanta el evento y lo consume el
  // useFrame, que es quien tiene el reloj de la escena: el listener no puede
  // fijar el instante de impacto por su cuenta porque `clock.elapsedTime` no
  // avanza mientras no se renderiza (modo demand), y un origen en tiempo real
  // haría que la onda arrancase ya empezada.
  const ripPendingRef = useRef(false);
  const ripStartRef = useRef(-1);

  // Always-valid 1x1 texture so `uSource` samples something before/without a
  // real video (the procedural path ignores it, but the sampler must be bound).
  const blankTex = useMemo(() => {
    const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    t.needsUpdate = true;
    return t;
  }, []);

  const uniforms = useMemo(
    () => ({
      // Valor inicial nominal — el efecto de orientación lo re-deriva de
      // uPanels en el primer mount (4x4 celdas por monitor, V17.23).
      uCells: { value: new THREE.Vector2(60, 40) },
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
      uPixel: {
        value: new THREE.Vector2(PIXEL_X, Math.round(PIXEL_X / wallAspect(WALL_MODES.landscape))),
      },
      uCoverScale: { value: new THREE.Vector2(1, 1) },
      uPanels: { value: new THREE.Vector2(15, Math.round(15 / wallAspect(WALL_MODES.landscape))) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uDim: { value: 1 },
      uPower: { value: 1 },
      uTime: { value: 0 },
      uOffLift: { value: 1 },
      uFrameShade: { value: 0 },
      uSourceB: { value: blankTex as THREE.Texture },
      uCoverScaleB: { value: new THREE.Vector2(1, 1) },
      uHasVideoB: { value: 0 },
      uSwitch: { value: 0 },
      uVidGamma: { value: 1 },
      uVidSat: { value: 1 },
      uRipT: { value: -1 },
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
    (mat.uniforms.uPixel.value as THREE.Vector2).set(PIXEL_X, Math.round(PIXEL_X / a));
    const panelsY = Math.max(2, Math.round(mode.PANELS_X / a));
    (mat.uniforms.uPanels.value as THREE.Vector2).set(mode.PANELS_X, panelsY);
    // Cuadrícula fina ANIDADA en los monitores (V17.23, "que encaje"): 4x4
    // celdas exactas por panel, derivadas de uPanels — cada 4ª línea fina
    // coincide con un bisel. El (52,40) fijo de antes no era múltiplo y los
    // cuadros pequeños se cortaban contra las líneas gruesas.
    (mat.uniforms.uCells.value as THREE.Vector2).set(mode.PANELS_X * 4, panelsY * 4);
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
    // Marco de sombra del viewport solo en desktop (V17.21).
    mat.uniforms.uFrameShade.value = mode === WALL_MODES.portrait ? 0 : 1;
    // Contraste del vídeo solo en desktop (V17.31, "se ven grisáceos"):
    // gamma 1.45 hunde los negros del clip; móvil neutro.
    mat.uniforms.uVidGamma.value = mode === WALL_MODES.portrait ? 1 : 1.45;
    // Saturación del vídeo (V17.43, "se ven muy apagados"). Desktop pide más
    // que móvil: allí el clip pasa por gamma 1.45 y uDim 0.32, y al hundirse
    // la luminancia el ojo percibe menos color (efecto Hunt); móvil va con
    // uDim 1.35 y sin gamma, así que con menos ya llega. El mix con la base
    // (0.5) se lleva por delante ~la mitad de lo que se aplique aquí.
    mat.uniforms.uVidSat.value = mode === WALL_MODES.portrait ? 1.5 : 1.85;
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
      } else if (!overrideVideoRef.current) {
        // Con un override por servicio delante (V17.22) el clip por
        // defecto se queda en pausa: reanudarlo sería decodificar en balde.
        video.play().catch(() => {});
        if (supportsRVFC) rvfcId = video.requestVideoFrameCallback(onFrame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Phones can refuse the eager autoplay (data saver, low-power mode,
    // browser quirks) — retry on any real user gesture, which always
    // satisfies autoplay policies. Cheap no-op once playing.
    const kick = () => {
      if (video.paused && !document.hidden && !overrideVideoRef.current) video.play().catch(() => {});
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

  // ===== Cambio de vídeo del muro POR SERVICIO (V17.22) =====
  // Escucha `nxr:wall-video` (detail.src: string | null; null = clip por
  // defecto de la orientación — lo emite Servicios.tsx al cambiar la card
  // enfocada y al salir de la sección). La transición es DIRECTA de clip a
  // clip con la cascada de paneles (uSwitch), sin apagado intermedio: el
  // clip entrante carga en un slot B propio, la cascada solo arranca cuando
  // YA reproduce (la carga queda enmascarada: hasta entonces sigue el clip
  // actual), y al completarse el finalize mueve el clip al slot frontal
  // (uSource) y devuelve uSwitch a 0 en el mismo frame — ningún píxel
  // cambia. También en móvil: mismos clips landscape, el cover-crop del
  // shader los encuadra. Un clip inexistente (404/decode) aborta la
  // transición sin tocar el muro actual.
  useEffect(() => {
    if (!tv || !videoSrc) return;
    const mat = matRef.current;
    if (!mat) return;

    type Slot = { key: string | null; video: HTMLVideoElement; tex: THREE.VideoTexture; dispose: () => void };
    let front: Slot | null = null; // override visible (null = pipeline por defecto)
    let incoming: Slot | null = null; // slot B cargando / en cascada
    let currentKey: string | null = null; // null = clip por defecto
    let pending: string | null | undefined; // undefined = nada en cola

    const setCover = (video: HTMLVideoElement, cover: THREE.Vector2) => {
      // Mismo cover-crop + zoom-out que el pipeline por defecto (ver onReady
      // del efecto de arriba).
      const va = video.videoWidth / video.videoHeight || 1;
      const wa = wallAspect(portrait ? WALL_MODES.portrait : WALL_MODES.landscape);
      const zoom = va > 1 ? 1.3 : 1;
      if (va > wa) cover.set((wa / va) * zoom, zoom);
      else cover.set(zoom, (va / wa) * zoom);
    };

    const retireIncoming = () => {
      if (!incoming) return;
      const s = incoming;
      incoming = null;
      s.dispose();
      mat.uniforms.uHasVideoB.value = 0;
      mat.uniforms.uSourceB.value = blankTex;
    };

    const startTransition = (key: string | null) => {
      retireIncoming();
      const src = key ?? videoSrc;
      const video = document.createElement("video");
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("autoplay", "");
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.loop = true;
      video.preload = "auto";
      video.src = src;
      video.play().catch(() => {});
      const tex = new THREE.VideoTexture(video);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.LinearFilter;
      tex.wrapS = THREE.MirroredRepeatWrapping;
      tex.wrapT = THREE.MirroredRepeatWrapping;
      const supportsRVFC = typeof video.requestVideoFrameCallback === "function";
      let rvfcId: number | null = null;
      const onFrame = () => {
        invalidate();
        if (!document.hidden) rvfcId = video.requestVideoFrameCallback(onFrame);
      };
      const onReady = () => {
        if (incoming?.video !== video) return;
        setCover(video, mat.uniforms.uCoverScaleB.value as THREE.Vector2);
        mat.uniforms.uSourceB.value = tex;
        mat.uniforms.uHasVideoB.value = 1;
        if (supportsRVFC) rvfcId = video.requestVideoFrameCallback(onFrame);
        // La cascada arranca SOLO con el clip ya reproduciendo.
        switchTargetRef.current = 1;
        invalidate();
      };
      const onError = () => {
        if (incoming?.video !== video) return;
        retireIncoming();
        switchTargetRef.current = 0;
        pending = undefined;
        invalidate();
        // Clip del servicio inexistente/roto (V17.25, "solo cuando está
        // seleccionada esa card"): el fallback es volver al clip por
        // DEFECTO, no quedarse con el del servicio anterior. Sin reintento
        // si lo que falló era justamente el defecto (evita el bucle).
        if (key !== null && currentKey !== null) startTransition(null);
      };
      video.addEventListener("loadeddata", onReady);
      video.addEventListener("error", onError);
      incoming = {
        key,
        video,
        tex,
        dispose: () => {
          video.removeEventListener("loadeddata", onReady);
          video.removeEventListener("error", onError);
          if (rvfcId !== null && supportsRVFC) video.cancelVideoFrameCallback(rvfcId);
          video.pause();
          video.src = "";
          tex.dispose();
        },
      };
    };

    finalizeSwitchRef.current = () => {
      if (!incoming) {
        // Transición abortada a mitad: solo resetear el mando.
        switchTargetRef.current = 0;
        switchRef.current = 0;
        mat.uniforms.uSwitch.value = 0;
        return;
      }
      // Swap ATÓMICO: el frontal pasa a ser el clip entrante y uSwitch
      // vuelve a 0 en el mismo frame — visualmente idéntico.
      mat.uniforms.uSource.value = incoming.tex;
      (mat.uniforms.uCoverScale.value as THREE.Vector2).copy(mat.uniforms.uCoverScaleB.value as THREE.Vector2);
      mat.uniforms.uHasVideo.value = 1;
      mat.uniforms.uSourceB.value = blankTex;
      mat.uniforms.uHasVideoB.value = 0;
      switchTargetRef.current = 0;
      switchRef.current = 0;
      mat.uniforms.uSwitch.value = 0;
      const old = front;
      front = incoming;
      incoming = null;
      currentKey = front.key;
      overrideVideoRef.current = front.video;
      if (old) old.dispose();
      else videoElRef.current?.pause(); // el defecto duerme mientras haya override
      invalidate();
      // Cola: si llegó otro cambio durante la cascada, encadenarlo.
      if (pending !== undefined && pending !== currentKey) {
        const p = pending;
        pending = undefined;
        startTransition(p);
      } else {
        pending = undefined;
      }
    };

    const onSetVideo = (e: Event) => {
      const key = ((e as CustomEvent).detail?.src ?? null) as string | null;
      if (key === currentKey) {
        // Ya se muestra: descarta cola y cualquier cascada a medias.
        pending = undefined;
        if (incoming) {
          retireIncoming();
          switchTargetRef.current = 0;
          invalidate();
        }
        return;
      }
      if (incoming) {
        pending = key;
        return;
      }
      startTransition(key);
    };
    window.addEventListener("nxr:wall-video", onSetVideo);

    // Pausa/reanuda los vídeos propios con la visibilidad de la pestaña, y
    // reintento por gesto (mismas políticas de autoplay que el defecto).
    const onVisibility = () => {
      const vids = [front?.video, incoming?.video];
      vids.forEach((v) => {
        if (!v) return;
        if (document.hidden) v.pause();
        else v.play().catch(() => {});
      });
    };
    document.addEventListener("visibilitychange", onVisibility);
    const kick = () => {
      [front?.video, incoming?.video].forEach((v) => {
        if (v && v.paused && !document.hidden) v.play().catch(() => {});
      });
    };
    window.addEventListener("touchstart", kick, { passive: true });
    window.addEventListener("pointerdown", kick, { passive: true });

    return () => {
      window.removeEventListener("nxr:wall-video", onSetVideo);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("touchstart", kick);
      window.removeEventListener("pointerdown", kick);
      retireIncoming();
      if (front) front.dispose();
      front = null;
      overrideVideoRef.current = null;
      finalizeSwitchRef.current = null;
      switchTargetRef.current = 0;
      switchRef.current = 0;
      mat.uniforms.uSwitch.value = 0;
      mat.uniforms.uHasVideoB.value = 0;
      mat.uniforms.uSourceB.value = blankTex;
      // uSource lo restaura el cleanup/re-run del pipeline por defecto.
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

  // ===== Piedra en el agua al abrirse la cortina (V17.70) =====
  // Se engancha a `nxr:curtain-open`, el hito que YA emite LoadProgress: es
  // justo el instante en que la web se descubre, y así el impacto y la
  // apertura son el mismo gesto sin que ninguno de los dos tenga que conocer
  // al otro. Es un hito suelto, que es para lo que este proyecto usa
  // CustomEvent (los valores continuos van por módulo mutable).
  // El `invalidate()` es imprescindible: en modo demand no hay frame pendiente
  // y sin él la onda no arrancaría hasta el siguiente scroll.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Sin movimiento si el usuario lo ha pedido: la cortina se va con un fundido
    // (ver globals.css) y el muro se queda quieto.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const golpe = () => {
      ripPendingRef.current = true;
      invalidate();
    };
    // Solo el evento, deliberadamente: nada de recuperar un impacto ya
    // ocurrido mirando window.__nxrCurtainOpen. La cortina se abre con
    // `nxr:wall-settled`, que emite ESTE mismo componente, así que cuando llega
    // el turno de abrirse este listener ya existe siempre. Un catch-up, en
    // cambio, dispararía una onda huérfana —sin cortina que la acompañe— si el
    // componente se remontara después (cambio de clip, failsafe de 8s sin
    // canvas), en mitad de una página que el usuario ya está leyendo.
    window.addEventListener("nxr:curtain-open", golpe, { once: true });
    return () => window.removeEventListener("nxr:curtain-open", golpe);
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
      // Con override por servicio (V17.22), el vídeo que debe estar
      // produciendo frames es el override, no el clip por defecto pausado.
      const v = overrideVideoRef.current ?? videoElRef.current;
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

      // Onda de impacto: se auto-invalida frame a frame mientras vive, porque
      // en modo demand nadie más pediría renders a 60fps (el rVFC del vídeo va
      // a ~30 y dejaría la onda a saltos). Al terminar se apaga con un último
      // invalidate para que el frame final quede ya sin deformación.
      if (ripPendingRef.current) {
        ripPendingRef.current = false;
        ripStartRef.current = clock.elapsedTime;
      }
      if (ripStartRef.current >= 0) {
        const t = clock.elapsedTime - ripStartRef.current;
        if (t <= RIPPLE_DUR) {
          matV.uniforms.uRipT.value = t;
          invalidate();
        } else {
          ripStartRef.current = -1;
          matV.uniforms.uRipT.value = -1;
          invalidate();
        }
      }

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
      let pNext = pPrev === null ? pTarget : pPrev + (pTarget - pPrev) * 0.07;
      // SNAP al target (V17.76). Una amortiguación así es asintótica: se
      // quedaba clavada en ~0.998 y nunca alcanzaba el 1.0. Da igual a la
      // vista, pero el shader ahora se salta TODO el bloque de pantalla
      // apagada con `uPower < 1.0`, y ese salto solo ocurre con el valor
      // EXACTO — sin esto, la web entera seguiría calculando por píxel un
      // estado apagado que ya no se ve. Mismo patrón que la rampa de
      // uSwitch de más abajo.
      if (Math.abs(pTarget - pNext) <= 0.002) pNext = pTarget;
      powerRef.current = pNext;
      matV.uniforms.uPower.value = pNext;
      // Sigue invalidando mientras la rampa no asiente (modo demand).
      if (pPrev !== null && pNext !== pTarget) invalidate();

      // ===== Cambio de vídeo por paneles (V17.22): rampa de uSwitch =====
      // Misma amortiguación que el power; al asentar en 1 dispara el
      // finalize del efecto gestor (swap atómico y uSwitch de vuelta a 0).
      const sTarget = switchTargetRef.current;
      const sPrev = switchRef.current;
      if (sPrev !== sTarget) {
        let sNext = sPrev + (sTarget - sPrev) * 0.07;
        if (Math.abs(sTarget - sNext) <= 0.002) sNext = sTarget;
        switchRef.current = sNext;
        matV.uniforms.uSwitch.value = sNext;
        if (sNext !== sTarget) invalidate();
        else if (sTarget === 1) finalizeSwitchRef.current?.();
      }
    }
    const c = current.current;
    const t = target.current;
    c.x += (t.x - c.x) * 0.09;
    c.y += (t.y - c.y) * 0.09;

    // (V18.19: aquí vivía la recolocación del muro por sección — cada sección
    // lo plantaba en una pose distinta, sacada del índice por el ángulo áureo.
    // Se ha eliminado a petición: ese movimiento al cruzar de sección se leía
    // como un desplazamiento de cámara y molestaba al bajar. El muro solo
    // responde ya al parallax del cursor, que es su gesto de siempre.)
    const group = groupRef.current;
    if (group) {
      group.rotation.y = c.x * 0.09;
      group.rotation.x = -c.y * 0.065;
    }
    const mat = matRef.current;
    if (mat) {
      (mat.uniforms.uFocus.value as THREE.Vector2).set(0.5 + c.x * 0.14, 0.46 - c.y * 0.11);
    }

    if (Math.abs(t.x - c.x) > 0.001 || Math.abs(t.y - c.y) > 0.001)
      invalidate();
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
