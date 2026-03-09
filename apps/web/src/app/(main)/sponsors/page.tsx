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

function mapToSponsor(s: SanitySponsor): Sponsor {
  return {
    id: s._id,
    name: s.name,
    logo: s.logoUrl ?? "/images/placeholder-sponsor.png",
    url: s.url ?? undefined,
  };
}

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
