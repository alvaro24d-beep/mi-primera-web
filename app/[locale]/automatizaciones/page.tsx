import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, HREFLANG } from "@/i18n/routing";
import AutoHero from "@/components/auto/AutoHero";
import AutoAhorro from "@/components/auto/AutoAhorro";
import AutoCasos from "@/components/auto/AutoCasos";
import AutoConecta from "@/components/auto/AutoConecta";
import AutoPasos from "@/components/auto/AutoPasos";
import Contacto from "@/components/Contacto";
import ClickSpark from "@/components/ClickSpark";

const RUTA = "/automatizaciones";

/**
 * Metadata POR IDIOMA, no fija.
 *
 * El resto de páginas de servicio todavía declaran un `metadata` constante en
 * español, de cuando el sitio era monolingüe; esta nace ya con las dos
 * versiones y sus `alternates`, que es lo que le dice a Google que /es y /en
 * son la misma página traducida y no contenido duplicado. Cuando les toque el
 * turno a las otras, este es el patrón a copiar.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auto.meta" });

  return {
    title: t("titulo"),
    description: t("descripcion"),
    alternates: {
      canonical: locale === routing.defaultLocale ? RUTA : `/${locale}${RUTA}`,
      languages: {
        [HREFLANG.es]: RUTA,
        [HREFLANG.en]: `/en${RUTA}`,
        "x-default": RUTA,
      },
    },
  };
}

export default async function AutomatizacionesPage({ params }: { params: Promise<{ locale: string }> }) {
  // Mantiene la página PRERENDERIZADA (ver la nota larga en el layout).
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    // Mismo remate interactivo que /desarrollo-web y /seo: chispas lima al
    // click, sin wrapper que afecte a los pins.
    <ClickSpark sparkColor="#A8F04A" sparkSize={11} sparkRadius={22} sparkCount={8} duration={480}>
      <AutoHero />
      <AutoAhorro />
      <AutoCasos />
      <AutoConecta />
      <AutoPasos />
      <Contacto />
    </ClickSpark>
  );
}
