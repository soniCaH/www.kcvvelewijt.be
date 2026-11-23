/**
 * Word lid — membership intake
 *
 * Static sibling under `club/` that beats the `club/[slug]` CMS catch-all.
 * The structured membership-signup entry point, reached from the "Word lid"
 * CTAs. The CMS "Praktische Informatie" page (`/club/praktische-informatie`) stays as the
 * practical-info hub. The page is static (ISR, hourly); it reads who holds each
 * role's contact box so the confirmation card can name them (#3640). The form
 * POSTs to `/api/membership`.
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { degradeSection } from "@/lib/effect/degrade";
import {
  FormRoutingRepository,
  FormRoutingRepositoryLive,
  type MembershipContacts,
} from "@/lib/repositories/form-routing.repository";

import { SITE_CONFIG, INTERN_REGLEMENT_JEUGD_PDF } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { EditorialLink, PageContainer } from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { MembershipForm } from "@/components/club/MembershipForm/MembershipForm";

export const metadata = buildPageMetadata({
  title: "Word lid",
  description:
    "Laat je interesse weten bij KCVV Elewijt — als speler, jeugdspeler, vrijwilliger, trainer of scheidsrechter. Vul het formulier in en we nemen contact met je op.",
  path: "/club/word-lid",
  ogTitle: "Word lid van KCVV Elewijt",
  ogDescription:
    "Laat je interesse weten bij KCVV Elewijt — speler, jeugd, vrijwilliger, trainer of scheidsrechter.",
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

// An editor's change to a contact box reaches the card within the hour.
export const revalidate = 3600;

/**
 * The contacts are a section of the page, not its subject: a failed read
 * degrades to no contacts, which the card renders as today's generic sentence,
 * and never blocks the form (#2433 rule 3).
 *
 * The outer try/catch covers `AppLayer` construction failing, which happens
 * outside the effect `degradeSection` wraps (same as `/jeugd`).
 */
async function fetchContacts(): Promise<MembershipContacts> {
  try {
    return await runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* FormRoutingRepository;
          return yield* repo.getContacts();
        }).pipe(Effect.provide(FormRoutingRepositoryLive)),
        {},
        "[word-lid] contact-box lookup failed; the card keeps the generic sentence.",
      ),
    );
  } catch (error) {
    console.error("[word-lid] contact-box lookup failed:", error);
    return {};
  }
}

export default async function WordLidPage() {
  const contacts = await fetchContacts();

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
          image="/images/word-lid-trainer.jpg"
          kicker="Sluit je aan"
          headline="Doe mee"
          accent="mee"
          lead="Speler, jeugdspeler, vrijwilliger, trainer of scheidsrechter — vul het formulier in en we nemen binnenkort contact met je op. Dit is een aanvraag: sommige ploegen zitten vol, dus een plekje is niet altijd gegarandeerd."
          upLink={{ href: "/club", label: "De club" }}
        >
          <p className="mt-4">
            <EditorialLink href="/club/praktische-informatie">
              Praktische info
            </EditorialLink>
          </p>
          <p className="text-body-md mt-2">
            <a href={INTERN_REGLEMENT_JEUGD_PDF} className="prose-link">
              Intern reglement jeugd (pdf)
            </a>
          </p>
        </PageHero>

        {/* The cream band owns no bottom margin (unlike \`register="minimal"\`'s
            baked-in \`mb-10\`) — same gap /kalender puts under its hero. */}
        <div className="mt-10">
          <MembershipForm contacts={contacts} />
        </div>
      </PageContainer>
    </div>
  );
}
