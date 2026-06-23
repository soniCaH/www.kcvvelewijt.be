import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import {
  EditorialHeading,
  LinkButton,
  PageContainer,
  PullQuote,
  StripedSeam,
  TapedCard,
} from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { ClubEditorialHub } from "@/components/club/ClubEditorialHub/ClubEditorialHub";

export const metadata = buildPageMetadata({
  title: "Onze club | KCVV Elewijt",
  description:
    "Alles over KCVV Elewijt: geschiedenis, bestuur, organigram en hoe je kan aansluiten.",
  path: "/club",
});

/**
 * `/club` index — rebuilt on the retro-terrace-fanzine system (design lock
 * `docs/design/mockups/phase-10-club-index/10c3-locked.html`, #2121). Pure
 * reuse of redesign primitives: `<PageHero>` (typographic) → `<ClubEditorialHub>`
 * (uniform 3-up nav grid) → `<PullQuote>` mission → cream contact CTA band,
 * separated by full-bleed `<StripedSeam>`s. Composes striped-seam
 * `<SectionStack>` transitions — the legacy diagonal `<SectionTransition>`
 * feature is gone (#2154, closing out #1701) — and drops the banned legacy
 * club motto.
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
      <PageContainer width="index" className="pt-10 pb-12">
        <PageHero
          kicker="Onze club"
          headline="De plezantste compagnie"
          accent="compagnie"
          lead="Sinds 1909 de thuishaven voor voetballiefhebbers in Elewijt — van de allerkleinsten tot het eerste elftal."
        />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Editorial nav hub. */}
      <PageContainer width="index" className="py-12">
        <ClubEditorialHub />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Mission. */}
      <PageContainer width="index" className="py-12">
        <PullQuote
          tone="ink"
          attribution={{ name: "Sportpark Elewijt", source: "sinds 1909" }}
        >
          Wij zijn KCVV Elewijt. Een plek waar jong en oud wekelijks samenkomen
          voor hun passie.
        </PullQuote>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Contact CTA band. */}
      <PageContainer width="index" className="py-12">
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
      </PageContainer>
    </div>
  );
}
