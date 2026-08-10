// ===== Parámetros de la piedra en el agua (V17.72) =====
// Viven aquí, en un solo sitio, porque los consumen DOS motores distintos que
// tienen que pintar la MISMA onda: el shader del muro (SceneBackground.tsx los
// interpola dentro del GLSL) y el chapoteo de los textos de la hero
// (LoadProgress.tsx los evalúa en JS por frame). Duplicarlos era garantizar
// que un día se desincronizaran y el fondo y el texto ondularan a destiempo.
//
// La métrica del radio es la misma en los dos lados: distancia al centro de la
// pantalla dividida por la ALTURA del viewport. En el shader sale de
// (fragCoord/uRes - 0.5) * vec2(aspect, 1.0), que es exactamente eso; en JS,
// de (posición - centro) / innerHeight. Con esa normalización la esquina de una
// 16:9 cae en r≈1.02.
export const RIPPLE = {
  // Unidades de radio por segundo. A 0.62 el frente tarda ~1.65s en cruzar la
  // esquina, emparejado con los 3s del revelado de la cortina (globals.css).
  VEL: 0.62,
  // Crestas por unidad de radio. 46 -> 11 (V17.73, "quita algunas ondas, mejor
  // que sea una sola muy marcada").
  FREQ: 11,
  // Campana que viaja con el frente: cuanto MAYOR, más estrecha. 7 -> 30, que
  // junto con la FREQ de arriba deja menos de un ciclo completo dentro de la
  // campana — es decir, UN solo anillo con su valle a los lados, en vez del
  // tren de crestas anterior.
  BELL: 30,
  // Amortiguación global.
  DECAY: 0.8,
  // Vida útil. El frente sale del encuadre a ~1.65s y para 2.9s la estela está
  // por debajo del 10%: a partir de ahí no queda nada que dibujar.
  DUR: 2.9,
  // OJO al calibrar las dos amplitudes de abajo: el pico de la onda NO vale 1.
  // El seno y la campana no alcanzan su máximo en el mismo sitio, así que
  // max|sin(dr·FREQ)·exp(-dr²·BELL)| ≈ 0.66, y con la amortiguación encima
  // ronda 0.5 en la parte visible. O sea, el empuje real es ~la mitad del
  // número que se escribe aquí. Medido, no estimado.
  //
  // Empuje del muro, en UV del arco: pico real ~0.021 UV ≈ 94 unidades ≈ 33px
  // en pantalla. Sube desde 0.026 al quedar un solo anillo — con una sola onda,
  // la amplitud es lo único que la hace "muy marcada".
  AMP_UV: 0.042,
  // Empuje de las letras de la hero, en px de pantalla: pico real ~28px.
  AMP_PX: 55,
  // Estiramiento de cada letra a lo largo del eje radial, por unidad de
  // pendiente de la onda (ver LoadProgress). La pendiente vale FREQ (11) justo
  // en la cresta, así que esto da ~1.33 de escala ahí.
  STRETCH: 0.03,
  // Tope duro del estiramiento. En el primer frame la amortiguación todavía no
  // ha entrado y la pendiente está en su máximo absoluto; sin tope, la letra
  // del centro daba un salto de escala que se leía como un glitch.
  STRETCH_MIN: 0.72,
  STRETCH_MAX: 1.32,
};
