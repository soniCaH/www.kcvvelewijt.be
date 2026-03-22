/**
 * SponsorsPage Component
 * Full sponsors page with stats, spotlight, and tiered sponsor grids.
 */

import { PageTitle } from "@/components/layout";
import {
  SponsorsStats,
  SponsorsSpotlight,
  SponsorCallToAction,
  SponsorsTier,
  TierDivider,
  SponsorEmptyState,
} from "@/components/sponsors";
import type { Sponsor } from "../Sponsors";

export interface SponsorsPageProps {
  /** Gold tier (crossing) sponsors */
  goldSponsors: Sponsor[];
  /** Silver tier (green/white) sponsors */
  silverSponsors: Sponsor[];
  /** Bronze tier (training/panel/other) sponsors */
  bronzeSponsors: Sponsor[];
}

export function SponsorsPage({
  goldSponsors,
  silverSponsors,
  bronzeSponsors,
}: SponsorsPageProps) {
  const totalSponsors =
    goldSponsors.length + silverSponsors.length + bronzeSponsors.length;

  const featuredSponsors = goldSponsors.slice(0, 3).map((sponsor) => ({
    ...sponsor,
    description: "Trotse partner van KCVV Elewijt",
  }));

  return (
    <div className="relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-linear-to-b from-gray-50 via-white to-gray-50 pointer-events-none" />

      {/* Content */}
      <div className="relative">
        <PageTitle title="Sponsors KCVV Elewijt" />

        {/* Stats section with subtle background */}
        <div className="bg-linear-to-r from-green-50/30 via-white to-green-50/30">
          <SponsorsStats totalSponsors={totalSponsors} />
        </div>

        {/* Spotlight section */}
        {featuredSponsors.length > 0 && (
          <div className="bg-linear-to-b from-gray-50 to-white">
            <SponsorsSpotlight sponsors={featuredSponsors} />
          </div>
        )}

        {/* Main content section */}
        <div className="w-full max-w-inner-lg mx-auto px-3 lg:px-0 py-6">
          <SponsorsTier
            tier="gold"
            title="Gouden Sponsors"
            sponsors={goldSponsors}
          />
          {goldSponsors.length > 0 && silverSponsors.length > 0 && (
            <TierDivider />
          )}
          <SponsorsTier
            tier="silver"
            title="Zilveren Sponsors"
            sponsors={silverSponsors}
          />
          {silverSponsors.length > 0 && bronzeSponsors.length > 0 && (
            <TierDivider />
          )}
          <SponsorsTier
            tier="bronze"
            title="Bronzen Sponsors"
            sponsors={bronzeSponsors}
          />

          {totalSponsors === 0 && <SponsorEmptyState />}

          <SponsorCallToAction />
        </div>
      </div>
    </div>
  );
}
