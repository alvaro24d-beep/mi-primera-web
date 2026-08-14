import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond, Rajdhani, Space_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import SceneCanvasLazy from "@/components/scene/SceneCanvasLazy";
import GearPointsLazy from "@/components/scene/GearPointsLazy";
import RevealInit from "@/components/RevealInit";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollProgress from "@/components/ScrollProgress";
import LoadProgress from "@/components/LoadProgress";
import CursorDrift from "@/components/CursorDrift";
import GradualBlur from "@/components/GradualBlur";

const manrope = Manrope({
  variable: "--font-primary",
  subsets: ["latin"],
});

// Serif reserved for the two hero phrases ("Construido con maestría…" /
// "Todo lo que tu negocio necesita…") and a few accents (hero CTA text,
// AgentesIA clock) — the general heading font is Rajdhani below.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: "400",
  style: "normal",
  subsets: ["latin"],
});

// Display sans for ALL titles site-wide (see the h1-h6 rule in globals.css),
// medium weights per spec ("grosores medios").
const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

// Monospace for ALL paragraphs site-wide (global `p` rule in globals.css).
// Space Mono only ships 400/700 — 400 is its medium-reading weight.
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "arcfine — Agencia de software & inteligencia artificial",
  description:
    "Webs, agentes de IA, automatizaciones y apps que trabajan por ti mientras tú te enfocas en crecer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${manrope.variable} ${cormorant.variable} ${rajdhani.variable} ${spaceMono.variable}`}>
      <body suppressHydrationWarning>
        {/* Start the wall video download IMMEDIATELY (the canvas itself
            mounts lazily on idle — without these the fetch only began ~1-2s
            in, which is why a placeholder used to show first). Orientation
            media queries pick just the clip this device will actually play;
            React 19 hoists these <link>s into <head>. */}
        <link rel="preload" as="video" href="/bg-video.mp4" media="(orientation: landscape)" />
        <link rel="preload" as="video" href="/bg-video-vertical.mp4" media="(orientation: portrait)" />
        <SmoothScroll />
        <ScrollProgress />
        {/* Cortina de carga: cubre la página desde el primer paint hasta que
            el muro de vídeo está pintando (progreso por hitos reales) — el
            fondo nunca se ve "a medio llegar". */}
        <LoadProgress />
        {/* Deriva global de contenido con el cursor (vars CSS en :root; la
            lista curada de contenedores vive en globals.css). */}
        <CursorDrift />
        {/* (V17.83: aquí se montaba InvertCursor, el disco que invertía el
            fondo en lugar de la flecha del sistema. Eliminado por rendimiento —
            ver el comentario en globals.css: un cursor DOM va al ritmo de los
            frames de la página, no al del ratón.) */}
        {/* WebGL backdrop deferred off the load's critical path — see
            SceneCanvasLazy (dynamic import + idle mount + fade-in). */}
        <SceneCanvasLazy />
        {/* La nube de puntos, en su propio canvas (z-index -999) entre el muro
            y el contenido: separada del backdrop para no heredar ni su ritmo de
            repintado ni su resolución. Ver GearPointsCanvas. */}
        <GearPointsLazy />
        <RevealInit />
        {/* Fixed to the viewport (`target="page"`), sitting above page content
            but below Header/the floating nav (z-index 9998/9999) — content
            scrolling underneath fades/blurs progressively instead of being
            clipped abruptly by that fixed chrome. */}
        {/* divCount 2 (component default is 5; aquí fue 3 hasta V17.76): cada
            div es una capa con backdrop-filter que el compositor rehace en
            CADA frame del canvas — y el canvas repinta ~30 veces por segundo
            en toda la web, así que estas bandas son coste permanente, no
            ocasional. Lo caro de un backdrop-filter no son sus píxeles (son
            40px de alto) sino el readback y la capa extra por div, de modo
            que el ahorro va con el NÚMERO de capas: 6 → 4. Sobre 2.5rem, dos
            escalones de desenfoque siguen leyéndose como un degradado. */}
        {/* strength recalibrado al bajar de 3 capas a 2 (1.5→2 y 1.4→1.87):
            el desenfoque de la capa más externa es 0.0625·(divCount+1)·strength
            rem, así que sin tocarlo el borde habría quedado MENOS difuminado
            que antes. Con estos valores el máximo sigue siendo exactamente el
            mismo (0.375rem arriba, 0.35rem abajo) y lo único que cambia es que
            se llega a él en dos escalones en vez de tres. */}
        <GradualBlur position="top" height="2.5rem" strength={2} divCount={2} />
        <GradualBlur position="bottom" height="2.5rem" strength={1.87} divCount={2} />
        <Header />
        {children}
      </body>
    </html>
  );
}
