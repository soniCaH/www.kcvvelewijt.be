/**
 * Contact Page
 * Club contact information and categorized email contacts
 */

import type { Metadata } from "next";
import { Effect } from "effect";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { runPromise } from "@/lib/effect/runtime";
import { StaffRepository } from "@/lib/repositories/staff.repository";
import { ContactPage } from "@/components/club/ContactPage/ContactPage";
import { FooterSafeArea } from "@/components/design-system";

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
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function ContactPageRoute() {
  const keyContacts = await runPromise(
    Effect.gen(function* () {
      const repo = yield* StaffRepository;
      return yield* repo.findKeyContacts();
    }),
  );

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Club", url: `${SITE_CONFIG.siteUrl}/club` },
          { name: "Contact", url: `${SITE_CONFIG.siteUrl}/club/contact` },
        ])}
      />
      <ContactPage keyContacts={keyContacts} />
      <FooterSafeArea />
    </>
  );
}
