import type { Metadata } from "next";
import AgentesIaHero from "@/components/AgentesIaHero";
import AgentesIaCasos from "@/components/AgentesIaCasos";
import Contacto from "@/components/Contacto";

export const metadata: Metadata = {
  title: "Agentes IA — Nexora",
  description:
    "Agentes de inteligencia artificial que atienden, reservan y resuelven por ti, 24/7: conectados a tu agenda, CRM y WhatsApp.",
};

export default function AgentesIaPage() {
  return (
    <>
      <AgentesIaHero />
      <AgentesIaCasos />
      <Contacto />
    </>
  );
}
