/**
 * Sponsors Page
 * Displays all sponsors grouped by tier (gold/silver/bronze)
 */

import { Effect } from "effect";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import type { SanitySponsor } from "@/lib/effect/services/SanityService";
import type { Sponsor } from "@/components/sponsors/Sponsors";
import { SponsorsPage } from "@/components/sponsors/SponsorsPage/SponsorsPage";

export const metadata: Metadata = {
  title: "Sponsors | KCVV Elewijt",
  description: "Overzicht van de sponsors die KCVV Elewijt steunen.",
};

const GOLD_TYPES = ["crossing"];
const SILVER_TYPES = ["green", "white"];

/**
 * Convert a SanitySponsor record to the public Sponsor shape.
 *
 * @param s - The SanitySponsor to convert
 * @returns A Sponsor object with `id`, `name`, `logo` (uses the placeholder "/images/placeholder-sponsor.png" if the source has no logo), and `url` (`undefined` if not provided)
 */
function mapToSponsor(s: SanitySponsor): Sponsor {
  return {
    id: s._id,
    name: s.name,
    logo: s.logoUrl ?? "/images/placeholder-sponsor.png",
    url: s.url ?? undefined,
  };
}

/**
 * Render the Sponsors page with sponsors grouped into gold, silver, and bronze tiers.
 *
 * If fetching sponsors fails, the page is rendered with empty sponsor lists.
 *
 * @returns A React element for the SponsorsPage populated with `goldSponsors`, `silverSponsors`, and `bronzeSponsors`.
 */
export default async function SponsorsPageRoute() {
  const sponsors = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getSponsors();
    }).pipe(
      Effect.catchAll((error) => {
        console.error("[SponsorsPage] Failed to fetch sponsors:", error);
        return Effect.succeed([] as SanitySponsor[]);
      }),
    ),
  );

  const goldSponsors = sponsors
    .filter((s) => GOLD_TYPES.includes(s.type))
    .map(mapToSponsor);
  const silverSponsors = sponsors
    .filter((s) => SILVER_TYPES.includes(s.type))
    .map(mapToSponsor);
  const bronzeSponsors = sponsors
    .filter(
      (s) => !GOLD_TYPES.includes(s.type) && !SILVER_TYPES.includes(s.type),
    )
    .map(mapToSponsor);

  return (
    <SponsorsPage
      goldSponsors={goldSponsors}
      silverSponsors={silverSponsors}
      bronzeSponsors={bronzeSponsors}
    />
  );
}

export const revalidate = 3600;
