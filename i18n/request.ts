import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * Carga el diccionario del idioma pedido en cada petición.
 *
 * `hasLocale` valida contra la lista de routing antes de usar el valor: el
 * segmento viene de la URL, así que es entrada del usuario y no puede acabar
 * en un `import()` sin comprobar. Si no cuadra, se cae al idioma por defecto
 * en lugar de reventar.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
