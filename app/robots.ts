import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Apunta al sitemap para que los buscadores encuentren AMBOS idiomas. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
