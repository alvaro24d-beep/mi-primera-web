"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import SceneBackground from "./SceneBackground";
import GearPoints from "./GearPoints";

import ServiciosCardsLayer from "./ServiciosCardsLayer";
import ZoomParallaxCardsLayer from "./ZoomParallaxCardsLayer";
import GlassPanelsLayer from "./GlassPanelsLayer";
import PixelCamera, { CAMERA_DISTANCE } from "./PixelCamera";
import { nearSections, canvasBox, poseSeccion } from "@/store/sceneActivity";
import { useReducedMotion } from "@/hooks/useReducedMotion";


// Procedural HDRI: `<Environment>` + `<Lightformer>` only — never the
// `preset` prop, which downloads an HDRI from drei's CDN at runtime. That
// was confirmed slow/unreliable enough to hang a page load while building
// DesarrolloWebHero (see AGENTS.md) — this is fully local/instant instead,
// and the Lightformers are tinted with the site's own brand colors so
// reflections read as "this site" rather than a generic gray studio.
function SceneEnvironment() {
  return (
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={1.4} color="#a8f04a" position={[-4, 3, 4]} scale={[4, 4, 1]} />
      <Lightformer form="rect" intensity={1.1} color="#ff9d7d" position={[4, -2, 3]} scale={[3, 5, 1]} />
      <Lightformer form="rect" intensity={0.8} color="#ef3d0d" position={[0, 4, -3]} scale={[6, 2, 1]} />
      {/* COMPACT camera-aligned fill (not a wall of light): a dome needs a
          concentrated highlight that falls off toward the rim to read as
          curved — a huge uniform panel lights the whole face evenly and
          makes it look flat. Slightly off-centre so the hotspot sits off
          the bulge apex naturally. */}
      <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[-1.5, 1, 7]} scale={[5, 5, 1]} />
      <Lightformer form="ring" intensity={0.5} color="#ffffff" position={[0, 0, 6]} scale={[8, 8, 1]} />
      {/* ONE thin bright strip: a straight line reflecting off a domed
          surface renders as a visibly BENT band sweeping across the face —
          the strongest available cue that the card is convex. Deliberately
          a single strip: every extra small bright source wraps into its own
          separate blob on the dome, and the face turns busy/lava-lamp
          instead of reading as one elegant curved sheen (tried and
          reverted). */}
      <Lightformer form="rect" intensity={2.1} color="#ffffff" position={[0, 3.5, 6]} scale={[20, 0.3, 1]} />
    </Environment>
  );
}

// Mide la posición real del canvas fijo cada frame ANTES de que las capas
// mapeen sus rects (prioridad -50) — ver el comentario de `canvasBox` en
// store/sceneActivity.ts (teclado móvil ↔ elementos fixed recolocados).
// Una sola lectura de rect por frame, compartida por las tres capas.
function CanvasBoxTracker({ el }: { el: React.RefObject<HTMLCanvasElement | null> }) {
  useFrame(() => {
    const c = el.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    canvasBox.x = r.left;
    canvasBox.y = r.top;
  }, -50);
  return null;
}

// Precompila TODOS los shaders de la escena nada más montar el canvas, en vez
// de dejar que el primer draw los compile bajo demanda. Sin esto, el primer
// programa de MeshTransmissionMaterial (un shader ENORME) se compilaba en el
// instante exacto en que `nxr-servicios` entraba en el margen de 300px del
// observer — con la Intro en pantalla — y el hilo principal se congelaba
// ~1-2s en mitad del scroll (medido: long task de 1805ms; solo la primera
// vez por carga, porque el programa queda cacheado después). El warm-up de
// 45 frames de ServiciosCardsLayer no lo evitaba: dibuja a opacidad 0, pero
// también arranca al entrar en el margen, así que solo movía el coste unos
// frames. Claves de por qué esto funciona:
//  - `WebGLRenderer.compile()` recorre la escena con `scene.traverse` (no
//    `traverseVisible`), así que las cards aparcadas en `visible=false`
//    también compilan sus programas.
//  - `compileAsync` usa KHR_parallel_shader_compile: la compilación corre en
//    hilos del proceso GPU y solo se hace `useProgram` cuando está lista —
//    cero bloqueo del main thread donde la extensión existe (Chrome/Edge/
//    Android); donde no (Safari), el coste se paga igualmente AQUÍ, en el
//    idle de la carga, no en mitad del scroll del usuario.
function ShaderWarmup() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const warm = () => {
      if (cancelled) return;
      // El <Environment> de drei instala scene.environment un par de frames
      // tras montar (primero renderiza los Lightformers a su PMREM). Compilar
      // ANTES cachearía la variante de programa SIN envmap — y la variante
      // real seguiría compilándose en el primer draw visible, que es
      // exactamente el parón que este componente elimina.
      if (!scene.environment) {
        timer = window.setTimeout(warm, 100);
        return;
      }
      gl.compileAsync(scene, camera).catch(() => {
        // Contexto perdido / teardown — peor caso: compilación lazy como antes.
      });
    };
    warm();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [gl, scene, camera]);
  return null;
}

