# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # start dev server at localhost:3000 (webpack — see note below)
npm run build         # production build (webpack)
npm run start         # run a production build
npm run lint          # eslint (eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit -p tsconfig.json   # typecheck (no dedicated package.json script)
```

There is no test suite/runner configured in this repo.

### Turbopack is intentionally disabled

`dev`/`build` pass `--webpack` explicitly. **Do not remove that flag or "helpfully" switch back to the Next.js 16 default (Turbopack).** Turbopack's bundled Lightning CSS silently drops the standard `backdrop-filter` declaration in favor of `-webkit-backdrop-filter` alone whenever both are present, and current Chromium no longer honors that prefix — the entire glassmorphism design (present on nearly every surface) renders with zero blur under Turbopack. webpack's PostCSS/Tailwind pipeline autoprefixes correctly (adds, never replaces). If a task requires Turbopack for some other reason, budget time to re-verify `backdrop-filter` across the site before shipping.

## Architecture

This is a Next.js 16.2.10 App Router site for "arcfine" (an AI/software agency; the brand is always lowercase, and it was called Nexora until V17.81 — that's where the `nxr-` class prefix comes from), built with React 19 and TypeScript. Two pages are built — the homepage (`/`) and `/desarrollo-web` — plus the `app/api/contacto` Route Handler. Per `AGENTS.md`, this Next.js version has breaking changes vs. training data — check `node_modules/next/dist/docs/` before relying on remembered APIs.

The visual design (glassmorphism cards, video wall, scroll-driven 3D effects) was originally ported from a WordPress "Code Snippets" PHP site, which is why every custom class is prefixed `nxr-` and `app/globals.css` is organized into numbered sections (`/* ===== Hero ===== */`, etc.) mirroring the original snippet blocks.

### Styling: one global stylesheet, not CSS Modules

All custom CSS lives in `app/globals.css` (~6000 lines), imported once in `app/layout.tsx`. Tailwind is imported (`@import "tailwindcss";`) but is not used for the actual design — components use hand-written classes and CSS custom properties instead. Design tokens (`--c-red`, `--c-lime`, `--c-salmon`, `--glass-bg`, `--glass-border-gradient`, `--radius-md`/`--radius-lg`, `--font`, etc.) are defined once in `:root`. The shared glass utilities (`.nxr-glass`, `.nxr-glass-edge` + `.nxr-glass-edge-content`, gradient-border-via-mask) are still used for nav, buttons and smaller chrome — but the *large* card/panel surfaces are no longer CSS glass at all: they are WebGL meshes docked behind transparent DOM anchors (see "The global 3D scene" below).

When adding a new component, add its styles to `globals.css` in a clearly-commented section rather than introducing a CSS Module, to keep the single-stylesheet convention consistent.

### The global 3D scene: one R3F canvas behind every route

The old imperative Three.js backgrounds (`ThreeBackground`/`WaveBackground`) were replaced by a unified React Three Fiber scene. `app/layout.tsx` mounts `SceneCanvasLazy`, which dynamic-imports (`ssr: false`) and idle-mounts `components/scene/SceneCanvas.tsx`: a single page-wide `<Canvas>` (fixed, `100lvh`, `z-index: -1000`, `pointer-events: none`) shared by all routes. **Never statically import `SceneCanvas`** — the ~700KB WebGL stack must stay off the load's critical path (statically imported, its parse/eval + shader compilation dominated TBT).

Load-bearing invariant: `PixelCamera` recomputes the FOV on resize so **1 three.js world unit == 1 CSS pixel at z=0** (`CAMERA_DISTANCE = 1000`). Every layer positions meshes directly from `getBoundingClientRect()` numbers — no unit conversion anywhere.

Inside the canvas:

- **Section poses (V17.95)**: the wall re-aims itself as you scroll from section to section, on the same axes as the existing cursor parallax (`group.rotation.y/x` + the shader's `uFocus`), damped at 0.045 (~1s). **It is the wall that moves, never the camera** — `PixelCamera`'s 1-unit-per-CSS-pixel invariant is what every DOM-anchored mesh depends on, so moving the camera would slide the service cards, the ZoomParallax cards and the glass panels off the HTML they are pinned to. The target pose comes from the section's **index in document order** through the golden angle (2.39996 rad), so consecutive sections never land near each other and no per-section table needs maintaining; index 0 stays dead centre (that's the hero). A second IntersectionObserver in `SceneCanvas` (`rootMargin: "-45% 0px -45% 0px"`, a 10% band at mid-screen) writes `poseSeccion.indice` in `store/sceneActivity.ts`; it observes **every `section[id]`**, so new pages join automatically — unlike the `alwaysIds` list above, forgetting a section here costs nothing. Disabled under reduced motion.
- `SceneBackground` — the concave "TV wall": custom shader on an arc geometry playing `public/bg-video.mp4` / `bg-video-vertical.mp4` (preloaded per orientation via `<link rel="preload">` in the layout, picked at runtime by live portrait tracking). Invalidates renders via `requestVideoFrameCallback` (~25–30fps page-wide), with a keep-alive that only runs while the video is stalled so a frozen video can never freeze demand-mode rendering.
- `VolumetricCard` — the reusable glass slab: procedural rounded-rect geometry with a real convex dome (concentric-ring tessellation, deliberately not `ExtrudeGeometry`) or a cylindrical `bend` — mutually exclusive; combining them draws an "X" artifact. Uses drei's `MeshTransmissionMaterial` in `transmissionSampler` mode so **all cards share one downscaled transmission capture** (`gl.transmissionResolutionScale = 0.35`, set in SceneCanvas `onCreated`) instead of per-card FBOs; the low resolution doubles as the frosted-blur look. Geometry is `useMemo`'d — built once, zero per-frame cost.
- Three layers that dock meshes behind DOM anchors: `GlassPanelsLayer` (generic flat panels: Intro, Proceso, Tech's stat strip, Contacto, the Hero CTA, ProcesoReel, CapacidadesWeb, the AgentesIa sections), `ServiciosCardsLayer` (the 5 bent service cards) and `ZoomParallaxCardsLayer` (the 7 zoom cards, see below).
- The frameloop has 3 regimes: `never` (tab hidden), `always` (only when a card section is near AND the user recently scrolled/interacted, 450ms decay), `demand` otherwise. `EffectComposer` (Bloom + Vignette) is desktop-only; `dpr` is 1.25 desktop / 1 mobile; `antialias: false` because the composer brings its own MSAA buffers. Bloom runs at `resolutionScale={0.5}` — it owns the only multi-pass chain in the composer (Vignette merges into the final EffectPass), so its cost scales with the buffer it starts from.
- The wall's fragment shader skips its whole "screen off" half (per-cell detail, twinkle, sheen, stuck subpixels, grain) and the video pipeline behind **uniform** `if`s on `uPower`. Those branches only pay off because the power ramp in `useFrame` **snaps to its target**: an asymptotic lerp would sit at ~0.998 forever and never take them. If you touch that ramp, keep the snap.

#### DOM ↔ WebGL bridge: zustand registries in `store/`

The canvas lives in a different React tree than the pages, so DOM sections register their anchor elements into registries — `useGlassPanelsRegistry` (written via `hooks/useGlassPanels.ts`), `useServiciosCardsRegistry`, `useZoomParallaxCardsRegistry` — in a `useEffect` with cleanup; the scene layers read those anchors and call `getBoundingClientRect()` inside their own `useFrame`, same frame. The visible DOM cards (`.nxr-srv-card`, `.nxr-zp-card`) are **transparent content shells** — no CSS background/blur/border; the mesh provides the glass body.

Rules that keep this fast (each one earned by a real bug):

- Inside `useFrame`, read stores via `.getState()`, never the reactive hook; per-frame data (e.g. Servicios' `setTransform`, written every GSAP tick) is an in-place mutation, not a zustand `set`, to avoid per-frame re-renders/GC churn.
- **Never `setState` from inside `useFrame`** — a version that did was silently dropped by React. Dimension changes flow ResizeObserver → registry `set` → geometry rebuild, tolerance-gated (rebuilding geometry every frame is catastrophic).
- Every layer's `useFrame` starts with a `nearSections.has(sectionId)` early-out (below), so off-screen sections cost nothing while the TV wall keeps invalidating page-wide.

#### `nearSections` — the coupling list (replaces the old `SEC_IDS`)

`store/sceneActivity.ts` exports a plain mutable `Set<string>` (deliberately NOT zustand — it's read at the top of every `useFrame`, so it must be a zero-cost `.has()`). A single IntersectionObserver in `SceneCanvas.tsx` (rootMargin 300px) adds/removes section ids. The observed ids are hardcoded there (`alwaysIds` + `"nxr-hero"`): `nxr-servicios`, `nxr-zoom-parallax`, `nxr-intro`, `nxr-proceso`, `nxr-tech`, `nxr-contacto`, `nxr-dwh-proceso`, `nxr-dwh-capacidades`, `nxr-aia-hero`, `nxr-aia-casos`, `nxr-aia-noche`, `nxr-aia-pasos`, `nxr-hero`. **Any new section containing tracked glass/cards must add its `<section id>` to that list, or its meshes stay invisible forever.** Unlike the old `SEC_IDS`, the list is order-independent and route-agnostic (ids missing from the current page are filtered out at observe time). Two layers additionally hardcode their own section id (`"nxr-servicios"` in ServiciosCardsLayer, `"nxr-zoom-parallax"` in ZoomParallaxCardsLayer) — renaming those sections breaks the gate silently.

Other counts that must stay in sync: ZoomParallax = 7 cards across `ZoomParallax.tsx` (`CARDS`), `useZoomParallaxCardsRegistry`, `ZoomParallaxCardsLayer` (`ZP_STYLES`) and the `.nxr-zp-layer:nth-child(N)` `--zp-max` rules in `globals.css`; Servicios = 5 cards across `Servicios.tsx`, `useServiciosCardsRegistry` and `ServiciosCardsLayer`.

### Page assembly

`app/page.tsx` composes the homepage as `Hero, Intro, Servicios, ZoomParallax, Proceso, Tech, Contacto`; `app/desarrollo-web/page.tsx` is `DesarrolloWebHero, ProcesoReel, CapacidadesWeb, DwhTechStack, Contacto`. `Header` is mounted once in `app/layout.tsx`, not per page.

Service detail pages live at top-level routes matching `Header.tsx`'s `SERVICIOS` array (`/desarrollo-web`, `/agentes-ia`, `/automatizaciones`, `/seo`, `/apps-software`), not under `/servicios/*`. `/desarrollo-web` is the only one built; the other four, plus `/nosotros`, `/casos`, and a standalone `/contacto`, are not implemented yet and will 404 — the only working contact form is the `Contacto` section embedded at the bottom of pages that include it.

### The point cloud (`GearPoints`, inside the global canvas)

A spoked-wheel point cloud living **inside `SceneCanvas`**, with `renderOrder={-5}`: after the wall (-10) and before everything else (0). It briefly had its own canvas in V17.88 (for `dpr` and frame independence) and that was wrong — **the service cards, the ZoomParallax cards and the glass panels are meshes of this same canvas, not DOM**, so any canvas layered in front of it sits in front of them too, and you cannot slot a canvas between the wall and the cards when both are the same canvas. Being inside also means the transmission capture picks it up, so the glass refracts it.

**The source `.glb` is never loaded**: its surface was area-sampled offline into `public/gear-points.bin` (22.000 points, Int16-quantized + `normalized`, 129KB — vs. 7,6MB and 244k triangles). Regenerate with `node scripts/muestrear-glb.js <modelo.glb> public/gear-points.bin 22000`; the `.glb` is not in the repo. All 22.000 are drawn on desktop, 4.800 on mobile (`PUNTOS_DIBUJADOS` / `PUNTOS_DIBUJADOS_MOVIL`) via `setDrawRange` — the sampling was random, so any prefix of the array is still a uniform sample.

**Count and point size are one decision, not two**, and getting it wrong is what produced several rounds of "it looks low-res" (V17.89→V17.93). What has to stay constant is the **px² of screen per point** (~22 currently) — *not* the point count, which is why "mobile draws half" was a bug: the figure covers 4.5× less area there (scale caps at 360 vs 700, and area goes with the radius squared), so half the points was more than double the density, and they empasted into each other. If you change `escala`, rebalance `uSize` and both counts together.

`uSize` 3.0 ≈ 2,1px on screen, of which the disc is 1,6 — that is the **floor**. Below ~1,5px there are no pixels left to draw an interior *and* an edge, the circle degenerates into a couple of grey pixels and the figure reads as noise. To go smaller you must first raise the canvas `dpr`, not lower `uSize` further. At this size nothing may blur the point's surroundings again: no halo, no additive blending, no bloom (below). Those three used to compensate for each other at 4px; at 1,6px none of them can come back.

Two more things that fought sharpness, both fixed and both easy to reintroduce: the material must use `NormalBlending`, **not** additive (this is a 3D surface, so front face, back face and tangent edges all overlap on screen; additive saturates those overlaps to solid white masses), and the points must stay **below the composer's Bloom threshold** (`luminanceThreshold={0.6}`) — Bloom runs at `resolutionScale={0.5}`, so anything that crosses it gets a half-resolution blurred copy of itself composited on top. `uOpacity`·`vBrillo` peaks at 0.58 for that reason; raising `uOpacity` past ~0.50 brings the halo back. Mobile has no composer at all (it is desktop-only), so there `uOpacity` runs at 0.9 — and it needs to, because the smaller the point the more its definition comes from contrast rather than area.

The canvas runs at **`dpr` 2 on mobile** (V17.93). It was 1, which meant a 3×-density phone rendered the whole scene at a third of its screen resolution and let the browser upscale — no shader can recover that, and it is why three consecutive rounds of point-shader tuning changed nothing on phones. The cost is real (4× the pixels the fullscreen wall shader fills); the cap is 2 rather than the true `devicePixelRatio` because 3 would be 9×. Drop to 1.5 if low-end devices struggle.

Mouse repulsion runs in the vertex shader in *screen space* (so it stays correct while the wheel spins) and reads a 10-entry **trail** of past cursor positions that decays over ~1,6s, which is what makes points drift back instead of snapping. The point's antialiasing width is `uAA` = framebuffer dpr / `devicePixelRatio`, so the edge lands on one *real* pixel both on a monitor that renders at physical resolution and on a phone, where the canvas runs at dpr 1 and the browser upscales ×3.

### Per-page 3D: self-contained canvases for hero scenes

Besides the global scene, a page can mount its own `<Canvas>` for a hero. `/desarrollo-web` layers `components/dwh/HeroScene.tsx` (a drifting code-glyph field with its own IntersectionObserver gating its `frameloop`, dynamic-imported `ssr: false`) *behind* a crisp DOM browser mockup (`components/dwh/BrowserBuild.tsx`) that a GSAP `ScrollTrigger` timeline in `DesarrolloWebHero.tsx` builds stage by stage. The GSAP-vs-Canvas split rules for new pages live in `AGENTS.md` (ScrollTrigger + `pin` must live in the normal DOM tree, never inside `<Canvas>`).

### Global fixed-position layers (mounted once, in `app/layout.tsx`)

- `SmoothScroll` — owns the single Lenis instance, exposed as `window.__nxrLenis`; **any programmatic scrolling must go through it** (see `Servicios.tsx`). Also calls `ScrollTrigger.config({ ignoreMobileResize: true })` and uses `syncTouch: true` so touch scroll advances in the same rAF the scene reads.
- `ScrollProgress` — red right-edge progress bar replacing the native scrollbar; rAF-coalesced, mutates only `transform: scaleY`.
- `SceneCanvasLazy` — the global WebGL backdrop (see above).
- `RevealInit` — a single page-wide `IntersectionObserver` that adds `.nxr-visible` to any `.nxr-reveal` element for fade-in-on-scroll; sections just add the `nxr-reveal` class rather than wiring up their own observer.
- `GradualBlur` ×2 — progressive backdrop-filter bands at top/bottom (`divCount={2}` on purpose: each div is a full-width blur pass the compositor re-runs on every canvas frame, so keep the count low; `strength` is calibrated against it — the outermost band blurs `0.0625·(divCount+1)·strength` rem, so changing one without the other changes the look), sitting above content but below the Header/floating nav (z-index 9998/9999). The component was pruned to these three props in V17.76 — it no longer accepts presets, responsive heights, hover intensity or `target`.

There's no shared "scroll context": components register their own native `scroll`/`resize` listeners independently. This works because Lenis drives the *real* browser scroll position (not a virtual one), so plain `window.scrollY` / native `scroll` events stay valid everywhere.

### Mobile viewport stability

Mobile browsers fire `resize` (and change `window.innerHeight`) when the address-bar toolbar shows/hides during scroll. Current guards:

- `SmoothScroll` sets `ScrollTrigger.config({ ignoreMobileResize: true })` — pin/scrub distances don't recompute on toolbar resizes.
- The scene container uses `100lvh` (large viewport units), so the canvas box never resizes.
- `Hero.tsx` maintains a `--vh-100` CSS variable from `window.innerHeight` (updated live on resize — safe precisely *because* ScrollTrigger ignores those resizes), consumed by `#nxr-zoom-sticky` and the hero stage. `DesarrolloWebHero.tsx` maintains a mobile-only `--dwh-vh` equivalent because Safari and Chrome disagree about `100lvh` there.

For new components, prefer `100lvh`/these variables over `100dvh`/`100svh` or raw `innerHeight` reads in animation math.

### `ZoomParallax.tsx` — CSS `transform: scale()` drives; WebGL renders the glass

Still the most engineered piece on the page. Each of the 7 cards is laid out in CSS (`globals.css`, per `nth-child`) at its largest "start-of-scroll" size; on scroll, JS updates only `transform: scale(k)` on the anchor — never `width`/`height`/`left`/`top` — because a pure transform is GPU-composited with no reflow (measured ~7x cheaper than real layout per frame) and shrinking a transform never pixelates. `ZoomParallaxCardsLayer` mirrors this per frame: it reads each anchor's *scaled* rect and applies the size as a **group scale** on a mesh whose geometry was built once (`BASE_H = 400`) — never rebuilt per frame.

Because the whole anchor (text, padding) is scaled down by one transform, every fixed-pixel value inside must be pre-multiplied by that card's `--zp-max` custom property (e.g. `font-size: calc(18px * var(--zp-max, 1));`) so it cancels out at rest. **Any new fixed-pixel value under `.nxr-zp-*` needs the same `calc(X * var(--zp-max, 1))` treatment**, and each card's `data-max-scale` in the TSX must match its `--zp-max` in CSS. The glass itself (background, blur, border, shadow) is the mesh's job now — don't add CSS glass back onto `.nxr-zp-card`.

The center card (index 0) additionally carries a `data-max-scale-mobile` attribute distinct from `data-max-scale`, because mobile needs a lower zoom intensity than desktop to avoid the card overflowing the viewport at the start of the scroll — the component picks whichever attribute applies based on `window.innerWidth`.

### Shared hooks & reduced motion

`hooks/useReducedMotion.ts` reads `prefers-reduced-motion` via `useSyncExternalStore` (SSR snapshot returns `false`, so the animated branch renders first and flips after mount — no hydration mismatch, no `RevealInit` race). The established pattern: each animated section returns a separate static JSX branch when `reducedMotion` is true, and every `useGSAP`/effect early-returns on it. **Anchor-registration effects must list `reducedMotion` in their deps** (see the `useGlassPanels` call sites and `Servicios.tsx`) so meshes re-register against whichever branch is actually mounted — the scene layers are not reduced-motion-aware themselves, and a mesh pointing at an unmounted branch stays hidden forever. Never delay real markup behind a `ready`-style state: `RevealInit`'s observer only scans the DOM once, on its own mount.

Other shared hooks: `useGlassPanels` (register a DOM element as a glass-panel mesh), `useCurvedWords`, `useDampedSticky`, `useScrollBrake`, `useTitleReveal`.

### Contact form → Route Handler → Resend

`components/Contacto.tsx` is a multi-step client-side form that POSTs to `app/api/contacto/route.ts`, which sends the notification email via Resend. Requires `RESEND_API_KEY` and `CONTACT_TO_EMAIL` (see `.env.example`); without them the route responds with an error rather than silently succeeding.
