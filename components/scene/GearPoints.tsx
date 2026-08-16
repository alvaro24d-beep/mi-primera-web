"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_DISTANCE } from "./PixelCamera";
import { poseSeccion } from "@/store/sceneActivity";

// ===== Nube de puntos con la forma del modelo (V17.85) =====
// Una rueda de radios dibujada solo con puntos, flotando ENTRE el muro de
// vídeo y el contenido: vive dentro del mismo <Canvas> global, después del
// muro (que se dibuja con renderOrder -10) y con el DOM entero por encima,
// porque el canvas está a z-index -1000. Cero contextos WebGL nuevos.
//
// EL MODELO NO SE CARGA. El .glb original pesa 7,6MB y trae 244.000 triángulos
// con tres texturas PBR — nada de eso hace falta para pintar puntos. La
// superficie se muestreó UNA vez fuera de línea (uniforme por área, con semilla
// fija) y lo único que llega al navegador es public/gear-points.bin: 22.000
// posiciones cuantizadas a Int16, 129KB. Para regenerarlo hay que volver a
// muestrear el .glb; no es un asset que se pueda "recompilar" desde el repo,
// así que no lo borres.
//
// Int16 NORMALIZADO y no Float32: el atributo viaja y vive en la GPU a la
// mitad de tamaño (129KB en vez de 258KB) y GL lo expande a [-1,1] al leerlo,
// sin una sola instrucción de más en el shader. El error de cuantización es
// 1/32767 del radio: centésimas de píxel a cualquier tamaño al que se dibuje.

const PUNTOS_URL = "/gear-points.bin";
// El archivo trae 22.000 posiciones, pero NO se dibujan todas: el muestreo fue
// aleatorio, así que cualquier prefijo del array es a su vez una muestra
// uniforme de la superficie y basta con recortar el drawRange.
//
// 10.000 y no 22.000, y esto es lo que zanjó lo de "se ve a baja resolución".
// Lo que hace legible una nube no es el número de puntos ni el tamaño de cada
// uno por separado, es la relación entre los dos. Con 22.000 puntos había que
// hacerlos diminutos para que no se empastaran unos con otros (se acabó en 2,7
// píxeles de framebuffer, de los que el disco interior eran 2), y un punto de
// dos píxeles NO PUEDE dibujar un círculo: es un par de píxeles grises. La
// figura entera se leía entonces como ruido, que es justo la textura de una
// imagen de baja resolución. Con la mitad de puntos, cada uno puede medir el
// doble sin volver a tocarse: misma cobertura total (~125.000 px², o sea la
// misma silueta), pero ahora se distingue punto por punto.
const PUNTOS_DIBUJADOS = 13000;
// El móvil NO lleva "la mitad" sino la parte proporcional a la superficie que
// la figura ocupa allí, que es cuatro veces y media menos (tope de escala 360
// frente a 700, y el área va con el cuadrado del radio). Lo que hay que igualar
// entre las dos pantallas no es el número de puntos, son los px² que le tocan a
// cada uno: con ~38 px² por punto en ambas, el grano se ve igual de fino en el
// teléfono que en el monitor.
const PUNTOS_DIBUJADOS_MOVIL = 2800;

// Profundidad a la que flota, en px de mundo (PixelCamera: 1 unidad = 1px a
// z=0). Lejos del muro (-1900) y por delante de él, pero con bastante
// perspectiva para que la rotación se lea.
const Z = -420;

// Posiciones del cursor que siguen "empujando" a la vez. La 0 es la actual y
// las demás son el rastro que va apagándose (ver la estela en el componente).
const ESTELA = 10;

