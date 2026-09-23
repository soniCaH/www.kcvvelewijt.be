/**
 * Sponsors Page — Phase 7.
 *
 * Fetches all sponsors from Sanity (via SponsorRepository), orders them by tier
 * then name, and renders the rebuilt `<SponsorsPage>`. Emits breadcrumb +
 * ItemList JSON-LD.
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import {
  SponsorRepository,
  type SponsorVM,
} from "@/lib/repositories/sponsor.repository";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import type { Sponsor } from "@/components/sponsors/Sponsors";
import { sortByTierThenName } from "@/components/sponsors/sortByTierThenName";
import { SponsorsPage } from "@/components/sponsors/SponsorsPage/SponsorsPage";

export const metadata = buildPageMetadata({
  title: "Sponsors",
  description: "Overzicht van de sponsors die KCVV Elewijt steunen.",
  path: "/sponsors",
});

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
  // Uncaught by design (#2433 rule 2/3): the sponsor wall is this page's
  // subject, and under ISR a caught failure *succeeds* — the empty wall would
  // be written into the cache and hold for the full window below. A throw
  // leaves the last good render in place, so the failure is a blip rather than
  // a day of blank sponsor slots. `Effect.orDie` makes that decision visible
  // at the call site (#2864) rather than implicit inside `fetchGroq`.
  const sponsors = await runPromise(
    Effect.gen(function* () {
      const repo = yield* SponsorRepository;
      return yield* repo.findAll();
    }).pipe(Effect.orDie),
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

// 15m ISR — the sponsor list itself changes rarely and editor publishes
// invalidate it on demand via /api/revalidate (revalidateTag 'sponsors'), so
// the window is not what keeps this page fresh.
//
// It is what bounds a failure. This route sits in the `(landing)` group, whose
// layout mounts `<MatchStripSlot>` — a BFF read that degrades to no strip and
// is then written into this page's ISR entry for the whole window (#2433 rule
// 5, cap 900s). The audit behind #2563 counted BFF routes by what each page
// file reads and so missed every route that inherits the strip from its layout.
export const revalidate = 900;
