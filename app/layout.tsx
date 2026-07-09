import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import SceneCanvas from "@/components/scene/SceneCanvas";
import RevealInit from "@/components/RevealInit";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollProgress from "@/components/ScrollProgress";
import GradualBlur from "@/components/GradualBlur";

const manrope = Manrope({
  variable: "--font-primary",
  subsets: ["latin"],
});

// Serif used site-wide for headings (see the `h1, h2, h3` rule in globals.css) —
// always regular weight/style; never bold or italic.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: "400",
  style: "normal",
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
    <html lang="es" className={`${manrope.variable} ${cormorant.variable}`}>
      <body suppressHydrationWarning>
        <SmoothScroll />
        <ScrollProgress />
        <SceneCanvas />
        <RevealInit />
        {/* Fixed to the viewport (`target="page"`), sitting above page content
            but below Header/the floating nav (z-index 9998/9999) — content
            scrolling underneath fades/blurs progressively instead of being
            clipped abruptly by that fixed chrome. */}
        <GradualBlur position="top" height="2.5rem" strength={1.5} target="page" />
        <GradualBlur position="bottom" height="2.5rem" strength={1.4} target="page" />
        <Header />
        {children}
      </body>
    </html>
  );
}
