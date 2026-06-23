/**
 * Word lid — membership intake
 *
 * Static sibling under `club/` that beats the `club/[slug]` CMS catch-all.
 * The structured membership-signup entry point, reached from the "Word lid"
 * CTAs. The CMS "Praktische Informatie" page (`/club/praktische-informatie`) stays as the
 * practical-info hub. The page is static; the form POSTs to `/api/membership`.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { EditorialHeading, PageContainer } from "@/components/design-system";
import { MembershipForm } from "@/components/club/MembershipForm/MembershipForm";

export const metadata: Metadata = {
  title: "Word lid | KCVV Elewijt",
  description:
    "Schrijf je in bij KCVV Elewijt — als speler, jeugdspeler, vrijwilliger, trainer of scheidsrechter. Vul het inschrijfformulier in en we nemen contact met je op.",
  keywords: [
    "word lid",
    "inschrijven",
    "lid worden",
    "KCVV Elewijt",
    "speler",
    "jeugd",
    "vrijwilliger",
    "Elewijt",
  ],
  alternates: { canonical: `${SITE_CONFIG.siteUrl}/club/word-lid` },
  openGraph: {
    title: "Word lid van KCVV Elewijt",
    description:
      "Schrijf je in bij KCVV Elewijt — speler, jeugd, vrijwilliger, trainer of scheidsrechter.",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function WordLidPage() {
  return (
    <div className="bg-cream py-16 md:py-20">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Club", url: `${SITE_CONFIG.siteUrl}/club` },
          { name: "Word lid", url: `${SITE_CONFIG.siteUrl}/club/word-lid` },
        ])}
      />
      <PageContainer width="prose">
        <header className="mb-10 flex flex-col">
          <span className="text-jersey-deep font-mono text-[length:var(--text-label)] font-semibold tracking-[var(--text-label--tracking)] uppercase">
            Sluit je aan
          </span>
          <EditorialHeading
            level={1}
            size="display-xl"
            emphasis={{ text: "compagnie." }}
            className="mt-3 mb-0 break-words hyphens-auto"
          >
            Er is maar één plezante
          </EditorialHeading>
          <p className="text-ink-soft font-display mt-5 max-w-[60ch] text-[length:var(--text-body-lg)] leading-[var(--text-body-lg--lh)]">
            Speler, jeugdspeler, vrijwilliger, trainer of scheidsrechter — vul
            het formulier in en we nemen binnenkort contact met je op. Dit is
            een aanvraag: sommige ploegen zitten vol, dus een plekje is niet
            altijd gegarandeerd.
          </p>
          <p className="mt-4 text-[length:var(--text-body-md)]">
            <Link href="/club/praktische-informatie" className="prose-link">
              Praktische info →
            </Link>
          </p>
        </header>

        <MembershipForm />
      </PageContainer>
    </div>
  );
}
