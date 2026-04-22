/**
 * SponsorsPage Component
 * Sponsors page: modern dark header, optional featured spotlight, size-differentiated logo grid, CTA.
 * Sections are composed via SectionStack with diagonal transitions.
 */

import { SectionStack } from "@/components/design-system";
import {
  SponsorsSpotlight,
  SponsorCallToAction,
  SponsorEmptyState,
  SponsorGrid,
} from "@/components/sponsors";
import { getSponsorsSections } from "../getSponsorsSections";
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

  const headerContent = (
    <div className="max-w-inner-lg mx-auto px-4 md:px-10">
      <div className="mb-4 flex items-center gap-2 text-[0.6875rem] font-extrabold tracking-[0.14em] text-white/50 uppercase">
        <span className="bg-kcvv-green block h-0.5 w-5" aria-hidden="true" />
        KCVV Elewijt
      </div>
      <h1 className="font-title mb-4 text-[clamp(3rem,7vw,5.5rem)] leading-[0.9] font-black text-white uppercase">
        Onze sponsors
      </h1>
      <p
        data-testid="sponsors-intro"
        className="max-w-2xl text-lg text-white/60"
      >
        KCVV Elewijt kan rekenen op de steun van lokale en regionale partners.
        Dankzij onze sponsors kunnen we blijven investeren in onze club, onze
        jeugd en onze toekomst. We zijn hen daar enorm dankbaar voor.
      </p>
    </div>
  );

  const gridContent = (
    <div className="max-w-inner-lg mx-auto space-y-8 px-4 py-10 md:px-10">
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
  );

  const sections = getSponsorsSections({
    header: headerContent,
    spotlight: hasSpotlight && (
      <SponsorsSpotlight sponsors={spotlightSponsors} />
    ),
    grid: gridContent,
    cta: <SponsorCallToAction />,
  });

  return <SectionStack sections={sections} />;
}
