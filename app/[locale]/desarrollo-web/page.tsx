import type { Metadata } from "next";
import DesarrolloWebHero from "@/components/DesarrolloWebHero";
import ProcesoReel from "@/components/ProcesoReel";
import CapacidadesWeb from "@/components/CapacidadesWeb";
import DwhAeo from "@/components/DwhAeo";
import DwhTechStack from "@/components/DwhTechStack";
import DwhIncluido from "@/components/DwhIncluido";
import Contacto from "@/components/Contacto";
import ClickSpark from "@/components/ClickSpark";
import { setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Desarrollo web — arcfine",
  description:
    "Webs a medida que convierten: diseño, frontend, backend y rendimiento construidos capa a capa por arcfine.",
};

export default async function DesarrolloWebPage({ params }: { params: Promise<{ locale: string }> }) {
  // Mantiene la página PRERENDERIZADA (ver la nota larga en el layout).
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    // ClickSpark (React Bits, adapted): lime spark bursts on click/tap,
    // page-scoped. Renders no wrapper element (fragment + fixed canvas), so
    // the GSAP pins inside the sections are unaffected.
    <ClickSpark sparkColor="#A8F04A" sparkSize={11} sparkRadius={22} sparkCount={8} duration={480}>
      <DesarrolloWebHero />
      <ProcesoReel />
      <CapacidadesWeb />
      <DwhAeo />
      <DwhTechStack />
      <DwhIncluido />
      <Contacto />
    </ClickSpark>
  );
}
