import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === "production";

  return {
    rules: {
      userAgent: "*",
      ...(isProduction ? { allow: ["/", "/llms.txt"] } : { disallow: "/" }),
    },
    sitemap: `${SITE_CONFIG.siteUrl}/sitemap.xml`,
  };
}
