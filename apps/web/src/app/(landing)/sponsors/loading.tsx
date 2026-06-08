/**
 * Sponsors Page — Loading Skeleton
 *
 * Mirrors the rebuilt /sponsors layout: an editorial header followed by a cream
 * `<SponsorTile>` grid. Shimmer placeholders only — no SectionStack/diagonal.
 */

import { FooterSafeArea } from "@/components/design-system";
import { SPONSOR_TILE_GRID_CLASS } from "@/components/sponsors/SponsorTile";

export default function SponsorsLoading() {
  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <div className="mb-10 flex animate-pulse flex-col gap-3">
          <div className="bg-ink/10 h-3 w-24 rounded" />
          <div className="bg-ink/10 h-12 w-72 max-w-full rounded" />
          <div className="bg-ink/10 h-5 w-96 max-w-full rounded" />
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
