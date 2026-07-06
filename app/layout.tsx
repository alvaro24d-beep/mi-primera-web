import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import ThreeBackground from "@/components/ThreeBackground";
import WaveBackground from "@/components/WaveBackground";
import RevealInit from "@/components/RevealInit";
import SmoothScroll from "@/components/SmoothScroll";

const manrope = Manrope({
  variable: "--font-primary",
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
    <html lang="es" className={manrope.variable}>
      <body suppressHydrationWarning>
        <SmoothScroll />
        <WaveBackground />
        <ThreeBackground />
        <RevealInit />
        {children}
      </body>
    </html>
  );
}
