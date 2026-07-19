import type { Metadata } from "next";
import PreciosFaq from "@/components/PreciosFaq";
import Contacto from "@/components/Contacto";

export const metadata: Metadata = {
  title: "Precios — Nexora",
  description:
    "Cómo trabajamos el presupuesto en Nexora: propuesta cerrada a medida, entregas de 4 a 8 semanas, clientes internacionales y pago 50/50 (inicio y entrega).",
};

export default function PreciosPage() {
  return (
    <>
      <PreciosFaq />
      <Contacto />
    </>
  );
}
