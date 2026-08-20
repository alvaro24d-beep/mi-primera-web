/**
 * Dominio público del sitio, en un solo sitio.
 *
 * Lo necesitan el `metadataBase` de la metadata (que convierte los canonical y
 * los hreflang relativos en absolutos — Google los quiere absolutos) y el
 * sitemap. Sale de una variable de entorno para que las previsualizaciones no
 * se anuncien a sí mismas como si fueran producción, con caída al dominio real
 * cuando no está definida.
 *
 * OJO: si el dominio definitivo no es este, cámbialo aquí y en la variable
 * NEXT_PUBLIC_SITE_URL del hosting — un canonical apuntando a un dominio que
 * no es el tuyo le dice a Google que indexe el otro.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://arcfine.es";
