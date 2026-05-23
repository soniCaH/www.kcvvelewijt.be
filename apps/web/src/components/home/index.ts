// Phase 4.D.1 (#1680) + Phase 4.5.C.1 (#1754) — the homepage has
// migrated to the new section ordering. Legacy `FeaturedArticles`,
// `MatchWidget`, and the auto-rotating `HomepageHeroCarousel` (replaced
// by a static `<EditorialHero>` + `<FeaturedUitgelichtRow>` per R1.B)
// moved to `./_legacy/` for blame trace and are no longer re-exported
// from this barrel. Deletion happens in Phase 9 cleanup.
//
// Phase 6.B (#1910) deleted `_legacy/MatchesSliderSection` +
// `_legacy/MatchesSliderEmptyState` since they consumed `<MatchesSlider>`
// (also deleted in #1910).

export { NewsGrid } from "./NewsGrid";
export type { NewsGridProps, NewsGridArticle } from "./NewsGrid";

export { FeaturedUitgelichtRow } from "./FeaturedUitgelichtRow";
export type {
  FeaturedUitgelichtRowProps,
  UitgelichtArticle,
  ArticleType,
} from "./FeaturedUitgelichtRow";

export { FeaturedEventBand } from "./FeaturedEventBand";
export type {
  FeaturedEventBandProps,
  FeaturedEventBandEvent,
} from "./FeaturedEventBand";

export { NewsCard } from "@/components/article/NewsCard";
export type { NewsCardProps } from "@/components/article/NewsCard";

export { BannerSlot } from "./BannerSlot";
export type { BannerSlotProps } from "./BannerSlot";

export { UpcomingMatches } from "./UpcomingMatches";
export type { UpcomingMatchesProps } from "./UpcomingMatches";

export { YouthSection, YouthBackdrop } from "./YouthSection";
export type { YouthSectionProps } from "./YouthSection";

export { SponsorsSection } from "./SponsorsSection";
export type { SponsorsSectionProps } from "./SponsorsSection";

export { ClubshopBanner } from "./ClubshopBanner";
export type { ClubshopBannerProps } from "./ClubshopBanner";