export default function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Client-side navigation keeps this canvas ALIVE across routes (that's the
  // whole point — the backdrop never reloads); the section observer below
  // re-arms per pathname so the NEW route's sections get tracked.
  const pathname = usePathname();
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  // Para la nube de puntos: con reduced motion se queda quieta.
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(true);
  // Frameloop has THREE regimes (see the `frameloop` prop below):
  //   • tab hidden                        → "never"  (fully idle)
  //   • card section near AND user active → "always" (60fps while it matters)
  //   • otherwise (idle, hero, etc)       → "demand" (renders only when invalidated,
  //     in practice at the wall video's frame rate)
  // The concave cylinder backdrop (SceneBackground) is global, so the canvas
  // can no longer go fully idle off the card sections the way it used to —
  // but it doesn't need to run at 60fps there either: the backdrop is static
  // apart from a light cursor parallax, which self-invalidates only while the
  // pointer moves (see SceneBackground.tsx). So "demand" keeps the GPU idle
  // between interactions while still painting the backdrop everywhere, and
  // "always" is reserved for the two sections whose glass cards genuinely
  // animate each frame. The sections are far apart, so at most one is ever
  // near at a time.
  const [cardsNear, setCardsNear] = useState(false);
  // TRUE while the user is actually interacting (scroll/wheel/pointer/touch
  // within the last ~450ms). The "always" 60fps regime used to run
  // CONTINUOUSLY near any glass section — reading a static paragraph next
  // to idle glass panels burned 60 full renders/s (transmission capture +
  // bloom included), the single biggest steady-state heat source. Nothing
  // there moves without input except micro-drifts, which read fine at the
  // video-driven demand rate, so idle now always falls back to "demand".
  // Engage is INSTANT (any input flips it synchronously); disengage lazy.
  const [engaged, setEngaged] = useState(false);
  const engagedRef = useRef(false);
  const lastActivity = useRef(0);
  // The TV-wall video is portrait/landscape-specific (a vertical clip reads as
  // cropped-wrong letterboxed garbage stretched across a wide desktop wall,
  // and vice versa), so — unlike `isMobile` above, a device-class check fixed
  // at mount — this tracks actual aspect ratio and updates live: a phone
  // rotated to landscape, or a desktop window resized narrow, should still
  // get the orientation-matched clip.
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== "undefined" && window.innerHeight > window.innerWidth
  );

  useEffect(() => {
    const onVisibility = () => setActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const onResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const bump = () => {
      lastActivity.current = performance.now();
      if (!engagedRef.current) {
        engagedRef.current = true;
        setEngaged(true);
      }
    };
    // `scroll` covers everything that actually moves the page (Lenis drives
    // the REAL scroll position, including its inertia tail and programmatic
    // glides), pointer/touch/wheel cover hover/tilt interactions that don't
    // scroll.
    window.addEventListener("scroll", bump, { passive: true });
    window.addEventListener("wheel", bump, { passive: true });
    window.addEventListener("pointermove", bump, { passive: true });
    window.addEventListener("touchmove", bump, { passive: true });
    window.addEventListener("touchstart", bump, { passive: true });
    const settle = window.setInterval(() => {
      if (engagedRef.current && performance.now() - lastActivity.current > 450) {
        engagedRef.current = false;
        setEngaged(false);
      }
    }, 200);
    return () => {
      window.removeEventListener("scroll", bump);
      window.removeEventListener("wheel", bump);
      window.removeEventListener("pointermove", bump);
      window.removeEventListener("touchmove", bump);
      window.removeEventListener("touchstart", bump);
      window.clearInterval(settle);
    };
  }, []);

  useEffect(() => {
    // Sections whose glass meshes ANIMATE every frame (scroll-scrubbed reels,
    // GSAP-revealed panels): near any of them the frameloop runs "always" so
    // the meshes track their DOM anchors frame-by-frame; elsewhere "demand".
    // Home sections + the /desarrollo-web ones with live glass panels — ids
    // missing on the current route are simply filtered out below, so one
    // list serves every page the global canvas backs.
    const alwaysIds = [
      "nxr-servicios",
      "nxr-zoom-parallax",
      "nxr-intro",
      // (nxr-proceso salió en V18.01, mismo caso que nxr-dwh-proceso: sus cards
      // dejaron de ser anclas de cristal, así que ya no hay ninguna malla que
      // seguir ahí y forzar el bucle a "always" eran 60fps por nada.)
      "nxr-tech",
      "nxr-contacto",
      // (nxr-dwh-proceso salió de aquí en V17.99. Estaba porque su reel
      // horizontal movía las cards cada frame; desde V17.98 es una rejilla
      // quieta y desde V17.99 ni siquiera tiene mallas de cristal que seguir,
      // así que forzar el bucle a "always" mientras la sección estuviera cerca
      // era 60fps continuos sin nada que dibujar — parte del lag que se notaba
      // justo ahí.)
      // (nxr-dwh-capacidades salió en V18.14, mismo caso que los dos procesos:
      // sus cards pasaron de ser anclas de cristal volumétrico a llevar
      // backdrop-filter, así que ya no hay ninguna malla que seguir ahí.)
      "nxr-aia-hero",
      "nxr-aia-casos",
      "nxr-aia-noche",
      "nxr-aia-pasos",
      "nxr-precios",
      "nxr-seo-pasos",
      "nxr-seo-resultados",
    ];
    // The hero hosts one mostly-static panel (the CTA button): it needs its
    // section tracked in `nearSections` so its PanelSlot does work when
    // visible, but NOT a 60fps "always" loop — the TV-wall video already
    // invalidates ~25-30 renders/s page-wide, which tracks a pinned button
    // just fine and keeps the top of the page on the cheap demand loop.
    const ids = [...alwaysIds, "nxr-hero"];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const nearby = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).id;
          if (e.isIntersecting) {
            nearby.add(e.target);
            nearSections.add(id);
          } else {
            nearby.delete(e.target);
            nearSections.delete(id);
          }
        }
        setCardsNear([...nearby].some((el) => (el as HTMLElement).id !== "nxr-hero"));
      },
      { rootMargin: "300px 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => {
      io.disconnect();
      nearSections.clear();
    };
    // [pathname]: the ids are looked up with getElementById at effect time —
    // with the canvas persisting across client-side navigations, a
    // mount-once observe would leave every section of the NEXT route
    // untracked (meshes invisible forever).
  }, [pathname]);

  // ===== Qué sección se está mirando -> pose del muro (V17.95) =====
  // Observer aparte del de arriba, y no una opción más de aquel, porque
  // pregunta otra cosa: el de arriba es "¿está CERCA?" (margen de +300px, para
  // encender trabajo por adelantado) y este es "¿es la que se está mirando
  // AHORA?". Con rootMargin -45% arriba y abajo, el área de disparo se reduce a
  // una banda del 10% en mitad de la pantalla, así que el cambio ocurre cuando
  // la sección nueva llega al centro de la vista y no cuando asoma por el
  // borde. Un solo IntersectionObserver, cero trabajo por frame y cero
  // listeners de scroll: el navegador ya sabe hacer esto.
  //
  // Se observan TODAS las <section id> del documento, no una lista: así una
  // página nueva participa sola, sin tener que acordarse de apuntarla aquí
  // (que es justo el fallo que tiene la lista de arriba, donde olvidarse deja
  // las mallas invisibles para siempre).
  useEffect(() => {
    // Con reduced motion el muro se queda quieto: este movimiento es
    // decorativo y es exactamente el tipo de desplazamiento no pedido que
    // molesta a quien activa esa preferencia.
    if (reducedMotion) {
      poseSeccion.indice = 0;
      return;
    }
    const secciones = Array.from(document.querySelectorAll<HTMLElement>("section[id]"));
    if (!secciones.length) return;
    const orden = new Map<Element, number>();
    secciones.forEach((s, i) => orden.set(s, i));
    const enBanda = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) enBanda.add(e.target);
          else enBanda.delete(e.target);
        }
        // Si dos secciones cortas comparten la banda, manda la de más arriba:
        // el criterio tiene que ser estable, porque alternar entre dos poses
        // dejaría el muro oscilando mientras el scroll está parado.
        let primera = Infinity;
        for (const el of enBanda) {
          const i = orden.get(el);
          if (i !== undefined && i < primera) primera = i;
        }
        if (primera !== Infinity) poseSeccion.indice = primera;
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    secciones.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [pathname, reducedMotion]);

  return (
    <div
      // .nxr-scene-arrive: opacity 0 → 1 on mount (globals.css). The whole
      // canvas mounts lazily on idle (SceneCanvasLazy), so the backdrop
      // FADES onto the dark body instead of popping in mid-load.
      className="nxr-scene-arrive"
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
      <Canvas
        ref={canvasRef}
        frameloop={!active ? "never" : cardsNear && engaged ? "always" : "demand"}
        // Perf pass: 1.25 desktop. The backdrop is a deliberately pixelated CRT
        // and the cards are frosted glass — the ~40% pixel-count cut is not
        // visible on either, and fill rate is this scene's dominant GPU cost
        // (fullscreen wall + transmission + bloom).
        //
        // MÓVIL SUBE DE 1 A 2 (V17.93), y es la única forma de arreglar lo que
        // se veía. A dpr 1 sobre un teléfono de densidad 3 el canvas se dibuja
        // a un tercio de la resolución de la pantalla y el navegador ESTIRA el
        // resultado x3: todo lo que hay dentro llega interpolado, y un detalle
        // fino como un punto de 4px se convierte en una mancha de 12. Eso no lo
        // arregla ningún shader —la información no está— y por eso tres
        // intentos seguidos de afinar el punto no cambiaron nada en el móvil.
        // A dpr 2 el estirado baja de x3 a x1.5.
        //
        // Se paga: son 4 veces los píxeles que el shader del muro tiene que
        // rellenar por frame, y el relleno es el coste dominante de esta
        // escena. El tope es 2 y no el devicePixelRatio real precisamente por
        // eso — a 3 serían 9 veces y no hay teléfono que lo sostenga con este
        // muro. Si aparece lag en gama baja, la palanca es bajarlo a 1.5.
        dpr={isMobile ? [1, 2] : [1, 1.25]}
        camera={{ position: [0, 0, CAMERA_DISTANCE], fov: 50, near: 1, far: CAMERA_DISTANCE * 3 }}
        // antialias false on desktop too: every desktop frame goes through
        // EffectComposer, which renders into its own (multisampled) buffers —
        // MSAA on the default framebuffer was pure wasted memory/bandwidth.
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          // Servicios' frosted cards (VolumetricCard's `transmission` prop)
          // need three.js to capture a copy of what's behind them each frame
          // it's visible — normally at full render-target resolution, which
          // is the expensive part of transmission, not the shading itself.
          // Downscaling that capture is BOTH the efficient choice (a quarter
          // the pixels to copy/mipmap) AND gives the frosted "blurred
          // background" look for free — a low-res capture magnified back up
          // reads as soft blur, so roughness alone doesn't have to do all the
          // blurring work (see VolumetricCard.tsx).
          // 0.35 (was 0.2): at 0.2 the upscaled capture was SO soft that the
          // transmitted background stopped being recognizable — the glass
          // read as a murky grey pane rather than "I can see through this".
          // 0.35 keeps the image legible through the cards (clearly
          // transparent) while still costing only ~12% of full-res pixels.
          gl.transmissionResolutionScale = 0.35;
        }}
      >
        <PixelCamera />
        <CanvasBoxTracker el={canvasRef} />
        <ShaderWarmup />
        <ambientLight intensity={0.35} />
        <directionalLight position={[500, 800, 600]} intensity={0.5} color="#ffffff" />
        <SceneEnvironment />
        {/* The CRT video wall now runs on every screen — portrait screens (phones
            held normally) get a vertical-shot clip, landscape/desktop keeps the
            original horizontal one, so the wall is never showing a
            wrong-orientation video stretched/cropped to fit. `active` pauses
            its ~30fps invalidation loop when the tab is hidden. */}
        <SceneBackground
          tv
          videoSrc={isPortrait ? "/bg-video-vertical.mp4" : "/bg-video.mp4"}
          active={active}
          portrait={isPortrait}
        />
        {/* La nube de puntos vuelve AQUÍ DENTRO (V17.89). Tuvo canvas propio
            durante una versión —por resolución y por fluidez— y era un error
            de bulto: las cards de Servicios, las de ZoomParallax y los paneles
            de cristal NO son DOM, son mallas de ESTE canvas, así que cualquier
            canvas por delante se pone por delante de ellas. Y un canvas no se
            puede intercalar entre el muro y las cards cuando muro y cards son
            el mismo canvas. Estando dentro, el orden se resuelve donde debe:
            renderOrder -5 la deja después del muro (-10) y antes de todo lo
            demás (0), y como no escribe profundidad, cualquier card que pase
            por delante la tapa. De regalo, entra en la captura de transmisión
            y el cristal la refracta. */}
        {/* SOLO EN LA HOME. La nube es el acompañamiento del hero y de las
            frases de maestría, no un fondo del sitio entero: fuera de "/" no se
            monta, así que ni se descarga el .bin ni se dibujan sus puntos ni
            pide frames. El canvas persiste entre rutas, de modo que basta con
            que deje de renderizarse para que desaparezca al navegar. */}
        {pathname === "/" && <GearPoints isMobile={isMobile} reducedMotion={reducedMotion} />}
        <ServiciosCardsLayer />
        <ZoomParallaxCardsLayer isMobile={isMobile} />
        <GlassPanelsLayer />
        {!isMobile && (
          // multisampling 0 (library default: 8, then 2): MSAA on a
          // fullscreen 1.25-DPR buffer was the single most expensive setting
          // in the scene, and at 0 the glass-card silhouettes still read
          // clean (verified by screenshot A/B — the only hard edges sit over
          // a dark blurred wall, where aliasing is invisible). Dropping the
          // last 2x unlocked the 60fps budget in the Servicios stretch
          // (p50 33.3ms → 16.7ms measured).
          <EffectComposer multisampling={0}>
            {/* resolutionScale 0.5 (V17.76): el bloom es el único efecto con
                cadena de pases PROPIA — Vignette se fusiona en el EffectPass
                final y sale casi gratis, pero mipmapBlur baja y sube una
                pirámide de mipmaps, así que su coste va con el área del
                buffer de partida. A media resolución esa pirámide cuesta la
                CUARTA parte y el resultado es indistinguible: lo que produce
                es un halo difuso de varios píxeles de radio, que es
                exactamente lo que sobrevive a un reescalado. Es el ahorro de
                GPU más grande disponible sin tocar dpr (y sin tocar dpr, la
                silueta de las cards de cristal se mantiene igual de limpia). */}
            <Bloom mipmapBlur resolutionScale={0.5} luminanceThreshold={0.6} luminanceSmoothing={0.3} intensity={0.35} />
            <Vignette eskil={false} offset={0.25} darkness={0.55} />
          </EffectComposer>
        )}
      </Canvas>
      {/* (La viñeta de bordes vive ahora DENTRO del shader del muro — en
          espacio de pantalla — para oscurecer solo la pared/vídeo y nunca
          las cards de cristal, que se dibujan en este mismo canvas. Ver el
          bloque uRes en SceneBackground.tsx.) */}
    </div>
  );
}
