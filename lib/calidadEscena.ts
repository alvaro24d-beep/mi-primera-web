/**
 * CALIDAD DE LA ESCENA 3D SEGÚN EL DISPOSITIVO — en un solo sitio.
 *
 * Ojo: este umbral NO es el del scroll (lib/scrollRitmo.ts, 900px). Aquí lo
 * que decide no es el gesto sino la GPU, y por eso son independientes a
 * propósito.
 */
export const MOVIL_GPU_MAX = 768;

/**
 * ¿Puede este dispositivo permitirse el cristal con TRANSMISIÓN REAL?
 *
 * Esta es la decisión de rendimiento más cara de toda la escena, y conviene
 * entender por qué antes de tocarla. `MeshTransmissionMaterial` necesita saber
 * qué hay DETRÁS de la superficie, y para eso three.js renderiza la escena
 * entera a una textura aparte. Todas las tarjetas comparten esa captura
 * (`transmissionSampler` + `transmissionResolutionScale` 0.35), así que el
 * coste no crece con el número de tarjetas — pero es un RENDER COMPLETO DE
 * ESCENA ADICIONAL POR FRAME en cuanto haya una sola tarjeta visible con
 * transmisión > 0.
 *
 * En escritorio se paga sin problema. En un teléfono se paga sobre una escena
 * que ya está llenando la pantalla con el shader del muro de vídeo, y el
 * resultado es la caída de fps que se nota al entrar en cualquier sección con
 * cristal — ZoomParallax la peor, con sus siete tarjetas escalando a la vez.
 *
 * Con transmisión 0 las tarjetas caen al material opaco de VolumetricCard: se
 * ven como cristal oscuro en vez de refractar el fondo, y a cambio la captura
 * NO SE HACE. No es una rebaja de calidad progresiva, es quitar un render
 * entero por frame.
 *
 * Se lee en el render de las capas (nunca por frame) y siempre dentro del
 * canvas, que se monta con ssr:false — de ahí que pueda tocar `window`.
 */
export const cristalConTransmision = () =>
  typeof window !== "undefined" && window.innerWidth > MOVIL_GPU_MAX;
