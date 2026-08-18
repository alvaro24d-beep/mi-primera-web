"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { esMovil } from "@/lib/scrollRitmo";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger, SplitText);

// (V17.54) ESTRUCTURA REHECHA con el patrón que este proyecto ya tenía
// resuelto para la frase de Servicios (.nxr-servicios-head): el contenido va
// en un contenedor FIJO AL VIEWPORT.
//
// Por qué hacían falta cuatro intentos: mientras el texto viva en el flujo
// normal, VIAJA CON LA PÁGINA — entra por abajo y sale por arriba, porque eso
// es literalmente lo que hace el scroll. Daba igual el tipo de animación
// (scrub en V17.50/52, sticky en V17.51, por tiempo en V17.53): el
// desplazamiento propio de ~70px siempre quedaba enterrado bajo los ~500px que
// la página movía el bloque. El comentario de .nxr-servicios-head en
// globals.css cuenta exactamente esta misma historia y termina igual: fijarlo
// al viewport, donde "no viaja ni un píxel, ni antes, ni durante, ni después".
//
// Con el contenedor fijo, el ÚNICO movimiento posible es el que se le dé aquí:
//   Escritorio → titular entra desde ARRIBA y sale por ABAJO (eje Y),
//                párrafo entra desde ABAJO y sale por ARRIBA.
//   Móvil      → SOLO eje X, y clavada a 0: titular entra por la DERECHA y
//                sale por la IZQUIERDA; párrafo entra por la IZQUIERDA y sale
//                por la DERECHA. Nunca hay componente vertical.

// Recorridos MUY cortos (V17.56): el desplazamiento es un apoyo del fundido,
// no un viaje. Antes 90/150px, que en móvil sobre todo se leía como un
// deslizamiento largo.
const TRAVEL_Y = 34; // px, escritorio
const TRAVEL_X = 46; // px, móvil
// Fracción de ese recorrido que usa el PÁRRAFO al salir en móvil. Ver el
// bloque `horizontal` del onUpdate: la salida se acorta para que no termine de
// difuminarse contra el borde derecho de la pantalla.
const SALIDA_X = 0.35;
const MAX_BLUR = 10;
// Cuánto se separan entre sí las líneas al entrar/salir, en fracción del
// recorrido de fundido. 0.55 deja que la primera esté casi resuelta cuando la
// última arranca: se lee como una ola, no como un goteo.
const SPREAD = 0.55;

