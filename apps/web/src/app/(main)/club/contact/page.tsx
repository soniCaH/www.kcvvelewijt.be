/**
 * Contact Page
 * Club contact information and categorized email contacts
 */

import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { ContactPage } from "@/components/club/ContactPage/ContactPage";

export const metadata: Metadata = {
  title: "Contact | KCVV Elewijt",
  description:
    "Contacteer KCVV Elewijt. Adres: Driesstraat 30, 1982 Elewijt. Vind de juiste contactpersoon voor algemene vragen, jeugdwerking, sponsoring en meer.",
  keywords: [
    "contact",
    "KCVV Elewijt",
    "adres",
    "e-mail",
    "jeugd",
    "sponsoring",
    "Elewijt",
  ],
  openGraph: {
    title: "Contact - KCVV Elewijt",
    description: "Contacteer KCVV Elewijt voor al je vragen",
    type: "website",
  },
};

export default function ContactPageRoute() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Club", url: `${SITE_CONFIG.siteUrl}/club` },
          { name: "Contact", url: `${SITE_CONFIG.siteUrl}/club/contact` },
        ])}
      />
      <ContactPage />
    </>
  );
}
