/**
 * Sponsors Page — Loading Skeleton
 *
 * Mirrors the rebuilt /sponsors layout: a split hero (headline + marquee card
 * placeholder) followed by a cream `<SponsorTile>` grid. Shimmer placeholders
 * only — no SectionStack/diagonal.
 */

import { FooterSafeArea } from "@/components/design-system";
import { SPONSOR_TILE_GRID_CLASS } from "@/components/sponsors/SponsorTile";

export default function SponsorsLoading() {
  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <div className="mb-10 grid animate-pulse items-start gap-8 sm:mb-12 lg:grid-cols-[1fr_minmax(280px,360px)] lg:gap-12">
          <div className="flex flex-col gap-3">
            <div className="bg-ink/10 h-3 w-24 rounded" />
            <div className="bg-ink/10 h-12 w-72 max-w-full rounded" />
            <div className="bg-ink/10 h-5 w-96 max-w-full rounded" />
          </div>
          <div className="border-ink/10 bg-cream-soft hidden h-52 border-2 lg:block" />
        </div>

        <ul className={SPONSOR_TILE_GRID_CLASS}>
          {Array.from({ length: 10 }).map((_, i) => (
            <li key={i}>
              <div className="bg-cream-soft min-h-[70px] animate-pulse rounded-sm" />
            </li>
          ))}
        </ul>
      </div>
      <FooterSafeArea />
    </>
  );
}
