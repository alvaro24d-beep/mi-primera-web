import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * OJO AL NOMBRE DEL ARCHIVO: en Next 16 esto se llama `proxy.ts`. Hasta Next
 * 15 era `middleware.ts`, que es como sigue apareciendo en casi toda la
 * documentación de terceros; con el nombre viejo, Next no lo ejecuta y el
 * ruteo por idioma deja de funcionar sin dar ningún error.
 *
 * Hace dos cosas: detectar el idioma preferido del navegador (cabecera
 * Accept-Language) en la primera visita, y —con `localePrefix: "as-needed"`—
 * reescribir internamente las rutas españolas sin prefijo (/precios) a la
 * ruta real del App Router (/es/precios). Esa reescritura es lo que permite
 * que las URLs de siempre sigan funcionando tal cual.
 */
export default createMiddleware(routing);

export const config = {
  /**
   * Todo menos lo que no es una página: los bundles (`_next`), `_vercel`, la
   * API y cualquier ruta con punto, que son los archivos de public/ (los
   * vídeos del muro, gear-points.bin, los favicons). Reescribir un .mp4 a
   * /es/algo.mp4 lo rompería.
   *
   * CUIDADO CON LA BARRA DOBLE de `\\.`: esto es un string de TypeScript, así
   * que `\\.` es lo que le llega a la regex como punto literal. Escrito con
   * una sola barra, JS lo colapsa a `.` —"cualquier carácter"— y el grupo pasa
   * a excluir toda ruta que tenga algún carácter, es decir, todas menos la
   * raíz: el proxy deja de ejecutarse y cada página española sin prefijo
   * responde 404 mientras la portada sigue funcionando. Pasó exactamente eso
   * al montar esto, y el síntoma (solo "/" bien) no apunta al matcher en
   * absoluto.
   */
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
