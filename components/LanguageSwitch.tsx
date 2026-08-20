"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, LOCALE_LABEL, type Locale } from "@/i18n/routing";

/**
 * Conmutador ES / EN.
 *
 * Navega a la MISMA ruta en el otro idioma, no a la portada: `usePathname` de
 * i18n/navigation devuelve la ruta ya sin el prefijo de idioma, así que
 * `router.replace(ruta, { locale })` reconstruye la dirección equivalente
 * —de /precios a /en/precios y al revés— y quien esté leyendo una página
 * concreta se queda en ella.
 *
 * `replace` y no `push`: cambiar de idioma no es avanzar en la navegación,
 * es ver lo mismo de otra forma. Con `push`, el botón "atrás" del navegador
 * devolvería al idioma anterior en vez de a la página anterior de verdad.
 *
 * next-intl guarda la elección en una cookie, así que la siguiente visita
 * entra directamente en el idioma escogido en lugar de volver a decidir por
 * la cabecera del navegador.
 */
export default function LanguageSwitch() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("idioma");
  // El cambio de idioma reconstruye la página en el servidor. Sin marcarlo
  // como transición, el botón se queda mudo ese rato y parece que no ha
  // funcionado; con `isPending` se puede atenuar mientras llega.
  const [isPending, startTransition] = useTransition();

  const otro: Locale = locale === "es" ? "en" : "es";

  return (
    <button
      type="button"
      className="nxr-lang"
      onClick={() => {
        startTransition(() => {
          router.replace(pathname, { locale: otro });
        });
      }}
      // El aria-label nombra el idioma DE DESTINO: para un lector de pantalla,
      // "ES / EN" a secas no dice qué va a pasar al pulsar.
      aria-label={`${t("cambiar")}: ${t(otro)}`}
      lang={otro}
      data-pending={isPending ? "" : undefined}
    >
      {routing.locales.map((l) => (
        <span key={l} className="nxr-lang-op" data-on={l === locale ? "" : undefined} aria-hidden="true">
          {LOCALE_LABEL[l]}
        </span>
      ))}
    </button>
  );
}
