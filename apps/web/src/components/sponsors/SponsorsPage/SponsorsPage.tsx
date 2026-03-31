/**
 * SponsorsPage Component
 * Sponsors page: modern dark header, optional featured spotlight, size-differentiated logo grid, CTA.
 * Sections are composed via SectionStack with diagonal transitions.
 */

import { SectionStack } from "@/components/design-system";
import type { SectionConfig } from "@/components/design-system";
import {
  SponsorsSpotlight,
  SponsorCallToAction,
  SponsorEmptyState,
  SponsorGrid,
} from "@/components/sponsors";
import type { Sponsor } from "../Sponsors";

export interface SponsorsPageProps {
  /** Hoofdsponsor tier sponsors */
  goldSponsors: Sponsor[];
  /** Sponsor tier sponsors */
  silverSponsors: Sponsor[];
  /** Sympathisant tier sponsors */
  bronzeSponsors: Sponsor[];
  /** Sponsors with featured=true — drives the spotlight section */
  featuredSponsors: Sponsor[];
}

export function SponsorsPage({
  goldSponsors,
  silverSponsors,
  bronzeSponsors,
  featuredSponsors,
}: SponsorsPageProps) {
  const totalSponsors =
    goldSponsors.length + silverSponsors.length + bronzeSponsors.length;
  const hasSpotlight = featuredSponsors.length > 0;

  const spotlightSponsors = featuredSponsors.map((s) => ({
    id: s.id,
    name: s.name,
    logo: s.logo,
    url: s.url,
    description: s.description,
  }));

  const headerSection: SectionConfig = {
    key: "header",
    bg: "kcvv-black",
    content: (
      <div className="max-w-inner-lg mx-auto px-4 md:px-10">
        <div className="flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-white/50 mb-4">
          <span className="block w-5 h-0.5 bg-kcvv-green" aria-hidden="true" />
          KCVV Elewijt
        </div>
        <h1 className="font-title font-black text-white uppercase text-[clamp(3rem,7vw,5.5rem)] leading-[0.9] mb-4">
          Onze sponsors
        </h1>
        <p
          data-testid="sponsors-intro"
          className="max-w-2xl text-white/60 text-lg"
        >
          KCVV Elewijt kan rekenen op de steun van lokale en regionale partners.
          Dankzij onze sponsors kunnen we blijven investeren in onze club, onze
          jeugd en onze toekomst. We zijn hen daar enorm dankbaar voor.
        </p>
      </div>
    ),
    paddingTop: "pt-16",
    paddingBottom: "pb-24",
    transition: { type: "diagonal", direction: "right", overlap: "full" },
  };

  const spotlightSection: SectionConfig | false = hasSpotlight && {
    key: "spotlight",
    bg: "kcvv-green-dark",
    content: <SponsorsSpotlight sponsors={spotlightSponsors} />,
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
    transition: { type: "diagonal", direction: "right" },
  };

  const gridSection: SectionConfig = {
    key: "grid",
    bg: "gray-100",
    content: (
      <div className="max-w-inner-lg mx-auto px-4 md:px-10 py-10 space-y-8">
        {totalSponsors === 0 && !hasSpotlight && <SponsorEmptyState />}

        {goldSponsors.length > 0 && (
          <SponsorGrid
            sponsors={goldSponsors}
            columns={4}
            size="lg"
            showNames={false}
          />
        )}

        {silverSponsors.length > 0 && (
          <SponsorGrid
            sponsors={silverSponsors}
            columns={5}
            size="md"
            showNames={false}
          />
        )}

        {bronzeSponsors.length > 0 && (
          <SponsorGrid
            sponsors={bronzeSponsors}
            columns={6}
            size="sm"
            showNames={false}
          />
        )}
      </div>
    ),
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
    transition: { type: "diagonal", direction: "left" },
  };

  const ctaSection: SectionConfig = {
    key: "cta",
    bg: "kcvv-black",
    content: <SponsorCallToAction />,
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
  };

  return (
    <SectionStack
      sections={[headerSection, spotlightSection, gridSection, ctaSection]}
    />
  );
}
