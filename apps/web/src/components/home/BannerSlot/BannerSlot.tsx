import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface BannerSlotProps {
  /** Banner image URL */
  image: string;
  /** Alt text for accessibility */
  alt: string;
  /** Optional click-through URL — wraps in <a> when set */
  href?: string;
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
  alt,
  href,
  className,
}: BannerSlotProps) => {
  const inner = (
    <div
      className={cn(
        "border-ink shadow-paper-sm relative w-full overflow-hidden rounded-none border-2 transition-all duration-300 group-hover:shadow-none",
        "aspect-[6/1] min-h-[60px]",
        className,
      )}
    >
      <Image
        src={image}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 1280px"
        priority={false}
      />
    </div>
  );

  if (href) {
    return (
      <div className="bg-cream">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group mx-auto block max-w-[var(--container-index)] px-4 py-8 transition-all duration-300 motion-safe:hover:translate-x-1 motion-safe:hover:translate-y-1 md:px-8"
        >
          {inner}
        </a>
      </div>
    );
  }

  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-[var(--container-index)] px-4 py-8 md:px-8">
        {inner}
      </div>
    </div>
  );
};
