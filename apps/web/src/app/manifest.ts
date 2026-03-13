import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KCVV Elewijt",
    short_name: "KCVV",
    description:
      "KCVV Elewijt voetbalclub met stamnummer 55 - Er is maar één plezante compagnie",
    start_url: "/",
    display: "standalone",
    background_color: BRAND.backgroundColor,
    theme_color: BRAND.primaryColor,
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
