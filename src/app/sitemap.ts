import type { MetadataRoute } from "next";
import { getAllContentPaths, getContentTypes } from "@/lib/content";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listPaths = getContentTypes(routing.defaultLocale).map((contentType) => `/${contentType}`);
  const legalPaths = ["/privacy-policy", "/terms-of-service", "/copyright", "/about"];
  const staticPaths = ["/", ...listPaths, ...legalPaths];

  // Dynamic paths: scan actual MDX content files
  const contentPaths = await getAllContentPaths("en");
  const dynamicPaths = contentPaths.map((item) => `/${[item.contentType, ...item.slug].join("/")}`);

  const paths = Array.from(new Set([...staticPaths, ...dynamicPaths]));

  return routing.locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${SITE_URL}${locale === routing.defaultLocale ? "" : `/${locale}`}${path === "/" ? "" : path}`,
      lastModified: new Date(),
      changeFrequency: path === "/" ? ("daily" as const) : ("weekly" as const),
      priority: path === "/" ? 1 : listPaths.includes(path) ? 0.8 : legalPaths.includes(path) ? 0.3 : 0.6,
    })),
  );
}
