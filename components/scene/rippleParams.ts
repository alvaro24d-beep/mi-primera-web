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
  // Crestas por unidad de radio. 22 -> 46 (V17.72, "que las ondas sean más
  // cortas y que haya más"): la longitud de onda se parte por dos.
  FREQ: 46,
  // Campana que viaja con el frente: cuanto MENOR, más ancha, y más anillos se
  // ven a la vez. 18 -> 7 por la misma petición — con 46 crestas por unidad,
  // una campana estrecha solo habría dejado ver una o dos.
  BELL: 7,
  // Amortiguación global.
  DECAY: 0.8,
  // Vida útil. El frente sale del encuadre a ~1.65s y para 2.9s la estela está
  // por debajo del 10%: a partir de ahí no queda nada que dibujar.
  DUR: 2.9,
};
