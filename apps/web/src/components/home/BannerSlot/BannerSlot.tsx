import { cn } from "@/lib/utils/cn";
import { PageContainer } from "@/components/design-system";

export interface BannerSlotProps {
  /**
   * Banner image URL, cropped 6:1 server-side — rendered from the `md`
   * breakpoint up. See `mobileImage` for why this isn't the only image.
   */
  image: string;
  /**
   * Banner image URL for the small breakpoint, cropped 3:1 server-side
   * (#2401 item 2). The house ratio stays 6:1 from `md` up — locked
   * 2026-07-13, reaffirmed 2026-09-10 — but at a ~375px mobile column a
   * 6:1 box is only ~60px tall, too short for any text baked into the
   * artwork. 3:1 resolves to ~125px there: readable, and still close
   * enough to 6:1 that the single hotspot the schema collects frames
   * sensibly at both sizes.
   */
  mobileImage: string;
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
  mobileImage,
  alt,
  href,
  slot,
  className,
}: BannerSlotProps) => {
  const inner = (
    // One box whose aspect ratio itself switches at `md` (#2401 review
    // finding 2) — not two boxes toggled by `hidden`/`md:hidden`. A
    // `display:none` subtree still downloads its `<img>`/`srcSet`, so the
    // earlier two-box version fetched BOTH crops on every load, on every
    // viewport, for all three slots. One box + a `<picture>` art-direction
    // swap below fetches exactly one.
    <div
      className={cn(
        "border-ink shadow-paper-sm relative aspect-[3/1] min-h-[100px] w-full overflow-hidden rounded-none border-2 transition-all duration-300 group-hover:shadow-none md:aspect-[6/1] md:min-h-[60px]",
        className,
      )}
    >
      <picture>
        {/* `min-width: 768px` mirrors Tailwind's `md` breakpoint — the
            CDN's 6:1 crop only makes sense once the CSS box above has
            switched to `md:aspect-[6/1]` too; the two must agree. */}
        <source media="(min-width: 768px)" srcSet={image} />
        {/* Plain `<img>`, not `next/image` — intentional (#2401 review
            finding 2). `next/image` has no art-direction equivalent (two
            source URLs, swapped by breakpoint, exactly one fetched); only
            `<picture>`'s native `<source media>` does that. No
            `@next/next/no-img-element` suppression needed: the rule
            already exempts an `<img>` that is a `<picture>` child, which
            is exactly this case. `next/image`'s own value here (responsive
            `srcSet`, lazy loading) is covered anyway — the Sanity CDN URLs
            are pre-sized and carry `q=80&fm=webp`, and `loading="lazy"`
            gives native lazy-loading without the optimizer. */}
        <img
          src={mobileImage}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
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
