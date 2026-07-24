import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond, Rajdhani, Space_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import SceneCanvasLazy from "@/components/scene/SceneCanvasLazy";
import RevealInit from "@/components/RevealInit";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollProgress from "@/components/ScrollProgress";
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
  title: "Nexora — Agencia de software & inteligencia artificial",
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
        {/* Deriva global de contenido con el cursor (vars CSS en :root; la
            lista curada de contenedores vive en globals.css). */}
        <CursorDrift />
        {/* WebGL backdrop deferred off the load's critical path — see
            SceneCanvasLazy (dynamic import + idle mount + fade-in). La estela
            de humo fluido del cursor vive DENTRO de esa escena
            (components/scene/FluidTrailLayer.tsx). */}
        <SceneCanvasLazy />
        <RevealInit />
        {/* Fixed to the viewport (`target="page"`), sitting above page content
            but below Header/the floating nav (z-index 9998/9999) — content
            scrolling underneath fades/blurs progressively instead of being
            clipped abruptly by that fixed chrome. */}
        {/* divCount 3 (component default is 5): each div is a full-width
            backdrop-filter layer the compositor re-blurs on EVERY canvas
            frame — 10 permanent blur passes total were a measurable
            steady-state GPU cost. 3 bands across 2.5rem are visually
            indistinguishable from 5. */}
        <GradualBlur position="top" height="2.5rem" strength={1.5} divCount={3} target="page" />
        <GradualBlur position="bottom" height="2.5rem" strength={1.4} divCount={3} target="page" />
        <Header />
        {children}
      </body>
    </html>
  );
}
