import { cn } from "@/lib/utils/cn";
import { PageContainer } from "@/components/design-system";

export interface BannerSlotProps {
  /**
   * Banner image URL, fitted (never cropped) server-side — one URL for every
   * breakpoint. The slot has no house ratio: whatever an editor uploads is
   * what a visitor sees, identically on a phone and on a desktop (#2928).
   */
  image: string;
  /**
   * The asset's own pixel size. Emitted as the `<img>`'s `width`/`height` so
   * the browser can reserve the box from the intrinsic ratio before the bytes
   * arrive. This is the ONLY layout-shift guard here — there is no fixed
   * `aspect-[]` box to fall back on, so omitting these would reflow the page
   * below the banner on every cold load.
   */
  width: number;
  height: number;
  /** Alt text for accessibility */
  alt: string;
  /** Optional click-through URL — wraps in <a> when set */
  href?: string;
  /**
   * Which of the three homepage slots this is. Emitted as the inert
   * `data-banner-slot` marker that `<HomepageAnalytics>` delegates on, and as
   * the `position` param on the banner events (#2400) — the slots sit at very
   * different scroll depths, so an undifferentiated banner event says nothing.
   */
  slot?: "a" | "b" | "c";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Optional editorial/campaign banner.
 * Contained (not full-bleed), square corners with a paper offset shadow and a
 * 2px ink border. Hidden when no banner is configured (call site handles
 * conditional rendering).
 */
export const BannerSlot = ({
  image,
  width,
  height,
  alt,
  href,
  slot,
  className,
}: BannerSlotProps) => {
  // One plain <img> at the asset's own ratio. This used to be a <picture>
  // with two `<source media>` crops — 6:1 from `md` up, 3:1 below — which
  // meant every banner was carved into two different shapes, and any banner
  // with text baked into the artwork lost part of it in at least one of them
  // (#2928). Removing the crop removes the problem: nothing to frame, so no
  // hotspot, no second URL, and no art-direction swap to keep in sync with a
  // CSS ratio.
  //
  // Still not `next/image`: the Sanity CDN URL is already sized and carries
  // `q=80&fm=webp`, `loading="lazy"` gives native lazy-loading, and
  // `width`/`height` give the intrinsic ratio — which is everything the
  // optimizer would have contributed here. The eslint rule's `<picture>`
  // exemption no longer applies now that the `<picture>` is gone, so this
  // carries an explicit disable with that reasoning.
  const inner = (
    <div
      className={cn(
        "border-ink shadow-paper-sm w-full rounded-none border-2 transition-all duration-300 group-hover:shadow-none",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized Sanity CDN URL; see the note above */}
      <img
        src={image}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className="block h-auto w-full"
      />
    </div>
  );

  // ponytail: no own background — the banner sits directly on the page cream
  // (its SectionStack wrapper is `transparent` since #2342) so it blends into
  // the news grid below rather than echoing the cream StripedSeam that closes
  // the matches section above.
  if (href) {
    return (
      <PageContainer width="index" className="py-8">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          data-banner-slot={slot}
          className="group block transition-all duration-300 motion-safe:hover:translate-x-1 motion-safe:hover:translate-y-1"
        >
          {inner}
        </a>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="index" className="py-8">
      {inner}
    </PageContainer>
  );
};