const vertexShader = /* glsl */ `
  #define ESTELA ${ESTELA}
  uniform float uSize;
  uniform float uDpr;
  // xy = posición en NDC, z = FUERZA con signo de esa marca del rastro, ya
  // pasada por la envolvente del muelle. Se calcula en JS y no aquí (V18.03):
  // depende solo de la EDAD de la marca, que es idéntica para los 13.000
  // vértices, así que evaluarla en el shader era resolver diez exponenciales y
  // diez cosenos por vértice para obtener diez números que son los mismos para
  // todos. Se calculan una vez por frame en la CPU y llegan ya hechos.
  uniform vec3 uEstela[ESTELA];
  uniform float uMouseOn;   // 0 en táctil: ni se calcula la repulsión
  uniform float uAspect;
  uniform float uRadio;     // radio de influencia del cursor, en NDC
  uniform float uEmpuje;    // desplazamiento máximo, en px de mundo
  uniform float uTime;
  uniform float uVida;      // amplitud de la deriva propia, en radios del objeto
  uniform float uForm;      // 0 = polvo disperso, 1 = figura montada
  varying float vBrillo;

  void main() {
    // Tres semillas por punto, derivadas de su propia posición: un atributo más
    // habría sido otro buffer que subir y mantener, y aquí basta con que cada
    // punto tenga SUS números estables.
    float semilla = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    float semB = fract(sin(dot(position.xyz, vec3(39.3468, 11.135, 83.155))) * 24634.6345);
    float semC = fract(sin(dot(position.xyz, vec3(73.1560, 52.235, 9.1510))) * 13721.1234);

    // ===== ENTRADA: el polvo se agrupa hasta formar la pieza =====
    // Cada punto sale de un sitio disperso propio y viaja hasta el suyo. El
    // stagger va por semilla, no por índice: los índices están ordenados como
    // salieron del muestreo del .glb y agruparían la figura por zonas, como si
    // se dibujara sola; repartido al azar, la pieza se CONDENSA entera a la vez,
    // que es lo que parece polvo juntándose. El easing es cúbico de salida:
    // llegan rápido y frenan al posarse, en vez de a velocidad constante.
    // El easing se escribe MULTIPLICANDO y no con pow(), y no es por
    // rendimiento: pow(x, y) en GLSL se evalúa como exp2(y * log2(x)), y
    // log2(0.0) es -infinito, así que pow(0.0, 3.0) está INDEFINIDO por
    // especificación. Al terminar el viaje 1.0 - t vale exactamente 0 y el
    // easing devolvía NaN, que se propagaba a la posición del vértice: la
    // figura no llegaba a formarse nunca y los puntos quedaban esparcidos por
    // la pantalla como basura. Con la multiplicación es exacto en todo el
    // rango, incluidos los extremos.
    float t = clamp((uForm - semilla * 0.4) / 0.6, 0.0, 1.0);
    float u = 1.0 - t;
    float e = 1.0 - u * u * u;
    // El punto de partida es la PROPIA figura estallada hacia fuera (position
    // multiplicada) más una desviación por punto, en vez de una dirección
    // aleatoria normalizada. Dos motivos, y el segundo es el que importa:
    // se lee mejor —la nube colapsa sobre sí misma en vez de venir de un
    // amasijo sin forma— y, sobre todo, aquí NO hay ningún normalize() que
    // pueda toparse con un vector nulo y devolver NaN.
    vec3 disperso = position * (2.3 + semB * 1.9) + (vec3(semilla, semB, semC) - 0.5) * 1.3;
    vec3 base = mix(disperso, position, e);

    // VIDA PROPIA. Cada punto deriva alrededor de su sitio con su frecuencia y
    // su fase, en los tres ejes y con periodos distintos por eje, así que la
    // nube nunca está quieta ni respira "a una". La amplitud se mide en radios
    // del objeto (uVida ~0.014 = 1,4% del radio ≈ 6px en pantalla): suficiente
    // para que se note el hormigueo, poco para que la silueta siga siendo la
    // de la pieza y no una mancha. Escalada por el avance de la entrada para
    // que durante el viaje no tiemble además de moverse.
    float f = 0.7 + semilla * 0.9;
    vec3 pos = base + vec3(
      sin(uTime * f + semilla * 6.2831),
      cos(uTime * f * 0.83 + semilla * 4.7),
      sin(uTime * f * 1.17 + semilla * 2.3)
    ) * uVida * e;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // ===== Repulsión EN ESPACIO DE PANTALLA =====
    // Se proyecta el punto, se mide su distancia al cursor en NDC y se empuja en
    // el plano de la cámara. Hacerlo aquí y no en el espacio del objeto es lo
    // que mantiene el efecto correcto mientras la figura gira con el scroll: el
    // punto huye siempre en la dirección en que el usuario lo ve.
    //
    // Tres cosas la hacen orgánica en vez de "un círculo recortado":
    //
    //  1. CAÍDA SIN BORDE. Antes era un smoothstep con uRadio de frontera, y
    //     un smoothstep tiene un final EXACTO: a esa distancia la fuerza pasa a
    //     ser cero de golpe y ahí se dibujaba el contorno del círculo. Ahora es
    //     1/(1+q³), la forma de un campo de fuerza real: no llega a cero nunca,
    //     solo se vuelve despreciable, así que el hueco no tiene canto.
    //  2. MUELLE, no rampa. La fuerza de cada marca del rastro decae como
    //     exp(-edad)·cos(edad): un oscilador amortiguado. El coseno cruza el
    //     cero y se hace ligeramente negativo, o sea que el punto se pasa un
    //     poco de vuelta y se asienta — que es como se mueve algo con masa, y
    //     no como algo que regresa a su sitio y se para en seco.
    //  3. CADA PUNTO RESPONDE A SU MANERA. Su rigidez cambia cuánto le afecta y
    //     su giro le mete una componente tangencial con signo propio, así que el
    //     material se arremolina un poco al abrirse en vez de apartarse en
    //     bloque radialmente.
    //
    // El bucle no tiene ramas: una entrada sin usar lleva una edad enorme y su
    // exponencial vale 0, así que el coste es fijo y sin divergencia.
    if (uMouseOn > 0.5) {
      vec4 clip = projectionMatrix * mv;
      vec2 ndc = clip.xy / clip.w;
      vec2 desp = vec2(0.0);
      float giro = (semC - 0.5) * 0.7;
      // Fuera del bucle: solo depende de la semilla del punto, así que dentro
      // se recalculaba diez veces el mismo número.
      float kGiro = inversesqrt(1.0 + giro * giro);
      for (int i = 0; i < ESTELA; i++) {
        vec2 dif = ndc - uEstela[i].xy;
        dif.x *= uAspect;            // sin esto el área de influencia sale ovalada
        float d = length(dif);
        float q = d / uRadio;
        float caida = 1.0 / (1.0 + q * q * q * 2.0);
        // Mezcla de radial y tangencial SIN normalize(): dir y su perpendicular
        // son ortonormales, así que el módulo de la suma es exactamente
        // sqrt(1+giro²) y basta con dividir por él. Un normalize() aquí sería
        // 0/0 —y por tanto NaN propagado a la posición del vértice— en cuanto
        // un punto cayera justo encima de una marca del rastro, que con el
        // cursor quieto es exactamente lo que acaba pasando.
        vec2 dir = dif / max(d, 1e-4);
        dir = (dir + vec2(-dir.y, dir.x) * giro) * kGiro;
        desp += dir * caida * uEstela[i].z;
      }
      desp *= 0.75 + semB * 0.55;    // rigidez propia de cada punto
      // Tope de magnitud: donde el rastro se solapa consigo mismo (un giro
      // cerrado del ratón) las contribuciones se suman y sin esto el punto
      // saldría disparado fuera de la pantalla.
      float m = length(desp);
      if (m > 1.0) desp /= m;
      mv.xy += desp * uEmpuje;
    }

    gl_Position = projectionMatrix * mv;

    // Centelleo: dos senos de periodos primos entre sí para que el parpadeo no
    // se lea cíclico. Rango ESTRECHO, 0.80..1.20 (fue 0.35..1.35 mientras el
    // blending era aditivo y el objetivo era cruzar el umbral del bloom). Con
    // mezcla normal ese rango ancho hacía dos cosas malas a la vez: en el valle
    // el punto casi desaparecía —ya no suma luz, se funde con el fondo— y en el
    // pico se iba por encima del umbral del bloom, que es de donde salía el
    // halo difuso. Estrecho, el punto siempre está encendido y siempre nítido:
    // el brillo lo da el CONTRASTE con un muro oscuro, no el parpadeo.
    float c1 = sin(uTime * (0.9 + semilla * 1.4) + semilla * 6.2831);
    float c2 = sin(uTime * (0.37 + semilla * 0.5) + semilla * 2.1);
    vBrillo = 1.0 + 0.14 * c1 + 0.06 * c2;

    // Tamaño constante en píxeles PESE a la perspectiva: PixelCamera hace que
    // 1 unidad = 1px a z=0, así que a distancia d el factor es CAMERA/d.
    gl_PointSize = uSize * uDpr * (${CAMERA_DISTANCE.toFixed(1)} / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform float uAA;        // ancho del suavizado, en píxeles del framebuffer
  varying float vBrillo;

  void main() {
    // DISCO SÓLIDO con el borde suavizado a UN PÍXEL, y un halo aparte.
    //
    // Antes esto era una gaussiana pura, y una gaussiana es difusa por
    // definición: toda su energía se concentra en el centro y el resto es
    // degradado. En un punto de 2-3px eso da un píxel tenue rodeado de nada,
    // que es justo lo que se ve como borroso — el problema nunca fue la
    // resolución del canvas, era el perfil.
    //
    // La clave es fwidth(d): devuelve cuánto cambia d entre un píxel y el de
    // al lado, o sea, cuánto vale UN PÍXEL en las unidades del propio punto.
    // Suavizar exactamente ese ancho da un círculo lleno con un borde limpio
    // a cualquier tamaño y a cualquier dpr: ni dentado (que era el problema
    // del disco duro original) ni difuminado. Es la misma técnica con la que
    // el shader del muro mantiene sus líneas a 1px.
    // DISCO Y NADA MÁS. Sin halo: cualquier degradado alrededor del núcleo es,
    // literalmente, la borrosidad. El resplandor no se pinta aquí.
    //
    // El ancho del suavizado NO es un fwidth entero fijo, porque cuánto vale un
    // píxel del framebuffer en la pantalla depende del aparato: si el buffer se
    // dibuja a la resolución física (dpr del canvas == devicePixelRatio, el
    // caso de un monitor normal) un fwidth entero es exactamente un píxel y
    // queda perfecto; pero en un iPhone el canvas va a dpr 1 sobre una pantalla
    // 3x, el navegador ESTIRA el resultado y ese mismo borde llega convertido
    // en 3 píxeles de degradado. uAA lleva ese cociente calculado en JS, así
    // que el borde sale de un píxel REAL en las dos situaciones — ni difuso en
    // el móvil ni dentado en el escritorio.
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;        // 0 en el centro, 1 en el borde del sprite
    float aa = fwidth(d) * uAA;
    float a = (1.0 - smoothstep(0.75 - aa, 0.75 + aa, d)) * uOpacity * vBrillo;
    if (a < 0.004) discard;           // lo invisible no se compone
    gl_FragColor = vec4(vec3(1.0), a);
  }
`;

