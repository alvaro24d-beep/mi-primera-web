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

// Posición REAL del canvas fijo en coords del layout viewport, medida cada
// frame por CanvasBoxTracker (SceneCanvas.tsx) y restada por las tres capas
// al mapear rects DOM → mundo. Normalmente es (0,0) y la resta es un no-op —
// pero con el TECLADO EN PANTALLA abierto, iOS/Safari recoloca los elementos
// position:fixed para seguir al visual viewport mientras el resto del
// contenido no se mueve: el canvas deja de estar clavado en (0,0) y, sin
// esta compensación, TODOS los meshes se pintaban desplazados respecto a su
// DOM (bug: "al escribir en el paso 4 la card de cristal se sube y el
// textarea se sale por abajo"). Mismo patrón singleton mutable que arriba:
// se lee en cada useFrame y no debe costar nunca un render de React.
export const canvasBox = { x: 0, y: 0 };

// AMANECER DEL MURO (V17.62): 0 = noche (la pantalla de siempre), 1 = día (la
// misma pantalla, con sus monitores, su cuadrícula y su vídeo, pero virada a
// gris claro). Lo escribe Proceso.tsx conforme se scrollea y lo lee el
// useFrame de SceneBackground para mover su uniform.
//
// Puente por módulo mutable y no por estado de React, igual que los de arriba:
// el canvas vive en otro árbol (está en el layout, no bajo la página) y esto
// se lee en cada frame, así que no puede costar un render. La alternativa que
// ya usa el proyecto para cruzar esa frontera —un CustomEvent, como
// `nxr:wall-video`— sirve para hitos sueltos, no para un valor continuo.
export const wallDay = { value: 0 };
