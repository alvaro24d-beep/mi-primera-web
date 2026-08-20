import type { Metadata } from "next";
import PreciosFaq from "@/components/PreciosFaq";
import Contacto from "@/components/Contacto";
import { setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Precios — arcfine",
  description:
    "Cómo trabajamos el presupuesto en arcfine: propuesta cerrada a medida, entregas de 4 a 8 semanas, clientes internacionales y pago 50/50 (inicio y entrega).",
};

export default async function PreciosPage({ params }: { params: Promise<{ locale: string }> }) {
  // Mantiene la página PRERENDERIZADA (ver la nota larga en el layout).
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PreciosFaq />
      <Contacto />
    </>
  );
}
