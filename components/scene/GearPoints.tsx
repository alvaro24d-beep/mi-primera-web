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
const TOTAL_PUNTOS = 9000;

// Profundidad a la que flota, en px de mundo (PixelCamera: 1 unidad = 1px a
// z=0). Lejos del muro (-1900) y por delante de él, pero con bastante
// perspectiva para que la rotación se lea.
const Z = -420;

const vertexShader = /* glsl */ `
  uniform float uSize;
  uniform float uDpr;
  uniform vec2 uMouse;      // en NDC (-1..1)
  uniform float uMouseOn;   // 0 en táctil: ni se calcula la repulsión
  uniform float uAspect;
  uniform float uRadio;     // radio de influencia del cursor, en NDC
  uniform float uEmpuje;    // desplazamiento máximo, en px de mundo
  uniform float uTime;
  varying float vBrillo;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);

    // Repulsión EN ESPACIO DE PANTALLA. Se proyecta el punto, se mide su
    // distancia al cursor en NDC y se empuja en el plano de la cámara. Hacerlo
    // aquí y no en el espacio del objeto es lo que mantiene el efecto correcto
    // mientras la figura gira con el scroll: el punto huye siempre en la
    // dirección en que el usuario lo ve, no en la que el modelo cree que es.
    if (uMouseOn > 0.5) {
      vec4 clip = projectionMatrix * mv;
      vec2 ndc = clip.xy / clip.w;
      vec2 dif = ndc - uMouse;
      dif.x *= uAspect;              // sin esto el área de influencia sale ovalada
      float d = length(dif);
      // smoothstep(radio, 0) = 1 pegado al cursor y 0 en el borde: la caída es
      // suave por los dos extremos, sin frente duro.
      float f = smoothstep(uRadio, 0.0, d) * uEmpuje;
      mv.xy += (dif / max(d, 1e-4)) * f;
    }

    gl_Position = projectionMatrix * mv;

    // Semilla por punto derivada de su propia posición: un atributo más habría
    // sido otro buffer que subir y mantener, y aquí basta con que cada punto
    // tenga SU número estable.
    float semilla = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    // Centelleo lento y desfasado. Es lo único que impide que la nube parezca
    // una calcomanía cuando nada se mueve.
    vBrillo = 0.55 + 0.45 * sin(uTime * (0.6 + semilla * 0.9) + semilla * 6.2831);

    // Tamaño constante en píxeles PESE a la perspectiva: PixelCamera hace que
    // 1 unidad = 1px a z=0, así que a distancia d el factor es CAMERA/d.
    gl_PointSize = uSize * uDpr * (${CAMERA_DISTANCE.toFixed(1)} / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying float vBrillo;

  void main() {
    // Disco con borde suave. El discard recorta la esquina del cuadrado del
    // punto: son 2-3px, pero son 9.000 cuadrados por frame.
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);              // distancia AL CUADRADO: nos ahorra el sqrt
    if (d > 0.25) discard;
    float a = smoothstep(0.25, 0.04, d);
    gl_FragColor = vec4(1.0, 1.0, 1.0, a * uOpacity * vBrillo);
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
      uSize: { value: isMobile ? 2.2 : 2.4 },
      uDpr: { value: 1 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseOn: { value: 0 },
      uAspect: { value: 1 },
      uRadio: { value: 0.34 },
      uEmpuje: { value: 46 },
      uTime: { value: 0 },
      uOpacity: { value: isMobile ? 0.26 : 0.3 },
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

    m.uniforms.uTime.value = clock.elapsedTime;
    m.uniforms.uDpr.value = gl.getPixelRatio();
    m.uniforms.uAspect.value = size.width / size.height;

    if (!reducedMotion) {
      // Scroll -> giro. Se lee de window y no de un store: es un valor que ya
      // está calculado, y suscribirse a otro sitio solo añadiría trabajo.
      scrollObj.current = window.scrollY;
      const dScroll = scrollObj.current - scrollAct.current;
      scrollAct.current += dScroll * 0.08;
      // El scroll la hace RODAR sobre su propio eje (Z), no girar en Y. Girando
      // en Y la rueda se pone de canto a los ~1500px de scroll y desaparece:
      // queda una raya vertical de puntos que no se parece a nada. Rodando, la
      // silueta se lee siempre y además es lo que una rueda hace. Una vuelta
      // completa cada ~7000px, así que el movimiento se nota sin marear.
      p.rotation.z = scrollAct.current * 0.0009;
      // Inclinación fija de tres cuartos: lo justo para que se le vea el grosor
      // y no parezca un dibujo plano.
      p.rotation.x = -0.2;
      p.rotation.y = 0;

      const dr = ratonObj.current.clone().sub(raton.current);
      raton.current.addScaledVector(dr, 0.09);
      m.uniforms.uMouse.value.copy(raton.current);
      m.uniforms.uMouseOn.value = isMobile ? 0 : 1;
      // Ademas de repeler, el cursor inclina el conjunto: da la lectura de
      // volumen que un punto suelto no puede dar.
      p.rotation.y += raton.current.x * 0.16;
      p.rotation.x += raton.current.y * 0.12;

      // Mientras algo siga asentándose hay que seguir pidiendo frames.
      if (Math.abs(dScroll) > 0.5 || dr.lengthSq() > 1e-6) invalidate();
    }
  });

  if (!geo) return null;

  // Radio en píxeles: ~30% del lado corto, con tope para que en pantallas muy
  // anchas no se coma el contenido.
  const escala = Math.min(Math.min(size.width, size.height) * 0.3, isMobile ? 200 : 300);

  return (
    <points ref={puntosRef} geometry={geo} position={[0, 0, Z]} scale={escala} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        // Sin escritura de profundidad: son miles de puntos transparentes y
        // ordenarlos entre sí no aporta nada, pero sí costaría.
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
