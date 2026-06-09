/**
 * Sponsor domain type — the shared shape consumed across the redesign sponsor
 * surfaces (`<SponsorsBlock>`, `<SponsorsPage>`, `<SponsorHero>`,
 * `<FeaturedSponsorCard>`, `<SponsorTile>`, `<SponsorTiers>`, `<HoofdSponsorTile>`).
 *
 * The legacy `<Sponsors>` / `<SponsorGrid>` / `<SponsorCard>` / `<SponsorLogo>` /
 * `<SponsorsSpotlight>` components were retired in Phase 7.5 (#2037); this file
 * now holds only the `Sponsor` type that everything still imports from
 * `"../Sponsors"`.
 */

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  url?: string;
  tier?: "hoofdsponsor" | "sponsor" | "sympathisant";
  featured?: boolean;
  description?: string;
}
