/**
 * Sponsors Component Exports
 */

export { Sponsors } from "./Sponsors";
export type { SponsorsProps, Sponsor } from "./Sponsors";
// SponsorsBlock is a server component whose Sanity client (`createClient` at
// module load) crashes any client-only chunk that imports this barrel without
// `NEXT_PUBLIC_SANITY_PROJECT_ID` in scope (e.g. the Storybook build).
// Client-side consumers must import the leaf components directly from their
// files instead of via this barrel. Splitting into client/server entry points
// is tracked separately; until then, treat this comment as the signpost.
export { SponsorsBlock } from "./SponsorsBlock";
export type { SponsorsBlockProps } from "./SponsorsBlock";
export { SponsorsSpotlight } from "./SponsorsSpotlight";
export type {
  SponsorsSpotlightProps,
  SpotlightSponsor,
} from "./SponsorsSpotlight";
export { SponsorCallToAction } from "./SponsorCallToAction";
export type { SponsorCallToActionProps } from "./SponsorCallToAction";
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
