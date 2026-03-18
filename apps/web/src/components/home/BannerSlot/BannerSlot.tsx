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
 * Contained (not full-bleed), rounded corners, subtle shadow.
 * Hidden when no banner is configured (call site handles conditional rendering).
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
        "relative w-full overflow-hidden rounded shadow-sm",
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
      <div className="bg-gray-100">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block max-w-7xl mx-auto px-4 md:px-8 py-8"
        >
          {inner}
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">{inner}</div>
    </div>
  );
};
