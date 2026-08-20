import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * El plugin de next-intl necesita saber dónde está la config de petición.
 * Se le pasa explícitamente porque la ruta por defecto que busca es
 * `./i18n/request.ts` desde src/ o desde la raíz — aquí no hay src/, así
 * que apuntarlo evita depender de esa convención.
 */
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
