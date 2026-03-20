/**
 * ArticleHeader Component
 * Full-bleed hero image with dark gradient overlay and title text
 * Matches the NewsCard featured aesthetic
 */

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface ArticleHeaderProps {
  /** Article title */
  title: string;
  /** Hero image URL (optional — renders dark fallback when absent) */
  imageUrl?: string;
  /** Hero image alt text */
  imageAlt?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Article header with full-bleed hero image, dark gradient overlay, and title.
 * When no image is provided, renders a solid dark background with title.
 */
export const ArticleHeader = ({
  title,
  imageUrl,
  imageAlt = "",
  className,
}: ArticleHeaderProps) => {
  return (
    <header
      className={cn(
        "relative w-full aspect-[3/2] max-h-[70vh] overflow-hidden",
        !imageUrl && "bg-kcvv-black",
        className,
      )}
    >
      {/* Background image */}
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      )}

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-kcvv-black/90 via-kcvv-black/40 to-transparent"
        aria-hidden="true"
      />

      {/* Title overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12">
        <div className="w-full max-w-inner-lg mx-auto">
          <h1 className="text-white text-3xl md:text-4xl lg:text-5xl leading-tight font-bold m-0">
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
};
