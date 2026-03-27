/**
 * SponsorsPage Component
 * Sponsors page: intro, optional featured spotlight, size-differentiated logo grid, CTA.
 */

import { PageTitle } from "@/components/layout";
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

  const spotlightSponsors = featuredSponsors.map((s) => ({
    id: s.id,
    name: s.name,
    logo: s.logo,
    url: s.url,
  }));

  return (
    <div>
      <PageTitle title="Sponsors KCVV Elewijt" />

      <p
        data-testid="sponsors-intro"
        className="max-w-2xl mx-auto px-4 py-6 text-center text-gray-600 text-lg"
      >
        KCVV Elewijt kan rekenen op de steun van lokale en regionale partners.
        Dankzij onze sponsors kunnen we blijven investeren in onze club, onze
        jeugd en onze toekomst. We zijn hen daar enorm dankbaar voor.
      </p>

      {spotlightSponsors.length > 0 && (
        <SponsorsSpotlight sponsors={spotlightSponsors} />
      )}

      <div className="w-full max-w-inner-lg mx-auto px-3 lg:px-0 py-10 space-y-8">
        {totalSponsors === 0 && <SponsorEmptyState />}

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

      <SponsorCallToAction />
    </div>
  );
}
