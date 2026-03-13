import type { MetadataRoute } from "next";
import { BRAND, SITE_CONFIG } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_CONFIG.title,
    short_name: "KCVV",
    description: SITE_CONFIG.description,
    start_url: "/",
    display: "standalone",
    background_color: BRAND.backgroundColor,
    theme_color: BRAND.primaryColor,
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
