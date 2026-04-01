/**
 * Sponsors Page
 * Displays all sponsors grouped by tier (gold/silver/bronze)
 */

import { Effect } from "effect";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import {
  SponsorRepository,
  type SponsorVM,
} from "@/lib/repositories/sponsor.repository";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import type { Sponsor } from "@/components/sponsors/Sponsors";
import { SponsorsPage } from "@/components/sponsors/SponsorsPage/SponsorsPage";

export const metadata: Metadata = {
  title: "Sponsors | KCVV Elewijt",
  description: "Overzicht van de sponsors die KCVV Elewijt steunen.",
};

const GOLD_TYPES = ["crossing"];
const SILVER_TYPES = ["green", "white"];

function mapToSponsor(s: SponsorVM): Sponsor {
  return {
    id: s.id,
    name: s.name,
    logo: s.logoUrl ?? "/images/placeholder-sponsor.png",
    url: s.url,
    tier: s.tier,
    featured: s.featured,
    description: s.description,
  };
}

export default async function SponsorsPageRoute() {
  const sponsors = await runPromise(
    Effect.gen(function* () {
      const repo = yield* SponsorRepository;
      return yield* repo.findAll();
    }).pipe(
      Effect.catchAll((error) => {
        console.error("[SponsorsPage] Failed to fetch sponsors:", error);
        return Effect.succeed([] as SponsorVM[]);
      }),
    ),
  );

  const goldSponsors = sponsors
    .filter(
      (s) =>
        s.tier === "hoofdsponsor" ||
        (!s.tier && s.type && GOLD_TYPES.includes(s.type)),
    )
    .map(mapToSponsor);
  const silverSponsors = sponsors
    .filter(
      (s) =>
        s.tier === "sponsor" ||
        (!s.tier && s.type && SILVER_TYPES.includes(s.type)),
    )
    .map(mapToSponsor);
  const bronzeSponsors = sponsors
    .filter(
      (s) =>
        s.tier === "sympathisant" ||
        (!s.tier &&
          (!s.type ||
            (!GOLD_TYPES.includes(s.type) && !SILVER_TYPES.includes(s.type)))),
    )
    .map(mapToSponsor);

  const featuredSponsors = sponsors.filter((s) => s.featured).map(mapToSponsor);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Sponsors", url: `${SITE_CONFIG.siteUrl}/sponsors` },
        ])}
      />
      <SponsorsPage
        goldSponsors={goldSponsors}
        silverSponsors={silverSponsors}
        bronzeSponsors={bronzeSponsors}
        featuredSponsors={featuredSponsors}
      />
    </>
  );
}

export const revalidate = 3600;
