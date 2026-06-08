/**
 * Sponsors Page — Phase 7 tracer.
 *
 * Fetches all sponsors from Sanity (via SponsorRepository), orders them by tier
 * then name, and renders the rebuilt `<SponsorsPage>` on the cream vocabulary.
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
import { FooterSafeArea } from "@/components/design-system";
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

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Sponsors", url: `${SITE_CONFIG.siteUrl}/sponsors` },
        ])}
      />
      <SponsorsPage sponsors={allSponsors} />
      <FooterSafeArea />
    </>
  );
}

export const revalidate = 3600;
