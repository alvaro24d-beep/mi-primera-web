import type { Metadata } from "next";
import DesarrolloWebHero from "@/components/DesarrolloWebHero";
import ProcesoReel from "@/components/ProcesoReel";
import CapacidadesWeb from "@/components/CapacidadesWeb";
import DwhClaims from "@/components/DwhClaims";
import DwhTechStack from "@/components/DwhTechStack";
import Contacto from "@/components/Contacto";
import ClickSpark from "@/components/ClickSpark";

export const metadata: Metadata = {
  title: "Desarrollo web — Nexora",
  description:
    "Webs a medida que convierten: diseño, frontend, backend y rendimiento construidos capa a capa por Nexora.",
};

export default function DesarrolloWebPage() {
  return (
    // ClickSpark (React Bits, adapted): lime spark bursts on click/tap,
    // page-scoped. Renders no wrapper element (fragment + fixed canvas), so
    // the GSAP pins inside the sections are unaffected.
    <ClickSpark sparkColor="#A8F04A" sparkSize={11} sparkRadius={22} sparkCount={8} duration={480}>
      <DesarrolloWebHero />
      <ProcesoReel />
      <CapacidadesWeb />
      <DwhClaims />
      <DwhTechStack />
      <Contacto />
    </ClickSpark>
  );
}