export default function GearPoints({
  isMobile,
  reducedMotion,
}: {
  isMobile: boolean;
  reducedMotion: boolean;
}) {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  const puntosRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { gl, size, invalidate } = useThree();

  // Ratón y scroll: objetivo -> valor amortiguado, el patrón del resto de la
  // escena. Los dos viven en refs porque se leen y escriben cada frame.
  const ratonObj = useRef(new THREE.Vector2(0, 0));
  const raton = useRef(new THREE.Vector2(0, 0));
  const scrollObj = useRef(0);
  const scrollAct = useRef(0);
  // Estela: la entrada 0 es SIEMPRE la posición actual del cursor (edad 0, para
  // que dejar el puntero quieto encima mantenga el hueco abierto) y las 1..n-1
  // son un buffer circular con las posiciones por las que ha pasado. La z de
  // cada una es su EDAD en segundos; 99 = casilla sin usar (su exponencial en
  // el shader vale 0, así que no empuja sin necesidad de una rama).
  const estela = useRef<THREE.Vector3[]>(
    Array.from({ length: ESTELA }, () => new THREE.Vector3(0, 0, 99))
  );
  const siguiente = useRef(1);
  const desdeMarca = useRef(0);
  // Última posición en la que se soltó una marca: sirve para saber si el cursor
  // se ha movido de verdad desde entonces (ver la siembra en el useFrame).
  const ultimaMarca = useRef(new THREE.Vector2(0, 0));
  const ultimoT = useRef(0);
  // Entrada: 0 = polvo disperso, 1 = figura montada. Ver uForm en el shader.
  // t0 es el instante en que arranca el viaje (0 = aún no ha empezado), y se
  // fija en el primer frame en que la nube existe de verdad.
  const form = useRef(0);
  const t0 = useRef(0);
  // Pose de la nube por sección: objetivo y valor amortiguado. z es un -1..1
  // que la acerca o la aleja de la cámara.
  const poseObj = useRef({ x: 0, y: 0, z: 0 });
  const pose = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    let cancelado = false;
    fetch(PUNTOS_URL)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((ab) => {
        if (cancelado) return;
        const g = new THREE.BufferGeometry();
        // normalized: true -> GL entrega [-1,1] sin conversión en CPU ni shader.
        g.setAttribute("position", new THREE.BufferAttribute(new Int16Array(ab), 3, true));
        g.setDrawRange(0, isMobile ? PUNTOS_DIBUJADOS_MOVIL : PUNTOS_DIBUJADOS);
        // La esfera de cull la sabemos de antemano (el .bin está normalizado al
        // radio 1), así que nos ahorramos que three recorra los 22.000 puntos
        // para calcularla.
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
        setGeo(g);
        invalidate();
      })
      .catch(() => {
        // Sin nube: la web funciona igual. No es contenido, es decoración.
      });
    return () => {
      cancelado = true;
    };
  }, [isMobile, invalidate]);

  useEffect(() => () => geo?.dispose(), [geo]);

  // Calibrado para que sea FONDO y no un objeto encima del contenido, pero
  // NÍTIDO. El equilibrio no se busca bajando la opacidad hasta que la nube
  // desaparezca (eso deja puntos grises que se leen como suciedad), sino
  // concentrando la luz de cada punto en su disco: núcleo brillante, halo
  // corto. Así la silueta se reconoce sobre el muro oscuro y el texto pasa por
  // encima sin pelearse con ella.
  const uniforms = useMemo(
    () => ({
      // EL MÍNIMO FÍSICO — no es un valor de gusto, es el punto más pequeño que
      // esta escena puede dibujar sin que deje de ser un punto.
      //
      // uSize está en PÍXELES CSS a z=0 y el tamaño real es uSize·0.70 (la
      // perspectiva, con la nube en z=-420). Pero lo que decide si un punto se
      // ve o se deshace no son los píxeles CSS sino los del FRAMEBUFFER, que es
      // donde se rasteriza: en escritorio, a dpr 1.25, este 1.8 sale a 1,58px
      // de sprite y 1,19 de disco. POCO MÁS DE UN PÍXEL. Por debajo, el disco
      // deja de cubrir un píxel entero, se reparte con alfa parcial entre
      // varios, y cada punto pasa a ser una mota gris translúcida en vez de un
      // punto blanco: la nube vuelve a leerse como ruido, que es exactamente el
      // aspecto de "baja resolución" que costó varias versiones quitar.
      //
      // Para bajar de aquí hay que subir el dpr del canvas en escritorio (hoy
      // 1.25, en SceneCanvas): más píxeles reales por píxel CSS es lo único que
      // permite dibujar un punto más fino, y se paga en relleno por frame. Este
      // número ya no da más de sí.
      //
      // El límite lo pone el MONITOR y no el teléfono, que es lo contrario de
      // lo que parece: desde V17.93 el móvil va a dpr 2 frente a 1.25, así que
      // el mismo tamaño en píxeles CSS dispone allí de más píxeles reales
      // (sprite 2,56px, disco 1,9 — holgado).
      //
      // Lo que hace que a este tamaño sigan viéndose definidos y no como una
      // neblina es que ya no hay nada que los emborrone alrededor: ni halo, ni
      // suma aditiva con los puntos de detrás, ni bloom (ver uOpacity). Un punto
      // pequeño perdona mucho menos que uno grande, así que esas tres cosas —
      // que antes se compensaban entre sí— aquí no pueden volver.
      //
      // El MISMO valor en móvil que en escritorio: al estar en píxeles CSS, el
      // punto mide igual en las dos pantallas y el móvil gasta su densidad de
      // más en CALIDAD, no en hacerlo aún más pequeño (a 0,8px CSS la nube
      // habría desaparecido en un teléfono).
      uSize: { value: 1.8 },
      uDpr: { value: 1 },
      // Cociente (dpr del framebuffer / dpr de la pantalla). 1 cuando el canvas
      // se dibuja a resolución física; ~0.33 en un iPhone, donde el buffer va a
      // dpr 1 y la pantalla es 3x. Ver el fragment.
      uAA: { value: 1 },
      // El array se pasa por referencia: se mutan los Vector3 en su sitio cada
      // frame y three sube el bloque entero, sin reasignar ni reservar nada.
      uEstela: { value: Array.from({ length: ESTELA }, () => new THREE.Vector3(0, 0, 0)) },
      uMouseOn: { value: 0 },
      uAspect: { value: 1 },
      uRadio: { value: 0.3 },
      uEmpuje: { value: 52 },
      uTime: { value: 0 },
      uVida: { value: 0.014 },
      // Con reduced motion la figura arranca YA montada: la animación de
      // agrupación es puro movimiento decorativo y es justo lo que esa
      // preferencia pide no ver.
      uForm: { value: reducedMotion ? 1 : 0 },
      // Con mezcla NORMAL esto vuelve a ser opacidad de verdad, y el techo lo
      // pone el bloom: el píxel final ronda uOpacity·vBrillo sobre un muro casi
      // negro, y el Bloom del composer empieza a florecer a partir de 0.6 de
      // luminancia. Por encima de ahí el punto se lleva su propio halo difuso
      // de MEDIA resolución sumado encima — que era, medido con un A/B, buena
      // parte de lo que se veía borroso. 0.46·1.20 = 0.55: el punto se queda
      // justo por debajo del umbral y el bloom lo ignora. No se ve más apagado
      // porque lo que hace blanco a un punto no es su valor absoluto sino el
      // contraste contra el fondo, y el fondo aquí es un muro oscuro.
      // Cuanto más pequeño es el punto, más manda el CONTRASTE: a 1,6px de
      // disco no hay superficie con la que convencer al ojo, solo intensidad,
      // así que un punto flojo se percibe como suciedad y uno rotundo como un
      // punto. De ahí que al encogerlos suba la opacidad en vez de bajarla.
      //
      // El techo en escritorio no es estético sino del composer: el píxel final
      // ronda uOpacity·vBrillo sobre un muro casi negro, y el Bloom empieza a
      // florecer a partir de 0.6 de luminancia. Cruzarlo devuelve al punto un
      // halo difuso de MEDIA resolución sumado encima — para un punto de 1,6px
      // eso no es un adorno, es borrarlo. 0.50·1.20 = 0.60, clavado en el
      // umbral: es todo el contraste disponible sin que el bloom entre, y a
      // 1,2px de disco hace falta hasta la última décima.
      // En móvil no hay EffectComposer (es desktop-only, ver SceneCanvas), así
      // que no hay umbral que respetar y el punto puede ser blanco de verdad.
      uOpacity: { value: isMobile ? 0.9 : 0.5 },
    }),
    [isMobile, reducedMotion]
  );

  // El cursor mueve la nube, así que hay que pedir frames: en modo demand nadie
  // más los pediría entre un scroll y el siguiente. El muro ya invalida por su
  // cuenta al moverse el ratón, pero esto no puede depender de que el muro esté
  // activo (en las rutas sin vídeo no lo está).
  useEffect(() => {
    if (reducedMotion || isMobile) return;
    const onMove = (e: MouseEvent) => {
      ratonObj.current.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      invalidate();
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reducedMotion, isMobile, invalidate]);

  useFrame(({ clock }) => {
    const m = matRef.current;
    const p = puntosRef.current;
    if (!m || !p) return;

    const t = clock.elapsedTime;
    const dt = Math.min(0.1, t - ultimoT.current || 0.016); // cap: pestaña que vuelve
    ultimoT.current = t;
    m.uniforms.uTime.value = t;
    const dprBuffer = gl.getPixelRatio();
    m.uniforms.uDpr.value = dprBuffer;
    // Cuánto se estira el framebuffer hasta los píxeles físicos de la pantalla.
    // Se lee cada frame y no una vez: arrastrar la ventana a un monitor con
    // otra densidad cambia devicePixelRatio sin desmontar nada. El suelo de
    // 0.3 evita que en un aparato muy denso el borde quede tan duro que
    // dentelle.
    m.uniforms.uAA.value = Math.max(0.3, Math.min(1, dprBuffer / (window.devicePixelRatio || 1)));
    m.uniforms.uAspect.value = size.width / size.height;

    if (!reducedMotion) {
      // Scroll -> giro. Se lee de window y no de un store: es un valor que ya
      // está calculado, y suscribirse a otro sitio solo añadiría trabajo.
      scrollObj.current = window.scrollY;
      const dScroll = scrollObj.current - scrollAct.current;
      scrollAct.current += dScroll * 0.08;
      const s = scrollAct.current;

      // TRES EJES a la vez, con periodos que no son múltiplos entre sí: la
      // combinación no vuelve a repetirse en todo el scroll de la página, así
      // que la pieza nunca pasa dos veces por la misma pose.
      //  · Z rueda sin parar — es una rueda, y da el hilo continuo.
      //  · Y e X cabecean dentro de un tope. El tope es la clave: girando en Y
      //    sin límite, a los ~1500px la rueda se pone de canto y se queda en
      //    una raya vertical de puntos. A ±35° y ±24° se escorza de verdad,
      //    enseña el grosor y sigue leyéndose como lo que es.
      p.rotation.z = s * 0.0009;
      p.rotation.y = Math.sin(s * 0.00042) * 0.62;
      // X CONTINUA, no oscilando: la pieza bascula hacia el visitante y se le
      // ve la cara, el canto y el dorso a lo largo del scroll — el giro "de
      // frente". Va lenta (una vuelta cada ~11.400px, aprox. una por página
      // entera) para que al cruzar el canto sea un instante y no un parpadeo
      // constante; y como Z sigue rodando por su cuenta, incluso en ese
      // instante hay movimiento que mirar.
      p.rotation.x = s * 0.00055;

      // AMORTIGUACIÓN SOLO PARA EL TILT, nunca para la repulsión. Antes el
      // cursor entero pasaba por un lerp de 0.09 — unos 25 frames (~0.4s) en
      // converger — y la repulsión salía de ESE valor retrasado: el hueco
      // perseguía al puntero medio segundo por detrás, que es exactamente la
      // sensación de "no va fluido". El retraso no era del render sino del
      // dato. La inclinación del conjunto sí quiere ir suave (es un gesto de
      // cámara, no una respuesta directa), así que se queda con su lerp.
      const dr = ratonObj.current.clone().sub(raton.current);
      raton.current.addScaledVector(dr, 0.12);
      m.uniforms.uMouseOn.value = isMobile ? 0 : 1;
      // Ademas de repeler, el cursor inclina el conjunto: da la lectura de
      // volumen que un punto suelto no puede dar.
      p.rotation.y += raton.current.x * 0.16;
      p.rotation.x += raton.current.y * 0.12;

      // ---- Estela del cursor
      const est = estela.current;
      const uni = m.uniforms.uEstela.value as THREE.Vector3[];
      // La 0 va a la posición CRUDA del puntero y con edad 0: es la respuesta
      // directa y tiene que llegar en el mismo frame. Con el puntero quieto
      // encima se queda recién puesta, así que el hueco no se cierra solo.
      est[0].set(ratonObj.current.x, ratonObj.current.y, 0);
      // Las demás ENVEJECEN. Se cuenta en segundos y no en frames para que el
      // rastro dure lo mismo a 30 que a 120fps.
      for (let i = 1; i < ESTELA; i++) est[i].z += dt;
      // Marcas nuevas a intervalo fijo (~35ms) Y SOLO SI EL CURSOR SE HA
      // MOVIDO. Las dos condiciones hacen falta, cada una arregla un problema
      // distinto y quitar cualquiera de ellas rompe algo:
      //
      //  · Por tiempo (y no cada cierta distancia recorrida, como era antes de
      //    V18.02) porque sembrando por distancia un movimiento lento no
      //    soltaba marca durante un buen rato y luego soltaba una de golpe: el
      //    rastro avanzaba a saltos en vez de fluir.
      //  · Pero solo con movimiento, porque sembrar también con el puntero
      //    QUIETO —lo que hacía V18.02— tenía dos efectos feos. Las diez marcas
      //    caían en el mismo sitio con edades distintas, y como el buffer es
      //    circular la suma de sus fuerzas cambiaba cada vez que se reciclaba
      //    una casilla: los puntos TEMBLABAN bajo un cursor parado. Y la estela
      //    no llegaba a morir nunca, así que el invalidate() de abajo no
      //    paraba y la escena entera —muro y captura de transmisión incluidos—
      //    se quedaba renderizando a 60fps de forma permanente. De ahí el lag.
      //
      // El umbral es diminuto (0.004 en NDC, unos 4px): basta para distinguir
      // "quieto" de "moviéndose despacio" sin reintroducir los saltos.
      desdeMarca.current += dt;
      const movido = ratonObj.current.distanceTo(ultimaMarca.current) > 0.004;
      if (desdeMarca.current >= 0.035 && movido) {
        desdeMarca.current = 0;
        ultimaMarca.current.copy(ratonObj.current);
        est[siguiente.current].set(ratonObj.current.x, ratonObj.current.y, 0);
        siguiente.current = 1 + (siguiente.current % (ESTELA - 1));
      }
      // La envolvente del muelle se resuelve AQUÍ, no en el shader: depende
      // solo de la edad, que es la misma para los 13.000 vértices. exp(-t·2.4)
      // amortigua y cos(t·5) es lo que cruza el cero y hace que el punto se
      // pase un poco de vuelta antes de asentarse.
      uni[0].set(est[0].x, est[0].y, 1);
      for (let i = 1; i < ESTELA; i++) {
        const edad = est[i].z;
        uni[i].set(est[i].x, est[i].y, Math.exp(-edad * 2.4) * Math.cos(edad * 5));
      }

      // ---- Posición de la nube según la sección (V18.02)
      // Deja de estar clavada en el centro: cada sección la manda a un sitio y
      // a una profundidad distintos. La pose sale del índice de sección por el
      // ángulo áureo, igual que la del muro, pero DESFASADA (el +1.1) para que
      // las dos no se muevan a la vez ni hacia el mismo lado — si compartieran
      // ángulo, el conjunto se leería como una sola cosa desplazándose.
      // El índice 0 (la hero) se queda centrado y a su z de siempre: es donde
      // la figura tiene que estar mientras se lee el titular.
      const idx = poseSeccion.indice;
      const a = idx * 2.399963 + 1.1;
      const po = poseObj.current;
      po.x = idx === 0 ? 0 : Math.cos(a) * 0.3;
      po.y = idx === 0 ? 0 : Math.sin(a * 1.3) * 0.16;
      po.z = idx === 0 ? 0 : Math.sin(a * 0.7);
      const pa = pose.current;
      pa.x += (po.x - pa.x) * 0.035;
      pa.y += (po.y - pa.y) * 0.035;
      pa.z += (po.z - pa.z) * 0.035;
      // x/y en fracción de viewport (así el encuadre aguanta en cualquier
      // pantalla) y z en px de mundo. El rango de z es asimétrico a propósito:
      // acercarse agranda la figura por perspectiva y a partir de cierto punto
      // se comería el contenido, así que se aleja más de lo que se acerca.
      p.position.x = pa.x * size.width;
      p.position.y = pa.y * size.height;
      p.position.z = Z + pa.z * 220;

      // Mientras algo siga asentándose hay que seguir pidiendo frames: aquí
      // entra también la estela, que sigue moviendo puntos DESPUÉS de que el
      // ratón se haya parado, y el viaje de la nube entre secciones.
      // Sin closure por frame (el .some creaba uno): esto corre en cada frame
      // renderizado de toda la web.
      let estelaViva = false;
      for (let i = 1; i < ESTELA; i++) {
        if (est[i].z < 1.6) { estelaViva = true; break; }
      }
      const poseViva =
        Math.abs(po.x - pa.x) > 0.0005 ||
        Math.abs(po.y - pa.y) > 0.0005 ||
        Math.abs(po.z - pa.z) > 0.0005;
      if (Math.abs(dScroll) > 0.5 || dr.lengthSq() > 1e-6 || estelaViva || poseViva) invalidate();
    }

    // ---- Entrada: el polvo se agrupa (V18.02)
    // Arranca cuando la nube se monta de verdad (hasta que el .bin no ha
    // llegado no hay material y este useFrame sale antes), así que el viaje se
    // ve entero y no a medias. 2,2s de recorrido más el escalonado por punto
    // del shader.
    //
    // La comprobación de reduced motion va aquí y no solo en el valor inicial
    // del uniform porque la preferencia puede llegar DESPUÉS del montaje
    // (useReducedMotion devuelve false en SSR y cambia al hidratar): sin esto,
    // activarla a media animación dejaría la figura congelada a medio formar.
    if (reducedMotion) {
      if (m.uniforms.uForm.value !== 1) {
        form.current = 1;
        m.uniforms.uForm.value = 1;
        invalidate();
      }
    } else if (form.current < 1) {
      // El progreso se LEE DEL RELOJ, no se acumula sumando dt frame a frame.
      // La diferencia importa de verdad: en una pestaña en segundo plano el
      // navegador estrangula requestAnimationFrame, así que con la versión
      // acumulativa la nube se quedaba a medio formar —medido: 13% después de
      // un minuto— y el visitante volvía a una figura deshecha que seguía
      // avanzando a cámara lenta. Contra el reloj, los frames que falten solo
      // se saltan: al volver a la pestaña la animación está donde le toca.
      if (t0.current === 0) t0.current = performance.now();
      form.current = Math.min(1, (performance.now() - t0.current) / 2200);
      m.uniforms.uForm.value = form.current;
      invalidate();
    }
  });

  if (!geo) return null;

  // Radio en píxeles: 66% del lado corto (30% -> 52% -> 62% -> 66%), con tope
  // para que en pantallas muy altas no se coma el contenido. Al crecer, la
  // pieza cruza más superficie de texto, pero lo que la mantiene siendo FONDO
  // no es el tamaño sino cuánto pesa cada punto sobre lo que hay debajo (ver
  // uOpacity y el halo ceñido del fragment). El tope de móvil sube en la misma
  // proporción: ahí el lado corto ya manda casi siempre, así que apenas actúa.
  const escala = Math.min(Math.min(size.width, size.height) * 0.66, isMobile ? 360 : 700);

  return (
    // renderOrder -5: entre el muro (-10) y todo lo demás (0). No basta con
    // confiar en el orden por profundidad — los transparentes se ordenan por
    // distancia a la cámara y las cards se mueven en z cada frame, así que el
    // orden quedaría a merced del scroll. Explícito y estable.
    <points
      ref={puntosRef}
      geometry={geo}
      position={[0, 0, Z]}
      scale={escala}
      renderOrder={-5}
      frustumCulled={false}
    >
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        // Sin escritura de profundidad: son miles de puntos transparentes y
        // ordenarlos entre sí no aporta nada, pero sí costaría.
        depthWrite={false}
        // MEZCLA NORMAL, no aditiva, y este es el cambio que más hizo por la
        // nitidez. En aditivo cada punto SUMA su luz a la del píxel, así que
        // donde se solapan varios —y en una superficie 3D vista de frente se
        // solapan la cara delantera, la trasera y los bordes tangentes— el
        // resultado se dispara por encima de 1 y satura: los brazos de la rueda
        // se veían como masas blancas continuas, sin puntos distinguibles
        // dentro. Eso es lo que se leía como "baja resolución", y no tenía
        // arreglo por el lado del perfil del punto: por muy limpio que sea un
        // disco, veinte discos sumados dan una mancha. Con mezcla normal, dos
        // puntos blancos superpuestos siguen dando blanco y ni uno más, de modo
        // que la nube conserva su grano a cualquier densidad.
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
