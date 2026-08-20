import Hero from "@/components/Hero";
import Intro from "@/components/Intro";
import Servicios from "@/components/Servicios";
import ZoomParallax from "@/components/ZoomParallax";
import Proceso from "@/components/Proceso";
import Tech from "@/components/Tech";
import Contacto from "@/components/Contacto";
import { setRequestLocale } from "next-intl/server";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  // Mantiene la página PRERENDERIZADA (ver la nota larga en el layout).
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Intro />
      <Servicios />
      <ZoomParallax />
      <Proceso />
      <Tech />
      <Contacto />
    </>
  );
}
