import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { HistoryContent } from "./HistoryContent";

export const metadata = buildPageMetadata({
  title: "Geschiedenis",
  description:
    "Tijdslijn van de rijkgevulde geschiedenis van KCVV Elewijt van 1909 tot nu!",
  path: "/club/geschiedenis",
  ogTitle: "Geschiedenis - KCVV Elewijt",
  keywords: [
    "geschiedenis",
    "history",
    "KCVV Elewijt",
    "tijdslijn",
    "Crossing Elewijt",
  ],
});

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
