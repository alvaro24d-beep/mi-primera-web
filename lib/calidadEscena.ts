/**
 * CALIDAD DE LA ESCENA 3D SEGÚN EL DISPOSITIVO — en un solo sitio.
 *
 * Ojo: este umbral NO es el del scroll (lib/scrollRitmo.ts, 900px). Aquí lo
 * que decide no es el gesto sino la GPU, y por eso son independientes a
 * propósito.
 */
export const MOVIL_GPU_MAX = 768;

export const esMovilGPU = () => typeof window !== "undefined" && window.innerWidth <= MOVIL_GPU_MAX;

/**
 * RESOLUCIÓN DE LA CAPTURA DE TRANSMISIÓN — la palanca de rendimiento más
 * importante de la escena, y la que hay que mover antes que cualquier otra.
 *
 * `MeshTransmissionMaterial` necesita saber qué hay DETRÁS del cristal, y para
 * eso three.js renderiza la escena entera a una textura aparte. Todas las
 * tarjetas comparten esa captura (`transmissionSampler`), así que su coste no
 * crece con el número de tarjetas — pero se paga en cuanto haya UNA sola
 * visible, y se paga por frame. En un teléfono eso cae encima de un shader de
 * vídeo que ya está llenando la pantalla, y de ahí la caída de fps al entrar
 * en cualquier sección con cristal.
 *
 * V18.58 probó lo obvio —apagar la transmisión en móvil— y fue un error: sin
 * ella las tarjetas caen al material opaco de VolumetricCard, que es casi
 * negro. Ese material era un fallback pobre, nunca un acabado. Así que el
 * cristal se queda y lo que baja es la RESOLUCIÓN de la captura:
 *
 *     escritorio 0.35  →  ~12% de los píxeles de pantalla
 *     móvil      0.12  →  ~1,4%  (unas 8 veces más barata que 0.35)
 *
 * Se puede bajar tanto porque la captura de transmisión ya se usa BORROSA a
 * propósito: es lo que da el aspecto escarchado sin pedirle todo el trabajo a
 * la `roughness` (ver VolumetricCard). En una pantalla de teléfono, donde las
 * tarjetas son pequeñas, esa pérdida de detalle no se distingue; lo que sí se
 * distingue es que el fondo siga viéndose a través del cristal en vez de un
 * bloque negro.
 *
 * NO bajar de ~0.10: por debajo, la captura ampliada deja de parecerse a lo
 * que hay detrás y el cristal se lee como un panel gris sucio (eso fue lo que
 * pasó en escritorio con 0.2, y por eso subió a 0.35).
 */
export const escalaCapturaTransmision = () => (esMovilGPU() ? 0.12 : 0.35);

/**
 * Muestras de refracción por tarjeta. Es un coste POR TARJETA y por frame, a
 * diferencia de la captura: bajarlo a 1 en móvil quita trabajo justo donde hay
 * siete tarjetas a la vez (ZoomParallax). Con la captura ya muy borrosa, la
 * diferencia entre 1 y 2 muestras allí no se aprecia.
 */
export const muestrasTransmision = () => (esMovilGPU() ? 1 : 2);
