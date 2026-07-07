<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Directiva de Arquitectura y Estética Web Inmersiva

Aplica a `/desarrollo-web` (ya migrada a este stack) y a toda página nueva (Agentes IA, Automatizaciones, SEO, Apps & Software, y cualquier página futura). **No aplica retroactivamente** a `/` (home), cuyo `ThreeBackground`/`WaveBackground` globales se quedan como Three.js imperativo puro ya verificado — no los reescribas para "encajar" esta directiva.

Actúa como un Lead Developer experto en Next.js, WebGL y experiencias digitales de alto nivel. Cada solicitud de UI para una página nueva debe seguir estas reglas:

## 0. REGLA DE ORO — la animación DEBE representar el servicio (no adorno abstracto)
Esto es lo más importante y donde ya se falló una vez (un prisma de cristal giratorio que no decía nada de "desarrollo web"). El estándar de fidelidad son las **animaciones de la sección Servicios de la home** (`components/Servicios.tsx`): cada tarjeta muestra gráficamente lo que vende — un navegador con contenido para "Desarrollo web", una conversación de chat para "Agentes IA", un diagrama de flujo n8n para "Automatizaciones", una gráfica de Search Console para "SEO", un móvil con stats para "Apps". Toda animación 3D nueva debe hacer lo mismo: **mostrar visualmente aquello de lo que trata la página**. Antes de proponer un concepto, pregúntate "¿un visitante entendería qué servicio es solo mirando la animación, sin leer?". Si la respuesta es no (formas abstractas, cristales, esferas genéricas), NO es válido. Referencia ya construida: `/desarrollo-web` = un navegador que se construye solo por fases (`components/dwh/BrowserBuild.tsx`).

## 1. Paradigma de Desarrollo (Default: 3D/Inmersivo)
- **Evitar por defecto:** el diseño de landing page plana en scroll vertical estándar sin elementos 3D.
- **Obligatorio:** cada página nueva debe ser una **Escena Inmersiva**: los objetos/fondos 3D viven dentro de un `<Canvas>` de `@react-three/fiber`, y el scroll está integrado con la cámara/objetos (no es solo un fondo decorativo estático).
- **UI = híbrido Canvas + DOM** (decidido explícitamente así, ver razones abajo): el `<Canvas>` aloja la escena 3D; el texto, botones, navegación y formularios se superponen como DOM normal (posicionamiento absoluto/sticky), reutilizando el sistema de diseño existente (`.nxr-glass-edge`, tokens de marca de `globals.css`) para mantener coherencia visual con el resto del sitio. `<Html>` de `drei` se reserva para etiquetas anc­ladas a un objeto 3D concreto (que deben moverse/escalarse con él, como el panel de capas en `DesarrolloWebHero.tsx`) — **no** para formularios completos, menús de navegación ni CTAs: esos van como DOM normal, tanto por accesibilidad/SEO/teclado móvil como porque componentes ya construidos y verificados (`Contacto.tsx` con su integración a Resend, `Header.tsx`) se siguen reutilizando tal cual entre páginas.
- Tailwind sigue sin usarse para el overlay (igual que hasta ahora) — usa las utilidades `.nxr-*` y variables CSS ya existentes en `globals.css` en su lugar, para que las páginas nuevas no desentonen visualmente con las ya construidas.

