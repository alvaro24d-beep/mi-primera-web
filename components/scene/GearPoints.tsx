"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_DISTANCE } from "./PixelCamera";

// ===== Nube de puntos con la forma del modelo (V17.85) =====
// Una rueda de radios dibujada solo con puntos, flotando ENTRE el muro de
// vídeo y el contenido: vive dentro del mismo <Canvas> global, después del
// muro (que se dibuja con renderOrder -10) y con el DOM entero por encima,
// porque el canvas está a z-index -1000. Cero contextos WebGL nuevos.
//
// EL MODELO NO SE CARGA. El .glb original pesa 7,6MB y trae 244.000 triángulos
// con tres texturas PBR — nada de eso hace falta para pintar puntos. La
// superficie se muestreó UNA vez fuera de línea (uniforme por área, con semilla
// fija) y lo único que llega al navegador es public/gear-points.bin: 9.000
// posiciones cuantizadas a Int16, 53KB. Para regenerarlo hay que volver a
// muestrear el .glb; no es un asset que se pueda "recompilar" desde el repo,
// así que no lo borres.
//
// Int16 NORMALIZADO y no Float32: el atributo viaja y vive en la GPU a la
// mitad de tamaño (53KB en vez de 105KB) y GL lo expande a [-1,1] al leerlo,
// sin una sola instrucción de más en el shader. El error de cuantización es
// 1/32767 del radio: centésimas de píxel a cualquier tamaño al que se dibuje.

