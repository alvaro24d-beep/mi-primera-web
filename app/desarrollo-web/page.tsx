import type { Metadata } from "next";
import DesarrolloWebHero from "@/components/DesarrolloWebHero";
import ProcesoReel from "@/components/ProcesoReel";
import CapacidadesWeb from "@/components/CapacidadesWeb";
import Tech from "@/components/Tech";
import Contacto from "@/components/Contacto";

export const metadata: Metadata = {
  title: "Desarrollo web — Nexora",
  description:
    "Webs a medida que convierten: diseño, frontend, backend y rendimiento construidos capa a capa por Nexora.",
};

export default function DesarrolloWebPage() {
  return (
    <>
      <DesarrolloWebHero />
      <ProcesoReel />
      <CapacidadesWeb />
      <Tech />
      <Contacto />
    </>
  );
}