## 2. Stack Tecnológico Estándar (ya instalado)
- **Framework:** Next.js (App Router).
- **Core 3D:** `@react-three/fiber` y `@react-three/drei`.
- **Post-procesado:** `@react-three/postprocessing`.
- **Animación:** `gsap` (`useGSAP` + `ScrollTrigger`) para animaciones que no encajen bien en el bucle manual de R3F. Como el sitio ya usa **Lenis** para el smooth-scroll global (`components/SmoothScroll.tsx`), cualquier `ScrollTrigger` nuevo debe sincronizarse con la instancia de Lenis existente (vía su evento `scroll` + `ScrollTrigger.update()`), no instanciar un segundo smooth-scroll ni pelear con el que ya hay.
- **GSAP ScrollTrigger + `pin` SIEMPRE en el árbol DOM normal, nunca dentro de `<Canvas>`.** `<Canvas>` de R3F monta sus hijos (`useFrame`, materiales, etc.) a través de su propio react-reconciler, no el árbol de ReactDOM principal. Crear un `ScrollTrigger`/timeline ahí dentro (probado en `DesarrolloWebHero`) no lanza ningún error pero **no pinea nada** (no inserta el pin-spacer, el scroll no tiene efecto). Patrón correcto: el componente DOM normal (p. ej. `DesarrolloWebHero.tsx`) crea el `ScrollTrigger`/timeline con `useGSAP` y anima un `ref` a un objeto plano (`{ rotY, camZ, ... }`, no un objeto three.js); ese `ref` se pasa como prop al `<Canvas>`, y ahí dentro un `useFrame` lo lee cada frame para mutar la cámara/mesh. Así el "driver" (GSAP+ScrollTrigger) vive donde funciona, y el "consumidor" (mutación de three.js) vive donde tiene que vivir (dentro de R3F). Ver `components/DesarrolloWebHero.tsx` + `components/dwh/HeroScene.tsx` como referencia.
- **ESLint `react-hooks/purity` / `react-hooks/immutability`** (reglas nuevas pensadas para React Compiler) marcan como error mutar `camera`/refs de three.js dentro de `useFrame` y usar `Math.random()` en un `useMemo(..., [])` — ambos son patrones normales y necesarios en R3F, no bugs. Ya están desactivadas vía `eslint.config.mjs` para `components/dwh/**/*.tsx`; si el código 3D de una página nueva vive en otra carpeta, añade esa carpeta al mismo override en vez de silenciar la regla línea a línea o globalmente.
- **Estado:** `zustand` para sincronizar estado entre el DOM (overlay) y la escena 3D cuando haga falta (p. ej. qué elemento 3D está "activo" según el scroll), en vez de prop-drilling o duplicar lógica de scroll en cada componente.

## 3. Estándares de Diseño y Estética
- **Iluminación:** usar `<Environment>` de `drei` para reflejos/realismo en vez de materiales planos sin luz, cuando la escena tenga superficies que se beneficien de ello — **pero nunca con la prop `preset`** (`preset="studio"`, `"city"`, etc.): eso descarga un HDRI del CDN de drei en tiempo de ejecución, una dependencia de red innecesaria para una carga de página de producción y, confirmado al construir `DesarrolloWebHero`, lo bastante lenta/poco fiable como para colgar una carga de página (timeout de `networkidle` en Playwright). Usa en su lugar `<Environment resolution={...}><Lightformer .../>...</Environment>` (procedural, sin red) — de paso, los `Lightformer` pueden tintarse con los colores de marca (`--c-lime`, `--c-salmon`, `--c-red`) para que los reflejos encajen con la identidad visual en vez de dar un look gris genérico. Ver `components/dwh/HeroScene.tsx`.
- **Post-procesado:** `EffectComposer` con `Bloom` y/o `Vignette` para acabado cinematográfico, con cuidado de no penalizar el rendimiento en móvil (perfilar con las mismas técnicas de rAF-profiling ya usadas en este proyecto antes de dar por buena una escena).
- **Performance:** `InstancedMesh` (o el equivalente en R3F, `<Instances>` de drei) para elementos repetidos; `Suspense` + `useGLTF` de drei para cargar modelos `.glb`.
- **Interactividad:** la cámara reacciona al scroll y/o al mouse (parallax, dolly zoom) — no debe quedar estática.
- **Accesibilidad y `prefers-reduced-motion`:** toda página nueva necesita una alternativa no animada/no pinned cuando el usuario prefiera menos movimiento, igual que `DesarrolloWebHero.tsx`/`ProcesoReel.tsx` (ver `hooks/useReducedMotion.ts`) — no lo omitas por ir más rápido.

## 4. Instrucción de Código
- **Código completo y funcional**, no fragmentos a medio terminar.
- **Modularidad:** separa la lógica de la escena 3D (cámara, luces, objetos, `EffectComposer`) de la lógica de UI/overlay (texto, botones, formularios) en componentes distintos.
- **Originalidad:** cada página de servicio debe tener su propio concepto 3D (no repitas literalmente la estructura de "pila de capas" de `DesarrolloWebHero` en las siguientes páginas) — propone un objeto/escena distinto acorde al servicio.
- **Antes de escribir código:** confirma que la estructura propuesta respeta este entorno inmersivo y el reparto Canvas/DOM de arriba; si una petición pide algo más 2D/plano para una página nueva, señala el conflicto con esta directiva y propone cómo llevarlo a 3D antes de implementar.
