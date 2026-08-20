import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Sustitutos de `next/link` y `useRouter` que conocen el idioma activo: al
 * navegar mantienen el locale actual sin que cada enlace tenga que añadir el
 * prefijo a mano. Los componentes que enlazan entre páginas deben importar
 * estos y NO los de `next/navigation`, o el enlace saltaría al español.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
