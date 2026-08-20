import type { Metadata } from "next";
import Contacto from "@/components/Contacto";
import { setRequestLocale } from "next-intl/server";

// Página de contacto dedicada (V16.88): SOLO el formulario — la misma
// sección Contacto (multi-step + Resend) reutilizada tal cual, como manda
// AGENTS.md. El CTA "Empezar proyecto" del hero de la home ya apuntaba a
// /contacto (era una de las rutas 404 pendientes); con esta página deja de
// serlo. `nxr-contacto` ya está en la lista alwaysIds de SceneCanvas, así
// que sus paneles de cristal funcionan aquí igual que embebida.

export const metadata: Metadata = {
  title: "Contacto — arcfine",
  description:
    "Cuéntanos tu proyecto: respuesta en menos de 24h, primera conversación gratuita y sin compromiso, propuesta detallada en 48h.",
};

export default async function ContactoPage({ params }: { params: Promise<{ locale: string }> }) {
  // Mantiene la página PRERENDERIZADA (ver la nota larga en el layout).
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="nxr-contacto-page">
      <Contacto />
    </main>
  );
}
