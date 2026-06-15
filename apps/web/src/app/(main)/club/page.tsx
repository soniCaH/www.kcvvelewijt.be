import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import {
  EditorialHeading,
  FooterSafeArea,
  LinkButton,
  PullQuote,
  StripedSeam,
  TapedCard,
} from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { ClubEditorialHub } from "@/components/club/ClubEditorialHub/ClubEditorialHub";

export const metadata: Metadata = {
  title: "Onze club | KCVV Elewijt",
  description:
    "Alles over KCVV Elewijt: geschiedenis, bestuur, organigram en hoe je kan aansluiten.",
};

/**
 * `/club` index — rebuilt on the retro-terrace-fanzine system (design lock
 * `docs/design/mockups/phase-10-club-index/10c3-locked.html`, #2121). Pure
 * reuse of redesign primitives: `<PageHero>` (typographic) → `<ClubEditorialHub>`
 * (uniform 3-up nav grid) → `<PullQuote>` mission → cream contact CTA band,
 * separated by full-bleed `<StripedSeam>`s. Retires the legacy `<SectionStack>`
 * + `diagonal` `<SectionTransition>` composition (the last `diagonal` consumer,
 * unblocking #1701) and the banned legacy club motto.
 */
export default function ClubPage() {
  return (
    <div className="bg-cream min-h-screen">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Club", url: `${SITE_CONFIG.siteUrl}/club` },
        ])}
      />

      {/* Hero — typographic PageHero (no image). */}
      <div className="mx-auto max-w-5xl px-4 pt-10 pb-12">
        <PageHero
          kicker="Onze club"
          headline="De plezantste compagnie"
          accent="compagnie"
          lead="Sinds 1909 de thuishaven voor voetballiefhebbers in Elewijt — van de allerkleinsten tot het eerste elftal."
        />
      </div>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Editorial nav hub. */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        <ClubEditorialHub />
      </div>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Mission. */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        <PullQuote
          tone="ink"
          attribution={{ name: "Sportpark Elewijt", source: "sinds 1909" }}
        >
          Wij zijn KCVV Elewijt. Een plek waar jong en oud wekelijks samenkomen
          voor hun passie.
        </PullQuote>
      </div>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Contact CTA band. */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        <TapedCard bg="cream" padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              {/* Jersey-deep mono kicker — MonoLabel's plain variant only renders
                  ink/cream, so this is a raw label-token span (matches PageHero). */}
              <span className="text-jersey-deep font-mono text-[length:var(--text-label)] font-semibold tracking-[0.18em] uppercase">
                Contact
              </span>
              <EditorialHeading
                level={2}
                size="display-sm"
                emphasis={{ text: "?", tone: "warm" }}
                className="mt-1.5 mb-0"
              >
                Vragen over de club?
              </EditorialHeading>
            </div>
            <LinkButton href="/club/contact" variant="primary" withArrow>
              Contacteer ons
            </LinkButton>
          </div>
        </TapedCard>
      </div>

      <FooterSafeArea />
    </div>
  );
}
