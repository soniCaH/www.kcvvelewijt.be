/**
 * Sponsors Component Exports
 */

export { Sponsors } from "./Sponsors";
export type { SponsorsProps, Sponsor } from "./Sponsors";
// Phase 4.B.3 — SponsorsBlock is now a pure presentational component
// (takes `sponsors[]` as a prop). The Sanity fetch moved up to the caller
// (`<SponsorsSection>` on the homepage), so this barrel is safe for
// Storybook chunks again.
export { SponsorsBlock } from "./SponsorsBlock";
export type { SponsorsBlockProps } from "./SponsorsBlock";
export { SponsorsSpotlight } from "./SponsorsSpotlight";
export type {
  SponsorsSpotlightProps,
  SpotlightSponsor,
} from "./SponsorsSpotlight";
export { SponsorEmptyState } from "./SponsorEmptyState";
export type { SponsorEmptyStateProps } from "./SponsorEmptyState";
export { mockSponsors } from "./Sponsors.mocks";

export { SponsorCard } from "./SponsorCard/SponsorCard";
export type { SponsorCardProps } from "./SponsorCard/SponsorCard";

export { SponsorGrid } from "./SponsorGrid/SponsorGrid";
export type { SponsorGridProps } from "./SponsorGrid/SponsorGrid";

export { SponsorLogo } from "./SponsorLogo/SponsorLogo";
export type { SponsorLogoProps } from "./SponsorLogo/SponsorLogo";

export { formatSponsorAlt } from "./formatSponsorAlt";
