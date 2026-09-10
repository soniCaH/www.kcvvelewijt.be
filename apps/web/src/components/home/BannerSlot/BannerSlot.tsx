import Image from "next/image";
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
   * 2026-07-13, reaffirmed 2026-09-10 — but at a ~358px mobile column a
   * 6:1 box is only ~60px tall, too short for any text baked into the
   * artwork. 3:1 resolves to ~119px there: readable, and still close
   * enough to 6:1 that the single hotspot the schema collects frames
   * sensibly at both sizes. Two `<Image>`s (one per breakpoint, toggled by
   * a Tailwind `md:` class) rather than one responsive box, because the
   * crop is baked into each CDN URL server-side — a single image can't
   * change its own crop rectangle when the viewport crosses a breakpoint,
   * so the CSS box and the CDN transform would disagree exactly the way
   * the July sweep's `object-cover` centre-crop did.
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
  const boxClasses = cn(
    "border-ink shadow-paper-sm relative w-full overflow-hidden rounded-none border-2 transition-all duration-300 group-hover:shadow-none",
    className,
  );

  const inner = (
    <>
      {/* Mobile crop (< md) — 3:1, see `mobileImage`'s docblock. */}
      <div className={cn(boxClasses, "aspect-[3/1] min-h-[100px] md:hidden")}>
        <Image
          src={mobileImage}
          alt={alt}
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
      </div>
      {/* Desktop/tablet crop (md+) — the locked 6:1 house ratio. */}
      <div
        className={cn(boxClasses, "hidden aspect-[6/1] min-h-[60px] md:block")}
      >
        <Image
          src={image}
          alt={alt}
          fill
          className="object-cover"
          sizes="1280px"
          priority={false}
        />
      </div>
    </>
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
