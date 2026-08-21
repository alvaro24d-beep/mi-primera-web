import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Pie de página, montado una vez en el layout.
 *
 * SERVER COMPONENT a propósito (no lleva "use client"): es contenido estático
 * —enlaces y un par de líneas de texto— y así no suma ni un byte de JavaScript
 * al cliente en un sitio que ya carga una escena WebGL. El año del copyright se
 * resuelve al construir, que es exactamente lo que se quiere: se actualiza en
 * cada despliegue y no obliga a la página a renderizarse a demanda.
 *
 * SOLO SE ENLAZA LO QUE EXISTE. De los cinco servicios, únicamente tres tienen
 * página construida (/desarrollo-web, /agentes-ia y /seo); automatizaciones y
 * apps-software devuelven 404 hoy. El menú de la cabecera sí los enlaza —es un
 * problema conocido, anterior a esto— pero aquí no se repite: un pie lleno de
 * enlaces rotos es de las cosas que más rápido restan credibilidad, y encima
 * los rastreadores lo siguen entero en todas las páginas. Cuando esas dos
 * páginas existan, se añaden a SERVICIOS de abajo.
 */
const SERVICIOS = [
  { href: "/desarrollo-web", clave: "web" },
  { href: "/agentes-ia", clave: "ia" },
  { href: "/seo", clave: "seo" },
] as const;

const SITIO = [
  { href: "/", clave: "inicio" },
  { href: "/precios", clave: "precios" },
  { href: "/contacto", clave: "contacto" },
] as const;

export default async function Footer() {
  const t = await getTranslations("footer");
  const tSrv = await getTranslations("servicios.menu");
  const tNav = await getTranslations("nav");
  const anio = new Date().getFullYear();

  return (
    <footer className="nxr-footer">
      <div className="nxr-footer-inner">
        <div className="nxr-footer-top">
          <div className="nxr-footer-marca">
            <Link href="/" className="nxr-footer-logo">
              arcfine<span>.</span>
            </Link>
            <p className="nxr-footer-tagline">{t("tagline")}</p>
          </div>

          <nav className="nxr-footer-cols" aria-label={t("nav")}>
            <div className="nxr-footer-col">
              <h2 className="nxr-footer-col-t">{t("servicios")}</h2>
              <ul>
                {SERVICIOS.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href}>{tSrv(`${s.clave}.titulo`)}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="nxr-footer-col">
              <h2 className="nxr-footer-col-t">{t("sitio")}</h2>
              <ul>
                {SITIO.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href}>{s.clave === "contacto" ? t("contacto") : tNav(s.clave)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="nxr-footer-cta-wrap">
            <p className="nxr-footer-cta-t">{t("ctaTitulo")}</p>
            <Link href="/contacto" className="nxr-footer-cta">
              {t("ctaBoton")}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="nxr-footer-bottom">
          <span>
            © {anio} arcfine. {t("derechos")}
          </span>
          <span className="nxr-footer-hecho">{t("hecho")}</span>
        </div>
      </div>
    </footer>
  );
}
