import type { MetadataRoute } from "next";
import { routing, HREFLANG } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

/**
 * Rutas reales del sitio, sin prefijo de idioma.
 *
 * Se listan a mano y no se derivan del sistema de archivos a propósito: en
 * app/ hay rutas que NO deben indexarse (la API) y enlaces del menú que aún
 * no existen. Un sitemap que promete URLs que devuelven 404 le cuesta
 * credibilidad al dominio, así que aquí solo va lo que está construido.
 */
const RUTAS = ["", "/desarrollo-web", "/agentes-ia", "/automatizaciones", "/seo", "/precios", "/contacto"];

/**
 * Un sitemap con las dos versiones de cada página y sus `alternates`, que es
 * la forma que Google recomienda para sitios multiidioma: cada entrada declara
 * dónde están sus hermanas, de modo que el buscador entiende que son la misma
 * página traducida y no contenido duplicado.
 *
 * Con `localePrefix: "as-needed"` el español va sin prefijo y el inglés con
 * él — de ahí el `url()` de abajo en lugar de concatenar el locale siempre.
 */
const url = (locale: string, ruta: string) =>
  locale === routing.defaultLocale ? `${SITE_URL}${ruta}` : `${SITE_URL}/${locale}${ruta}`;

export default function sitemap(): MetadataRoute.Sitemap {
  return RUTAS.flatMap((ruta) =>
    routing.locales.map((locale) => ({
      url: url(locale, ruta),
      lastModified: new Date(),
      // La portada por encima del resto; lo demás, al mismo nivel.
      priority: ruta === "" ? 1 : 0.8,
      alternates: {
        languages: {
          [HREFLANG.es]: url("es", ruta),
          [HREFLANG.en]: url("en", ruta),
        },
      },
    }))
  );
}
