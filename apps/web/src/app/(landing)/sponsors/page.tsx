/**
 * Sponsors Page — Phase 7.
 *
 * Fetches all sponsors from Sanity (via SponsorRepository), orders them by tier
 * then name, and renders the rebuilt `<SponsorsPage>`. Emits breadcrumb +
 * ItemList JSON-LD.
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
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from "@/lib/seo/jsonld";
import type { Sponsor } from "@/components/sponsors/Sponsors";
import { sortByTierThenName } from "@/components/sponsors/sortByTierThenName";
import { SponsorsPage } from "@/components/sponsors/SponsorsPage/SponsorsPage";

export const metadata: Metadata = {
  title: "Sponsors | KCVV Elewijt",
  description: "Overzicht van de sponsors die KCVV Elewijt steunen.",
};

function mapToSponsor(s: SponsorVM): Sponsor {
  return {
    id: s.id,
    name: s.name,
    logo: s.logoUrl ?? "",
    url: s.url ?? undefined,
    tier: s.tier ?? undefined,
    featured: s.featured,
    description: s.description ?? undefined,
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

  const allSponsors = sponsors.map(mapToSponsor).sort(sortByTierThenName);

  // ItemList of sponsors that link out — name + external url (no internal ids).
  const sponsorListItems = allSponsors
    .filter((sponsor): sponsor is Sponsor & { url: string } =>
      Boolean(sponsor.url),
    )
    .map((sponsor) => ({ name: sponsor.name, url: sponsor.url }));

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Sponsors", url: `${SITE_CONFIG.siteUrl}/sponsors` },
        ])}
      />
      {sponsorListItems.length > 0 && (
        <JsonLd data={buildItemListJsonLd(sponsorListItems)} />
      )}
      <SponsorsPage sponsors={allSponsors} />
    </>
  );
}

// 24h ISR — sponsor list changes rarely; editor publishes invalidate on
// demand via /api/revalidate (revalidateTag 'sponsors').
export const revalidate = 86400;
