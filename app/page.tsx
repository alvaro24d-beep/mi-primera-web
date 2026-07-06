import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Intro from "@/components/Intro";
import Servicios from "@/components/Servicios";
import ZoomParallax from "@/components/ZoomParallax";
import Proceso from "@/components/Proceso";
import Tech from "@/components/Tech";
import Contacto from "@/components/Contacto";

export default function Home() {
  return (
    <>
      <Header />
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
