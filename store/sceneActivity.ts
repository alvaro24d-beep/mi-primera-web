// Section ids currently near the viewport (±300px), maintained by the single
// IntersectionObserver in SceneCanvas.tsx and read by the card/panel layers
// at the top of their useFrame as a zero-cost early-out.
//
// WHY: the scene renders far from the card sections too (the TV-wall video
// invalidates on every decoded frame, ~25-30fps, page-wide). Without this
// gate every one of the ~20 mesh slots still did a getBoundingClientRect —
// and the glass panels a 4-ancestor computed-style opacity walk — per
// rendered frame just to conclude "off-screen, hide", forcing style/layout
// recalc against a GSAP/Lenis-dirtied DOM at video rate even while the user
// idles over plain text. A Set.has() check costs nothing.
//
// Deliberately a plain mutable module singleton (same reasoning as the
// .getState() registries): membership flips a handful of times per page of
// scrolling and must never cost a React render.
export const nearSections = new Set<string>();
