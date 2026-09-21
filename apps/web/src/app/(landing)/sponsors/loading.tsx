/**
 * Sponsors Page — Loading Skeleton
 *
 * Mirrors the rebuilt /sponsors layout: a split hero (headline + marquee card
 * placeholder) followed by a cream `<SponsorTile>` grid. Shimmer placeholders
 * only — no SectionStack/diagonal. `<SponsorHero>`'s marquee card is the
 * featured sponsor (data), so the whole hero renders as bars, not real text.
 */

import {
  PageContainer,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";
import { SPONSOR_TILE_GRID_CLASS } from "@/components/sponsors/SponsorTile";

export default function SponsorsLoading() {
  return (
    <PageContainer width="index" className="py-12 sm:py-16">
      <LoadingAnnouncement label="Sponsors laden…" />

      <div className="mb-10 grid items-start gap-8 sm:mb-12 lg:grid-cols-[1fr_minmax(280px,360px)] lg:gap-12">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-72 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="border-ink/10 bg-cream-soft hidden h-52 border-2 lg:block" />
      </div>

      <ul className={SPONSOR_TILE_GRID_CLASS}>
        {Array.from({ length: 10 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="min-h-[70px] w-full" />
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
