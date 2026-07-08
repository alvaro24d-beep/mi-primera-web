import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import WaveBackground from "@/components/WaveBackground";
import RevealInit from "@/components/RevealInit";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollProgress from "@/components/ScrollProgress";
import PageTransition from "@/components/PageTransition";

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
        <WaveBackground />
        <RevealInit />
        <Header />
        {/* `key`-ed on the route so every navigation (and the first load) replays
            the blur-in — see PageTransition.tsx. Header is deliberately OUTSIDE
            this wrapper: `filter` on an ancestor makes descendant
            `position: fixed` elements anchor to that ancestor instead of the
            viewport (same rule that governs backdrop-filter/glass elsewhere in
            this codebase), which would briefly misplace the fixed header/nav. */}
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
