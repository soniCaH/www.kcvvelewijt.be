import type { Metadata } from "next";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { HistoryContent } from "./HistoryContent";

export const metadata: Metadata = {
  title: "Geschiedenis | KCVV Elewijt",
  description:
    "Tijdslijn van de rijkgevulde geschiedenis van KCVV Elewijt van 1909 tot nu!",
  keywords: [
    "geschiedenis",
    "history",
    "KCVV Elewijt",
    "tijdslijn",
    "Crossing Elewijt",
  ],
  openGraph: {
    title: "Geschiedenis - KCVV Elewijt",
    description:
      "Tijdslijn van de rijkgevulde geschiedenis van KCVV Elewijt van 1909 tot nu!",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function HistoryPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Club", url: `${SITE_CONFIG.siteUrl}/club` },
          {
            name: "Geschiedenis",
            url: `${SITE_CONFIG.siteUrl}/club/geschiedenis`,
          },
        ])}
      />
      <HistoryContent />
    </>
  );
}