const PUNTOS_URL = "/gear-points.bin";
// 22.000 (eran 9.000). Al subir el radio de la pieza a 0.52 del lado corto, su
// área en pantalla se multiplicó por ~2.4 y los 9.000 puntos se quedaban tan
// separados que la silueta se deshacía: la densidad, no el número, es lo que
// hace que una nube se lea como una forma. 22.000 la recuperan. El archivo
// pasa de 53 a 129KB — sigue siendo 59 veces menos que el .glb — y el coste de
// dibujarlos es el mismo draw call de siempre.
const TOTAL_PUNTOS = 22000;

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
  // xy = posición en NDC, z = fuerza restante (1 recién puesta, 0 agotada)
  uniform vec3 uEstela[ESTELA];
  uniform float uMouseOn;   // 0 en táctil: ni se calcula la repulsión
  uniform float uAspect;
  uniform float uRadio;     // radio de influencia del cursor, en NDC
  uniform float uEmpuje;    // desplazamiento máximo, en px de mundo
  uniform float uTime;
  uniform float uVida;      // amplitud de la deriva propia, en radios del objeto
  varying float vBrillo;

  void main() {
    // Semilla por punto derivada de su propia posición: un atributo más habría
    // sido otro buffer que subir y mantener, y aquí basta con que cada punto
    // tenga SU número estable.
    float semilla = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453);

    // VIDA PROPIA. Cada punto deriva alrededor de su sitio con su frecuencia y
    // su fase, en los tres ejes y con periodos distintos por eje, así que la
    // nube nunca está quieta ni respira "a una". La amplitud se mide en radios
    // del objeto (uVida ~0.014 = 1,4% del radio ≈ 6px en pantalla): suficiente
    // para que se note el hormigueo, poco para que la silueta siga siendo la
    // de la pieza y no una mancha.
    float f = 0.7 + semilla * 0.9;
    vec3 pos = position + vec3(
      sin(uTime * f + semilla * 6.2831),
      cos(uTime * f * 0.83 + semilla * 4.7),
      sin(uTime * f * 1.17 + semilla * 2.3)
    ) * uVida;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // Repulsión EN ESPACIO DE PANTALLA. Se proyecta el punto, se mide su
    // distancia al cursor en NDC y se empuja en el plano de la cámara. Hacerlo
    // aquí y no en el espacio del objeto es lo que mantiene el efecto correcto
    // mientras la figura gira con el scroll: el punto huye siempre en la
    // dirección en que el usuario lo ve, no en la que el modelo cree que es.
    //
    // Y no se empuja desde UN punto sino desde toda la ESTELA, cada posición
    // con la fuerza que le queda. Ahí está el "tardar en volver": el rastro que
    // el cursor deja atrás sigue apartando los puntos mientras se apaga, así
    // que la nube se recompone poco a poco por detrás en vez de saltar a su
    // sitio en cuanto el cursor se aleja. El bucle NO tiene rama: una entrada
    // agotada aporta 0 por su propia fuerza, y así el coste es fijo y sin
    // divergencia entre vértices.
    if (uMouseOn > 0.5) {
      vec4 clip = projectionMatrix * mv;
      vec2 ndc = clip.xy / clip.w;
      vec2 desp = vec2(0.0);
      for (int i = 0; i < ESTELA; i++) {
        vec2 dif = ndc - uEstela[i].xy;
        dif.x *= uAspect;            // sin esto el área de influencia sale ovalada
        float d = length(dif);
        // smoothstep(radio, 0) = 1 pegado al cursor y 0 en el borde: la caída es
        // suave por los dos extremos, sin frente duro.
        float f = smoothstep(uRadio, 0.0, d) * uEstela[i].z;
        desp += (dif / max(d, 1e-4)) * f;
      }
      // Tope de magnitud: donde el rastro se solapa consigo mismo (un giro
      // cerrado del ratón) las contribuciones se suman y sin esto el punto
      // saldría disparado fuera de la pantalla.
      float m = length(desp);
      if (m > 1.0) desp /= m;
      mv.xy += desp * uEmpuje;
    }

    gl_Position = projectionMatrix * mv;

    // Centelleo: dos senos de periodos primos entre sí para que el parpadeo no
    // se lea cíclico. Rango 0.35..1.35 (antes 0.55..1.0): con el blending
    // aditivo de abajo, los picos por encima de 1 son los que atraviesan el
    // umbral del bloom y FLORECEN — de ahí que la nube destelle de verdad en
    // vez de solo cambiar de gris.
    float c1 = sin(uTime * (0.9 + semilla * 1.4) + semilla * 6.2831);
    float c2 = sin(uTime * (0.37 + semilla * 0.5) + semilla * 2.1);
    vBrillo = 0.85 + 0.35 * c1 + 0.15 * c2;

    // Tamaño constante en píxeles PESE a la perspectiva: PixelCamera hace que
    // 1 unidad = 1px a z=0, así que a distancia d el factor es CAMERA/d.
    gl_PointSize = uSize * uDpr * (${CAMERA_DISTANCE.toFixed(1)} / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying float vBrillo;

  void main() {
    // Perfil GAUSSIANO, no un disco con borde. El disco tenía un contorno
    // definido y a un tamaño de 2-3px —y en móvil, sobre un canvas a dpr 1 que
    // luego la pantalla estira— ese contorno es exactamente lo que se veía
    // dentado y "de baja resolución": no había píxeles suficientes para
    // dibujar un círculo. Una caída exponencial no tiene contorno que
    // pixelar, así que aguanta cualquier resolución, y de paso ES el halo:
    // núcleo denso y aura alrededor, que es lo que hace que un punto se lea
    // como luz y no como una pegatina.
    vec2 c = gl_PointCoord - 0.5;
    float d2 = dot(c, c);             // al cuadrado: nos ahorra el sqrt
    if (d2 > 0.25) discard;           // fuera del inscrito no hay nada que sumar
    // El BRILLO percibido lo da el núcleo; el velo sobre el texto lo daba el
    // halo, que es ancho y suma en toda su superficie. Por eso el núcleo va
    // fuerte y el halo contenido (0.5 -> 0.3): se gana chispa y se pierde
    // niebla. Con additive, el texto de debajo se aclara un punto en vez de
    // desaparecer bajo una capa lechosa.
    // Núcleo APRETADO (30 -> 48) y halo tenue. Es lo que separa un punto
    // "definido" de una manchita difusa: con una caída blanda, un punto de
    // 2-3px es casi todo degradado y no llega a tener centro, y eso se lee
    // como baja resolución aunque la resolución sea correcta. Concentrando la
    // energía en el centro aparece el punto; el halo se queda solo para el
    // brillo, que es su trabajo.
    float nucleo = exp(-d2 * 48.0);
    float halo = exp(-d2 * 7.0) * 0.22;
    gl_FragColor = vec4(vec3(1.0), (nucleo + halo) * uOpacity * vBrillo);
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
  // Estela: la entrada 0 es SIEMPRE la posición actual del cursor (a fuerza
  // plena mientras el puntero esté en la ventana, para que dejarlo quieto
  // encima mantenga el hueco abierto) y las 1..n-1 son un buffer circular con
  // las posiciones por las que ha pasado, apagándose por tiempo.
  const estela = useRef<THREE.Vector3[]>(
    Array.from({ length: ESTELA }, () => new THREE.Vector3(0, 0, 0))
  );
  const siguiente = useRef(1);
  const ultimaMarca = useRef(new THREE.Vector2(0, 0));
  const ultimoT = useRef(0);

  useEffect(() => {
    let cancelado = false;
    fetch(PUNTOS_URL)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((ab) => {
        if (cancelado) return;
        const g = new THREE.BufferGeometry();
        // normalized: true -> GL entrega [-1,1] sin conversión en CPU ni shader.
        g.setAttribute("position", new THREE.BufferAttribute(new Int16Array(ab), 3, true));
        // El muestreo fue aleatorio, así que CUALQUIER prefijo del array es a su
        // vez una muestra uniforme de la superficie: el móvil dibuja la mitad de
        // los puntos sin necesidad de un segundo archivo ni de recortar nada.
        g.setDrawRange(0, isMobile ? TOTAL_PUNTOS / 2 : TOTAL_PUNTOS);
        // La esfera de cull la sabemos de antemano (el .bin está normalizado al
        // radio 1), así que nos ahorramos que three recorra los 9.000 puntos
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

  // Calibrado para que sea FONDO y no un objeto encima del contenido. A
  // opacidad 0.6 y 3px la figura tapaba el párrafo de la hero — se leía como
  // una capa por delante del texto, que es justo lo contrario de lo que pide
  // estar "entre el muro y el contenido". A 0.3 y 2.4px la silueta sigue
  // reconociéndose sobre el muro oscuro y el texto blanco pasa por encima sin
  // pelearse con ella.
  const uniforms = useMemo(
    () => ({
      // De vuelta en el canvas global, el dpr vuelve a ser el suyo (1.25
      // escritorio / 1 móvil), así que en móvil el punto necesita algún píxel
      // más para no quedarse en nada al estirarlo la pantalla. Lo que salva la
      // nitidez a esta resolución no es el tamaño sino el núcleo apretado del
      // fragment (ver el exp(-d2*48)).
      uSize: { value: isMobile ? 3.6 : 2.8 },
      uDpr: { value: 1 },
      // El array se pasa por referencia: se mutan los Vector3 en su sitio cada
      // frame y three sube el bloque entero, sin reasignar ni reservar nada.
      uEstela: { value: Array.from({ length: ESTELA }, () => new THREE.Vector3(0, 0, 0)) },
      uMouseOn: { value: 0 },
      uAspect: { value: 1 },
      uRadio: { value: 0.3 },
      uEmpuje: { value: 52 },
      uTime: { value: 0 },
      uVida: { value: 0.014 },
      // Con blending ADITIVO este número no es "cuánto tapa" sino "cuánta luz
      // suma". Y la luz que llega al ojo es la de TODOS los puntos que caen en
      // ese píxel, así que al pasar de 9.000 a 22.000 hay que bajarlo o el
      // velo sobre el texto crece con la densidad: 0.44 -> 0.3. El brillo
      // percibido no baja — lo que antes daba un punto ahora lo dan dos.
      uOpacity: { value: isMobile ? 0.3 : 0.34 },
    }),
    [isMobile]
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
    m.uniforms.uDpr.value = gl.getPixelRatio();
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
      // La 0 va a la posición CRUDA del puntero, sin amortiguar: es la
      // respuesta directa y tiene que llegar en el mismo frame. Con el puntero
      // quieto encima se queda a fuerza plena, así que el hueco no se cierra
      // solo.
      est[0].set(ratonObj.current.x, ratonObj.current.y, 1);
      // El resto se apaga por TIEMPO, no por frames: así tarda lo mismo en
      // recomponerse a 30 que a 120fps. TAU 0.55s -> ~1,6s hasta apagarse.
      for (let i = 1; i < ESTELA; i++) {
        if (est[i].z > 0) est[i].z = Math.max(0, est[i].z - dt / 0.55);
      }
      // Se suelta una marca nueva solo cada cierto recorrido: sembrar una por
      // frame llenaría las 9 casillas en un palmo de pantalla y la estela no
      // llegaría a notarse.
      if (ratonObj.current.distanceTo(ultimaMarca.current) > 0.045) {
        ultimaMarca.current.copy(ratonObj.current);
        est[siguiente.current].set(ratonObj.current.x, ratonObj.current.y, 1);
        siguiente.current = 1 + ((siguiente.current) % (ESTELA - 1));
      }
      for (let i = 0; i < ESTELA; i++) uni[i].copy(est[i]);

      // Mientras algo siga asentándose hay que seguir pidiendo frames: aquí
      // entra también la estela, que sigue moviendo puntos DESPUÉS de que el
      // ratón se haya parado.
      let estelaViva = false;
      for (let i = 1; i < ESTELA; i++) if (est[i].z > 0) { estelaViva = true; break; }
      if (Math.abs(dScroll) > 0.5 || dr.lengthSq() > 1e-6 || estelaViva) invalidate();
    }
  });

  if (!geo) return null;

  // Radio en píxeles: 40% del lado corto (era 30%), con tope para que en
  // pantallas muy altas no se coma el contenido. Al crecer, la pieza cruza más
  // superficie de texto, así que la opacidad baja en la misma jugada (ver
  // uOpacity): lo que la mantiene siendo FONDO no es el tamaño sino cuánto
  // pesa cada punto sobre lo que hay debajo.
  const escala = Math.min(Math.min(size.width, size.height) * 0.52, isMobile ? 300 : 560);

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
        // ADITIVO: los puntos SUMAN luz al fondo en vez de taparlo, que es lo
        // que hace que un punto blanco sobre un muro oscuro se lea como brillo
        // y no como pintura. Donde se solapan (los cubos de los radios) la suma
        // los lleva por encima de 1 y ahí entra el Bloom del composer, cuyo
        // umbral de luminancia está en 0.6: esos núcleos florecen de verdad.
        // También es lo que permite subir uOpacity sin dañar la lectura del
        // texto — aclara lo que hay debajo en lugar de ensuciarlo.
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
