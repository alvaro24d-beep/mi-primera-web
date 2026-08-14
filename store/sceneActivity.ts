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

// Índice (en orden de documento) de la sección que ocupa ahora mismo la banda
// central del viewport, escrito por el observer de SceneCanvas y leído por
// SceneBackground para recolocar el muro en cada sección.
//
// Es un ÍNDICE y no un id a propósito: la pose de cada sección se deriva de su
// número de orden, así que cualquier página —incluidas las que aún no existen—
// tiene poses distintas y repartidas sin que haya que mantener una tabla de
// secciones en ninguna parte.
//
// Mismo singleton mutable que los de arriba, y por la misma razón: se lee en
// cada frame del muro y no puede costar un render de React.
export const poseSeccion = { indice: 0 };

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
