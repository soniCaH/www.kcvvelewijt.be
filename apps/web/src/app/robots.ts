import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/lib/constants";
import { readOptionalServerEnv } from "@/lib/env/server";

const robots = (): MetadataRoute.Robots => {
  const isProduction = readOptionalServerEnv().VERCEL_ENV === "production";

  return {
    rules: {
      userAgent: "*",
      ...(isProduction
        ? {
            allow: ["/", "/llms.txt"],
            // Opponent pages are noindex and not in the sitemap; this stops crawlers spending PSD calls there (#3622).
            disallow: ["/tegenstander/"],
          }
        : { disallow: "/" }),
    },
    sitemap: `${SITE_CONFIG.siteUrl}/sitemap.xml`,
  };
};

export default robots;
