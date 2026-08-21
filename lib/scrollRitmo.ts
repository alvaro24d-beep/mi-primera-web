/**
 * RITMO DE SCROLL — el único sitio donde se decide cuánto dura cada sección.
 *
 * Antes esto vivía repartido: cada componente con pin llevaba su propio
 * `end: () => (window.innerWidth < 768 ? "+=X%" : "+=Y%")` escrito a mano.
 * Nueve archivos, nueve criterios y —lo importante— DOS BREAKPOINTS DISTINTOS
 * conviviendo: unas secciones se pasaban a móvil en 768px y otras en 900px, así
 * que entre esos dos anchos (una tablet en vertical) la página recibía una
 * mezcla: media web en modo teléfono y media en modo escritorio.
 *
 * Aquí hay un solo umbral y una sola tabla. Ajustar el ritmo de una sección es
 * cambiar un número de esta tabla, y la relación entre móvil y escritorio se ve
 * de un vistazo en vez de haber que ir archivo por archivo.
 */

// UN solo umbral para todo lo que tenga que ver con el scroll. 900 y no 768
// porque lo que separa aquí no es "pantalla pequeña" sino GESTO: una tablet en
// vertical se recorre con el dedo, con la misma inercia y los mismos flicks que
// un teléfono, así que quiere los recorridos cortos. Las secciones más
// complejas (Servicios, Intro) ya usaban este umbral; son las demás las que se
// alinean con ellas.
//
// OJO: esto es el umbral del SCROLL. La calidad de la escena 3D (dpr, número de
// puntos de la nube) usa el suyo propio en SceneCanvas, y es correcto que sea
// otro: ahí lo que decide no es el gesto sino la GPU y la densidad de pantalla.
export const MOVIL_MAX = 900;

export const esMovil = () => typeof window !== "undefined" && window.innerWidth <= MOVIL_MAX;

/**
 * Recorrido de cada sección pineada, en % de la altura del viewport: cuánto
 * scroll hay que hacer para atravesarla entera.
 *
 * Los valores son los que ya tenía cada sección — esta tabla los reúne, no los
 * reinventa. Cada uno se afinó en su momento contra su propia coreografía
 * (cuántas fases tiene, cuánto texto hay que leer, cuántas cards pasan), así
 * que NO comparten una escala ni deberían: lo que sí comparten ahora es dónde
 * se tocan y qué umbral los separa.
 *
 * El hero es el ratio más bajo (160/360) y es deliberado: en móvil las frases
 * de maestría pedían demasiados swipes para pasarlas.
 */
/**
 * ALIGERADO EN MÓVIL (V18.54, "aligera el scroll en móvil en general"): los
 * recorridos táctiles bajan ~22%, suficiente para notarse sin comprimir
 * ninguna coreografía hasta volverla ilegible. El ESCRITORIO no se toca: allí
 * la rueda recorre mucho más por gesto y el ritmo estaba dado por bueno.
 *
 * Los pins de las páginas de servicio son los que más bajan porque son los que
 * más margen tenían — el hero de /agentes-ia pedía casi cinco pantallas para
 * atravesarse.
 *
 * DOS ENTRADAS DESAPARECIERON EN V18.55, y no por recorte: el hero de
 * /agentes-ia y su sección de noche dejaron de estar pineadas. Sus animaciones
 * pasaron de avanzar con el scroll a reproducirse solas al entrar en pantalla,
 * así que ya no reservan recorrido — entre las dos liberaron casi seis
 * pantallas de scroll en móvil.
 *
 * DOS RECORRIDOS QUE NO ESTÁN AQUÍ Y QUE NO SE HAN TOCADO, a propósito:
 *  · El prólogo del reel de Servicios (PROLOGUE, 1.35 en móvil). Validado en
 *    teléfono físico; bajarlo rompió su entrada dos veces y va co-afinado con
 *    el tope de flick de SmoothScroll.
 *  · La altura de #nxr-intro (225vh), que se SUBIÓ hace dos versiones a
 *    petición expresa para que no se pudiera saltar sin querer. Recortarla
 *    ahora desharía justo eso.
 */
export const RECORRIDO = {
  hero: { movil: 130, escritorio: 360 },
  dwhHero: { movil: 250, escritorio: 380 },
  aiaPasos: { movil: 220, escritorio: 280 },
  seoHero: { movil: 235, escritorio: 340 },
} as const;

/**
 * Devuelve el `end` de un ScrollTrigger pineado. Se pasa como función para que
 * ScrollTrigger lo reevalúe en cada refresh: así el recorrido sigue al tamaño
 * de la ventana en vez de quedarse con el valor del primer render.
 */
export const recorridoPin = (seccion: keyof typeof RECORRIDO) => () =>
  `+=${esMovil() ? RECORRIDO[seccion].movil : RECORRIDO[seccion].escritorio}%`;

/**
 * QUÉ SIGUE FUERA DE AQUÍ, Y POR QUÉ (para no "arreglarlo" por error):
 *
 *  · Las secciones SIN pin marcan su recorrido con la ALTURA en vh desde
 *    globals.css (#nxr-intro 240/170, #nxr-zoom-parallax…). Ahí el recorrido es
 *    literalmente el alto del elemento, así que vive en el CSS con su media
 *    query; traerlo aquí obligaría a escribir alturas desde JS.
 *  · El REPARTO dentro de cada sección —cuánto de su recorrido va a leer y
 *    cuánto a transicionar— son constantes locales de cada componente
 *    (PROLOGUE y HOLD_FRASE en Servicios, SLOW_K y SPREAD en Intro…). No son
 *    intercambiables entre secciones: cada una responde a su coreografía.
 *  · El TACTO base del scroll (inercia, lerp, tope de flick) es de Lenis y vive
 *    en SmoothScroll.tsx. Es lo único verdaderamente global y está co-afinado
 *    con el prólogo del reel: bajarlo rompió la entrada en teléfono real dos
 *    veces.
 *  · Quedan usos de `innerWidth < 768` que NO son de scroll: layout de algunas
 *    animaciones (AgentesIa, DesarrolloWebHero), el menú del Header y la
 *    calidad de la escena 3D en SceneCanvas. Ese último debe seguir siendo
 *    independiente: lo que decide ahí no es el gesto sino la GPU.
 */
