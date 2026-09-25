/**
 * Word lid — membership intake
 *
 * Static sibling under `club/` that beats the `club/[slug]` CMS catch-all.
 * The structured membership-signup entry point, reached from the "Word lid"
 * CTAs. The CMS "Praktische Informatie" page (`/club/praktische-informatie`) stays as the
 * practical-info hub. The page is static; the form POSTs to `/api/membership`.
 */

import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { PageContainer } from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { MembershipForm } from "@/components/club/MembershipForm/MembershipForm";

export const metadata = buildPageMetadata({
  title: "Word lid",
  description:
    "Schrijf je in bij KCVV Elewijt — als speler, jeugdspeler, vrijwilliger, trainer of scheidsrechter. Vul het inschrijfformulier in en we nemen contact met je op.",
  path: "/club/word-lid",
  ogTitle: "Word lid van KCVV Elewijt",
  ogDescription:
    "Schrijf je in bij KCVV Elewijt — speler, jeugd, vrijwilliger, trainer of scheidsrechter.",
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
});

export default function WordLidPage() {
  return (
    <div className="bg-cream pb-12 lg:pb-16">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "De club", url: `${SITE_CONFIG.siteUrl}/club` },
          { name: "Word lid", url: `${SITE_CONFIG.siteUrl}/club/word-lid` },
        ])}
      />
      <PageContainer width="prose">
        <PageHero
          register="minimal"
          kicker="Sluit je aan"
          headline="Doe mee"
          accent="mee"
          lead="Speler, jeugdspeler, vrijwilliger, trainer of scheidsrechter — vul het formulier in en we nemen binnenkort contact met je op. Dit is een aanvraag: sommige ploegen zitten vol, dus een plekje is niet altijd gegarandeerd."
          upLink={{ href: "/club", label: "De club" }}
        >
          <p className="text-body-md mt-4">
            <Link href="/club/praktische-informatie" className="prose-link">
              Praktische info →
            </Link>
          </p>
          <p className="text-body-md mt-2">
            <a
              href="/downloads/intern-reglement-jeugd-2026.pdf"
              className="prose-link"
            >
              Intern reglement jeugd (pdf) →
            </a>
          </p>
        </PageHero>

        <MembershipForm />
      </PageContainer>
    </div>
  );
}
