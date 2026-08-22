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
 *
 * arcfine.COM, no .es (V18.65). El .es nunca llegó a registrarse —los
 * servidores autoritativos de `.es` devuelven NXDOMAIN— y aun así era el valor
 * de reserva, así que producción llevaba publicándose entera con el canonical,
 * los hreflang y el sitemap apuntando a un dominio inexistente. Como esto es la
 * RESERVA, basta con que sea correcta: no hace falta definir
 * NEXT_PUBLIC_SITE_URL en el hosting para que producción quede bien.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://arcfine.com";
