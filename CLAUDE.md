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

This is a Next.js 16.2.10 App Router site (single marketing homepage for "Nexora," an AI/software agency), built with React 19 and TypeScript. Per `AGENTS.md`, this Next.js version has breaking changes vs. training data — check `node_modules/next/dist/docs/` before relying on remembered APIs.

The visual design (glassmorphism cards, particle/wave backgrounds, scroll-driven 3D effects) was ported from a WordPress "Code Snippets" PHP site, which is why every custom class is prefixed `nxr-` and `app/globals.css` is organized into numbered sections (`/* ===== Hero ===== */`, etc.) mirroring the original snippet blocks.

### Styling: one global stylesheet, not CSS Modules

All custom CSS lives in `app/globals.css` (~4300 lines), imported once in `app/layout.tsx`. Tailwind is imported (`@import "tailwindcss";`) but is not used for the actual design — components use hand-written classes and CSS custom properties instead. Design tokens (`--c-red`, `--c-lime`, `--c-salmon`, `--glass-bg`, `--glass-border-gradient`, `--radius-md`/`--radius-lg`, `--font`, etc.) are defined once in `:root`. Shared glass-morphism utilities (`.nxr-glass`, `.nxr-glass-edge` + `.nxr-glass-edge-content`) implement the gradient-border-via-mask technique used on nearly every card/button/nav element site-wide — reuse them instead of re-deriving the effect.

When adding a new component, add its styles to `globals.css` in a clearly-commented section rather than introducing a CSS Module, to keep the single-stylesheet convention consistent.

### Page assembly and section order matters

`app/page.tsx` composes the homepage from `components/*.tsx` in a specific order: `Header, Hero, Intro, Servicios, ZoomParallax, Proceso, Tech, Contacto`. This order is duplicated in `components/ThreeBackground.tsx`'s `SEC_IDS` array, which the particle background uses to detect which section is active during scroll and change its animation/color accordingly. **If you reorder or add/remove a top-level section, update `SEC_IDS` too.**

Only the homepage exists. Header/nav links to `/servicios`, `/nosotros`, `/casos`, `/contacto`, and five service detail pages are not implemented and will 404.

### Global fixed-position layers (mounted once, in `app/layout.tsx`)

- `WaveBackground` — canvas-based animated gradient background (`z-index: -1000`).
- `ThreeBackground` — Three.js instanced-particle system reacting to scroll position/active section (`z-index: 0`).
- `RevealInit` — a single page-wide `IntersectionObserver` that adds `.nxr-visible` to any `.nxr-reveal` element for fade-in-on-scroll; sections just add the `nxr-reveal` class rather than wiring up their own observer.
- `SmoothScroll` — initializes Lenis for inertia scrolling, driven by its own `requestAnimationFrame` loop.

All four are `"use client"` and touch the DOM/animation frames directly — there's no shared "scroll context"; `Header`, `Proceso`, `ZoomParallax`, `Intro`, and `ThreeBackground` each register their own native `scroll`/`resize` listeners independently. This works because Lenis drives the *real* browser scroll position (not a virtual one), so plain `window.scrollY` / native `scroll` events stay valid everywhere.

### Mobile viewport stability

Mobile browsers fire `resize` (and change `window.innerHeight`) when their address-bar toolbar shows/hides during scroll. `ThreeBackground` and `WaveBackground` guard against reacting to that: they cache a "stable" width/height and only recompute when the width changes or the height jump exceeds a threshold (~150px), and their fixed containers use `100lvh` (large viewport height) rather than `100dvh`/`100svh` so the box itself doesn't resize either. Follow this pattern for any new component that measures the viewport for animation math.

### `ZoomParallax.tsx` — scale via `transform`, never via layout

This is the most engineered component on the page. Each of the 7 cards is laid out in CSS (`globals.css`, per `nth-child`) at its own largest "start-of-scroll" size, with a precomputed `transform-origin` so it scales from the viewport center. On scroll, JS updates only a single `transform: scale(k)` per card — never `width`/`height`/`left`/`top` — because (a) a pure transform is GPU-composited with no reflow (measured ~7x cheaper than resizing 7 cards with real layout per frame), and (b) shrinking a transform never pixelates, whereas enlarging one does.

Because the whole card (including its text, padding, borders, blur, and shadow) is scaled down by one `transform`, every fixed-pixel value inside must be pre-multiplied by that card's `--zp-max` custom property (e.g. `font-size: calc(18px * var(--zp-max, 1));`) so it cancels out to the intended value once the transform shrinks it. This applies to font-size, padding, gap, border-radius, `backdrop-filter` blur radius, and `box-shadow` — **any new fixed-pixel effect added under `.nxr-zp-*` needs the same `calc(X * var(--zp-max, 1))` treatment**, or it will render far too small/blurry at rest and far too large at the start of the scroll.

The center card (index 0) additionally carries a `data-max-scale-mobile` attribute distinct from `data-max-scale`, because mobile needs a lower zoom intensity than desktop to avoid the card overflowing the viewport at the start of the scroll — the component picks whichever attribute applies based on `window.innerWidth` before computing the transform.

### Contact form → Route Handler → Resend

`components/Contacto.tsx` is a multi-step client-side form that POSTs to `app/api/contacto/route.ts`, which sends the notification email via Resend. Requires `RESEND_API_KEY` and `CONTACT_TO_EMAIL` (see `.env.example`); without them the route responds with an error rather than silently succeeding.