// (V17.55) Movimiento CONTINUO: los textos ya no se paran en el centro.
// Antes había una meseta explícita (k = 0 entre dos umbrales) y el texto se
// quedaba literalmente clavado. Ahora la posición es una única curva sin
// tramos: p + k·sin(2πp)/2π, cuya derivada es 1 + k·cos(2πp). En el centro
// vale 1-k, así que con 0.85 el texto cruza el medio al 15% de su velocidad
// —frena de verdad— pero NUNCA llega a cero, y acelera simétricamente al
// salir.
// 0.7 y no más alto: con 0.85 la velocidad del centro caía al 15% y el texto
// recorría ~7px en el 20% central del scroll — técnicamente en movimiento,
// pero a simple vista indistinguible de estar parado, que es justo lo que
// había que evitar. A 0.7 el mínimo es el 30% y el centro se mueve el doble,
// sin perder la frenada (los extremos van al 170%).
//
// En MÓVIL baja a 0.3 (V18.22). El reparto es un juego de suma cero: cuanto más
// frena el centro, más se aceleran los extremos, y son los extremos los que
// dibujan la entrada y la salida. Con 0.7 iban al 170% de velocidad y sobre una
// sección corta eso se veía como que el texto aparecía y desaparecía de golpe.
// A 0.3 los extremos van al 130%: entrada y salida duran bastante más, a cambio
// de una frenada central menos marcada — que es tiempo en el que el texto está
// quieto, o sea justo el scroll que sobraba.
const SLOW_K_DESKTOP = 0.7;
const SLOW_K_MOVIL = 0.3;
// Banda alrededor del centro en la que el texto se lee a plena opacidad. Es lo
// que sustituye a la antigua meseta: el texto sigue moviéndose (despacio)
// mientras tanto, en vez de estar parado.
// Banda central en la que todo se lee a pleno; lo que queda fuera es fundido.
// Estrecharla no acelera nada — al revés: reparte MÁS scroll al difuminado,
// que es lo que se quiere poder apreciar.
const READ_IN = 0.26;
// ASIMÉTRICA en la salida y solo en escritorio (V17.60, "que desaparezcan más
// lentamente… solo en ordenador"): arrancando el fundido casi desde el centro,
// la desaparición dispone de ~86vh de scroll en lugar de ~40. No la vuelve
// prematura: al ser gradual y escalonada, el texto sigue perfectamente legible
// durante buena parte de ese tramo. En móvil se mantiene simétrica.
const READ_OUT_DESKTOP = 0.08;

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export default function Intro() {
  const sectionRef = useRef<HTMLElement>(null);
  const fixedRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const prefersReduced = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const section = sectionRef.current;
      const fixed = fixedRef.current;
      const title = titleRef.current;
      const texts = textsRef.current;
      if (!section || !fixed || !title || !texts) return;

      if (prefersReduced) {
        // Sin fijado ni movimiento: el contenido se lee como un bloque normal.
        fixed.classList.add("nxr-intro-fixed-static");
        gsap.set([title, texts], { clearProps: "transform,filter", opacity: 1 });
        return;
      }

      // Titular y párrafo van los dos por CARACTERES (V18.21; el párrafo estuvo
      // por líneas desde V17.56 por coste). El acento .nxr-gradient-text-lime
      // del titular es la excepción: pinta con background-clip: text y trocearlo
      // lo dejaría transparente, así que va en `ignore` y se reinyecta entero.
      // autoSplit re-trocea al cambiar el ancho y onSplit vuelve a capturar.
      let titleLines: HTMLElement[] = [];
      let textLines: HTMLElement[] = [];
      // Último estado pintado. autoSplit REHACE los trozos cuando cambia el
      // ancho o el layout (p. ej. al aparecer el pin de Proceso), y los nuevos
      // nacen SIN los estilos que llevaban los viejos: el texto se quedaba a
      // opacidad 1 y reaparecía encima de la sección siguiente. Guardando el
      // estado se puede repintar en cuanto hay trozos nuevos.
      let ultimaBase = 1;
      let ultimoSaliendo = false;

      // Reparte el fundido entre los trozos. `base` es 0 con el texto centrado
      // y 1 en el extremo; cada trozo arranca su transición desplazado según su
      // turno, así que el difuminado BARRE en vez de aplicarse de golpe.
      // `mandaElFinal`: qué extremo lleva la voz — el último trozo (titular) o
      // el primero (párrafo). Ese extremo es el PRIMERO EN APARECER y también
      // el PRIMERO EN IRSE, que es lo pedido; y como con una fórmula simétrica
      // el que se va antes sería justo el que aparece después, el orden se
      // INVIERTE entre entrada y salida (de ahí el flag `saliendo`).
      // Declarada ANTES de los splits a propósito: sus onSplit la necesitan
      // para repintar los trozos recién creados.
      const aplicar = (lineas: HTMLElement[], base: number, saliendo: boolean, mandaElFinal: boolean) => {
        const n = lineas.length;
        for (let i = 0; i < n; i++) {
          // prio 0 = el trozo que manda.
          const prio = n === 1 ? 0 : (mandaElFinal ? n - 1 - i : i) / (n - 1);
          // turno 0 = el más oculto en este instante. Saliendo, el que manda
          // debe ser el primero en apagarse; entrando, el último en quedar
          // oculto (o sea, el primero en verse).
          const turno = saliendo ? prio : 1 - prio;
          const local = Math.min(1, Math.max(0, (base - turno * SPREAD) / (1 - SPREAD)));
          const f = smoothstep(local);
          const el = lineas[i];
          el.style.opacity = (1 - f).toFixed(3);
          el.style.filter = f > 0.001 ? `blur(${(f * MAX_BLUR).toFixed(2)}px)` : "none";
        }
      };

      // Repinta con el último estado conocido. Se llama en cada onSplit: sin
      // esto, los trozos que autoSplit rehace nacen a opacidad 1 y el texto
      // reaparece entero sobre la sección siguiente.
      const reaplicar = () => {
        aplicar(titleLines, ultimaBase, ultimoSaliendo, true);
        aplicar(textLines, ultimaBase, ultimoSaliendo, false);
      };

      // El acento .nxr-gradient-text-lime va en `ignore` y se reinyecta ENTERO:
      // pinta con background-clip: text, y trocearlo en chars lo dejaría
      // transparente (mismo motivo documentado en useTitleReveal). Se anima
      // como una unidad, que además es justo el final de la frase.
      const titleSplit = SplitText.create(title, {
        type: "words, chars",
        ignore: ".nxr-gradient-text-lime",
        autoSplit: true,
        onSplit: (self) => {
          const acentos = Array.from(title.querySelectorAll<HTMLElement>(".nxr-gradient-text-lime"));
          titleLines = [...(self.chars as HTMLElement[]), ...acentos].sort((a, b) =>
            a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
          );
          reaplicar();
        },
      });
      // El párrafo va TAMBIÉN letra a letra (antes por líneas). Con ~90
      // caracteres el barrido se lee mucho más fino que con once líneas: el
      // difuminado recorre la frase en vez de encenderla a bloques.
      //
      // El coste que documentaba la versión por líneas es real —cada trozo
      // lleva su propio filter: blur() y son capas de composición— pero está
      // acotado por dos cosas que ya estaban aquí: solo los caracteres EN
      // TRANSICIÓN llevan blur (los demás quedan en `none`, ver `aplicar`), y
      // SPREAD hace que en cada instante solo una parte de la frase esté en ese
      // estado. El <strong> del interior no da problemas al trocear, a
      // diferencia del acento del titular, que pinta con background-clip.
      const textsSplit = SplitText.create(texts.querySelectorAll<HTMLElement>(".nxr-intro-text"), {
        type: "words, chars",
        autoSplit: true,
        onSplit: (self) => {
          textLines = self.chars as HTMLElement[];
          reaplicar();
        },
      });

      // Estado de partida (todo oculto) ANTES de destapar los contenedores: el
      // CSS los mantiene a opacidad 0 justamente hasta aquí, así que no hay un
      // frame con el texto a la vista antes del primer cálculo. A partir de
      // ahora la opacidad la gobiernan las líneas, no el contenedor.
      aplicar(titleLines, 1, false, true);
      aplicar(textLines, 1, false, false);
      gsap.set([title, texts], { opacity: 1 });

      let horizontal = esMovil();
      const onResize = () => {
        horizontal = esMovil();
      };
      window.addEventListener("resize", onResize, { passive: true });

      // Estado "todo apagado", forzado sin esperar al scrub.
      const forzarOculto = () => {
        aplicar(titleLines, 1, false, true);
        aplicar(textLines, 1, false, false);
      };

      const st = ScrollTrigger.create({
        trigger: section,
        // El rango NO puede llegar hasta "bottom top" (V17.59): la frase de
        // Servicios es otro elemento FIJO a pantalla completa y arranca 1.35·vh
        // antes de su pin — que cae justo detrás del final de esta sección. Con
        // el rango largo, los dos overlays se solapaban ~1.35·vh y se veían
        // encima el uno del otro. Terminando en "bottom 150%" esta sección se
        // ha apagado del todo antes de que aquella empiece.
        start: "top bottom",
        // En MÓVIL termina antes (115% en vez de 150%) para que la frase de
        // Servicios pueda arrancar antes y su recorrido se acorte, sin dejar
        // hueco entre las dos: ambas cifras se miden contra la misma
        // referencia (el sticky de Servicios cae justo tras este bottom).
        end: () => (esMovil() ? "bottom 115%" : "bottom 150%"),
        invalidateOnRefresh: true,
        scrub: 0.6,
        // El scrub deja el último valor al salir, y con 0.6s de lag una salida
        // rápida puede dejarlo a medias — justo lo que deja un overlay fijo
        // medio encendido sobre la sección siguiente.
        onLeave: forzarOculto,
        onLeaveBack: forzarOculto,
        onUpdate: (self) => {
          const p = self.progress;
          // Una sola curva continua, sin tramos: −1 entrando · 0 centrado ·
          // +1 saliendo. Frena al acercarse al centro y acelera al alejarse,
          // pero el valor cambia SIEMPRE (nunca hay dos frames iguales).
          const slowK = horizontal ? SLOW_K_MOVIL : SLOW_K_DESKTOP;
          const eased = p + (slowK * Math.sin(2 * Math.PI * p)) / (2 * Math.PI);
          const k = (eased - 0.5) * 2;

          // El fundido va por LÍNEAS y desacoplado de la posición: dentro de
          // la banda de lectura todo se ve a pleno mientras el bloque sigue
          // deslizándose despacio.
          const away = Math.abs(k);
          const saliendo = k > 0;
          // La salida de escritorio usa una banda más estrecha: mismo fundido,
          // repartido en mucho más scroll.
          const band = saliendo && !horizontal ? READ_OUT_DESKTOP : READ_IN;
          const base = away <= band ? 0 : (away - band) / (1 - band);
          // Se recuerda para poder repintar si autoSplit rehace los trozos.
          ultimaBase = base;
          ultimoSaliendo = saliendo;
          // Titular: manda su ÚLTIMA línea ("trabaje por ti.") — es la primera
          // en mostrarse y la primera en irse. Párrafo: manda la PRIMERA.
          aplicar(titleLines, base, saliendo, true);
          aplicar(textLines, base, saliendo, false);

          // El desplazamiento sí es del bloque entero (las líneas no se
          // separan entre sí, solo se funden escalonadas).
          if (horizontal) {
            // SOLO horizontal. y a 0 explícito: no puede haber ni un píxel de
            // componente vertical.
            //
            // La SALIDA del párrafo recorre mucho menos que su entrada
            // (SALIDA_X, V18.29). Con el mismo recorrido en los dos sentidos se
            // iba hacia el borde derecho mientras aún se estaba difuminando, y
            // en un teléfono eso significa terminar de desaparecer contra el
            // marco. Acortando solo ese tramo, el párrafo frena antes, se queda
            // más a la izquierda y acaba de fundirse ahí, dentro de la pantalla.
            // La entrada no se toca: viene de fuera y ahí el recorrido largo es
            // lo que hace que se lea como que entra.
            gsap.set(title, { x: -k * TRAVEL_X, y: 0 });
            gsap.set(texts, { x: k * TRAVEL_X * (k > 0 ? SALIDA_X : 1), y: 0 });
          } else {
            // Titular: k=−1 (entrando) lo pone ARRIBA; k=+1 (saliendo), abajo.
            gsap.set(title, { y: k * TRAVEL_Y, x: 0 });
            gsap.set(texts, { y: -k * TRAVEL_Y, x: 0 });
          }
        },
      });

      // (El scramble de los párrafos sale de la Intro en V17.56: reescribe el
      // textContent, y ahora ese texto está repartido en las líneas que
      // gobierna SplitText — se pisaban. El revelado escalonado es la entrada
      // de esta sección.)

      return () => {
        window.removeEventListener("resize", onResize);
        st.kill();
        // A mano: useGSAP limpia animaciones, no el DOM que reescribe el plugin.
        titleSplit.revert();
        textsSplit.revert();
      };
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section id="nxr-intro" ref={sectionRef}>
      {/* Hijo DIRECTO de la sección: si colgara de un contenedor con transform
          (p. ej. el translate3d que CursorDrift aplica a .nxr-intro-inner), ese
          ancestro se convertiría en su bloque contenedor y el `fixed` pasaría
          a comportarse como `absolute` — la misma trampa que documenta
          .nxr-servicios-head. El inner va DENTRO, así que su deriva de cursor
          se mantiene sin romper nada. */}
      <div className="nxr-intro-fixed" ref={fixedRef}>
        <div className="nxr-intro-inner">
          <div className="nxr-intro-left">
            <h2 className="nxr-intro-headline" ref={titleRef}>
              Hacemos que
              <br />
              la tecnología
              <br />
              <span className="nxr-gradient-text-lime">trabaje por ti.</span>
            </h2>
          </div>

          <div className="nxr-intro-cards">
            <div className="nxr-intro-texts" ref={textsRef}>
              <div className="nxr-intro-textblock">
                <p className="nxr-intro-text">
                  Somos una agencia de <strong>software e inteligencia artificial</strong> especializada en construir
                  sistemas digitales que automatizan tareas, captan clientes y hacen crecer negocios — sin que tengas
                  que entender de tecnología.
                </p>
                <p className="nxr-intro-text">
                  Trabajamos con <strong>empresas de cualquier sector</strong> que saben que pueden ir más rápido pero
                  no tienen el equipo técnico para hacerlo. Nosotros somos ese equipo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
