/**
 * Sponsors Component Exports
 *
 * The legacy `<Sponsors>` / `<SponsorsSpotlight>` / `<SponsorGrid>` /
 * `<SponsorCard>` / `<SponsorLogo>` components were retired in Phase 7.5
 * (#2037). `Sponsors` now only carries the shared `Sponsor` domain type.
 */

export type { Sponsor } from "./Sponsors";
// SponsorsBlock is a pure presentational component (takes `sponsors[]` as a
// prop); the Sanity fetch lives in the `<SponsorsSection>` homepage caller.
export { SponsorsBlock } from "./SponsorsBlock";
export type { SponsorsBlockProps } from "./SponsorsBlock";
// `mockSponsors` and `formatSponsorAlt` are deliberately NOT re-exported
// here: every consumer imports each directly ("../Sponsors.mocks",
// "../formatSponsorAlt").
