import type { Metadata } from "next";
import AgentesIaHero from "@/components/AgentesIaHero";
import AgentesIaNoche from "@/components/AgentesIaNoche";
import AgentesIaCasos from "@/components/AgentesIaCasos";
import AgentesIaPasos from "@/components/AgentesIaPasos";
import Contacto from "@/components/Contacto";
import { setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Agentes IA — arcfine",
  description:
    "Agentes de inteligencia artificial que atienden, reservan y resuelven por ti, 24/7: conectados a tu agenda, CRM y WhatsApp.",
};

export default async function AgentesIaPage({ params }: { params: Promise<{ locale: string }> }) {
  // Mantiene la página PRERENDERIZADA (ver la nota larga en el layout).
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <AgentesIaHero />
      <AgentesIaNoche />
      <AgentesIaCasos />
      <AgentesIaPasos />
      <Contacto />
    </>
  );
}
