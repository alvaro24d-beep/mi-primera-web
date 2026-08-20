import type { Metadata } from "next";
import SeoHero from "@/components/seo/SeoHero";
import SeoResultados from "@/components/seo/SeoResultados";
import Contacto from "@/components/Contacto";
import ClickSpark from "@/components/ClickSpark";
import { setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "SEO y posicionamiento — arcfine",
  description:
    "Posicionamos tu negocio en los primeros resultados de Google: auditoría, optimización técnica y autoridad que se traducen en clientes.",
};

export default async function SeoPage({ params }: { params: Promise<{ locale: string }> }) {
  // Mantiene la página PRERENDERIZADA (ver la nota larga en el layout).
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    // Mismo remate interactivo que /desarrollo-web: chispas lima al click,
    // sin wrapper que afecte a los pins.
    <ClickSpark sparkColor="#A8F04A" sparkSize={11} sparkRadius={22} sparkCount={8} duration={480}>
      <SeoHero />
      <SeoResultados />
      <Contacto />
    </ClickSpark>
  );
}
