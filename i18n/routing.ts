import { defineRouting } from "next-intl/routing";

/**
 * RUTEO POR IDIOMA — la única fuente de verdad de qué idiomas existen y cómo
 * se ven sus URLs.
 *
 * `localePrefix: "as-needed"` es la decisión importante y es deliberada: el
 * idioma por defecto (español) NO lleva prefijo en la URL y el inglés sí.
 *
 *    español          inglés
 *    /                /en
 *    /desarrollo-web  /en/desarrollo-web
 *    /precios         /en/precios
 *
 * El motivo es de SEO, no de estética: con la alternativa simétrica (/es/ y
 * /en/) TODAS las URLs actuales del sitio se moverían, habría que montar
 * redirecciones 301 de cada una y Google tardaría semanas en reasignar a la
 * nueva dirección la autoridad que ya tiene la vieja. Con "as-needed" no se
 * mueve ni una URL existente: solo se añaden las inglesas al lado.
 */
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

/** Etiqueta visible del conmutador de idioma (ver LanguageSwitch). */
export const LOCALE_LABEL: Record<Locale, string> = {
  es: "ES",
  en: "EN",
};

/**
 * `lang` del <html> y `hreflang` de los alternates. Se separa del código de
 * locale a propósito: la URL usa el código corto (/en) mientras que a los
 * buscadores conviene darles la variante regional, que es más informativa.
 */
export const HREFLANG: Record<Locale, string> = {
  es: "es-ES",
  en: "en-US",
};
