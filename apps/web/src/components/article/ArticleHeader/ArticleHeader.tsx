/**
 * ArticleHeader Component
 * Full-bleed hero image with editorial gradient overlay, category badge,
 * title (matching homepage hero typography), and inline metadata.
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
  /** Category badge */
  category?: string;
  /** Publication date (formatted string) */
  date?: string;
  /** Author name */
  author?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Article header with full-bleed hero image, editorial gradient overlay,
 * green accent line, and title matching homepage hero typography.
 */
export const ArticleHeader = ({
  title,
  imageUrl,
  imageAlt = "",
  category,
  date,
  author,
  className,
}: ArticleHeaderProps) => {
  return (
    <header
      className={cn(
        "relative aspect-[3/2] max-h-[75vh] min-h-[50vh] w-full overflow-hidden",
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

      {/* Rich diagonal gradient — darker left side for text readability */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.7)_40%,rgba(0,0,0,0.25)_75%,rgba(0,0,0,0.1)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
        aria-hidden="true"
      />

      {/* Green accent line at bottom */}
      <div
        className="bg-kcvv-green-bright absolute right-0 bottom-0 left-0 h-[3px]"
        aria-hidden="true"
      />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 pt-6 pb-10 md:px-10 lg:px-12">
        <div className="max-w-inner-lg mx-auto w-full">
          {/* Category badge — px-2.5 (10px) matches token, py-[3px] sits between py-0.5 (2px) and py-1 (4px) for optical alignment */}
          {category && (
            <span className="bg-kcvv-green-bright text-kcvv-black! mb-4 inline-block rounded-sm px-2.5 py-[3px] text-xs font-bold tracking-widest uppercase">
              {category}
            </span>
          )}

          {/* Title — intentional responsive clamp override: fluid sizing between mobile (1.75rem) and desktop (4rem) to match homepage hero */}
          <h1 className="font-title m-0 max-w-[75%] text-[clamp(1.75rem,5.5vw,4rem)]! leading-[1.02]! font-black! tracking-tight text-white!">
            {title}
          </h1>

          {/* Date + Author */}
          {(date || author) && (
            <div className="mt-5 flex items-center gap-4 text-sm text-white/60">
              {date && (
                <span className="flex items-center gap-1.5">
                  <span
                    className="bg-kcvv-green-bright inline-block h-[1px] w-3"
                    aria-hidden="true"
                  />
                  {date}
                </span>
              )}
              {author && (
                <span className="flex items-center gap-1.5">
                  <span
                    className="bg-kcvv-green-bright inline-block h-[1px] w-3"
                    aria-hidden="true"
                  />
                  {author}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
