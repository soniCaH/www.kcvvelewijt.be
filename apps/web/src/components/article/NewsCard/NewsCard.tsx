// apps/web/src/components/article/NewsCard/NewsCard.tsx
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Calendar, Clock, ExternalLink } from "@/lib/icons";

export interface NewsCardProps {
  title: string;
  href?: string; // now optional — cards without href are non-interactive
  imageUrl?: string;
  imageAlt?: string;
  /** Single category label — shown above title and in footer */
  badge?: string;
  date?: string;
  /** ISO datetime or formatted string for event date (shown with Calendar icon) */
  eventDate?: string;
  /** HH:MM time string for events (shown with Clock icon) */
  eventTime?: string;
  /** Countdown label shown in footer chip (e.g. "over 33 dagen") */
  countdown?: string;
  /** When true, full-card link opens in new tab with ExternalLink indicator */
  isExternal?: boolean;
  variant?: "standard" | "featured" | "listing";
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
}

export const NewsCard = ({
  title,
  href,
  imageUrl,
  imageAlt,
  badge,
  date,
  eventDate,
  eventTime,
  countdown,
  isExternal,
  variant = "standard",
  as: Heading = "h3",
  className,
}: NewsCardProps) => {
  const isFeatured = variant === "featured";
  const isListing = variant === "listing";

  if (isListing) {
    return (
      <article
        className={cn(
          "relative group overflow-hidden rounded-card bg-white flex flex-col h-full",
          href &&
            "transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
          className,
        )}
      >
        {/* Green top-border: hidden by default, expands from center on hover */}
        {href && (
          <div
            className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
            aria-hidden="true"
          />
        )}

        {/* Full-card link */}
        {href && (
          <Link
            href={href}
            className="absolute inset-0 z-10"
            aria-label={title}
            {...(isExternal
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          />
        )}

        {/* Image area — stacked on top */}
        {imageUrl ? (
          <div
            className="relative aspect-[3/2] overflow-hidden"
            data-testid="listing-image"
          >
            <Image
              src={imageUrl}
              alt={imageAlt ?? title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        ) : (
          <div
            className="aspect-[3/2] bg-kcvv-green-dark"
            aria-hidden="true"
            data-testid="listing-image-fallback"
          />
        )}

        {/* Content below image */}
        <div className="p-4 pointer-events-none flex flex-col flex-1">
          {badge && (
            <span className="block border-l-2 border-kcvv-green-bright pl-2 text-kcvv-green-bright text-xs font-bold uppercase tracking-wider mb-2">
              {badge}
            </span>
          )}

          <div className="flex-1">
            <Heading className="font-body text-kcvv-black! group-hover:text-kcvv-black/75! transition-colors font-bold! leading-snug! mb-0! line-clamp-3 text-base!">
              {title}
            </Heading>
          </div>

          {date && (
            <div className="border-t border-gray-200 mt-3 pt-3 text-gray-500 text-xs">
              <time>{date}</time>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "relative group overflow-hidden rounded-card bg-kcvv-black",
        href &&
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
        "aspect-[3/2]",
        className,
      )}
    >
      {/* Green top-border: hidden by default, expands from center on hover */}
      {href && (
        <div
          className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
          aria-hidden="true"
        />
      )}

      {/* Full-card link — click target only, text sits outside */}
      {href && (
        <Link
          href={href}
          className="absolute inset-0 z-10"
          aria-label={title}
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        />
      )}

      {/* Background image */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={imageAlt ?? title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes={
            isFeatured
              ? "(max-width: 768px) 100vw, 66vw"
              : "(max-width: 768px) 100vw, 33vw"
          }
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-kcvv-green-dark via-kcvv-black to-kcvv-black"
          aria-hidden="true"
        >
          {/* Diagonal accent stripe — brand motif */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, transparent 0, transparent 24px, var(--color-kcvv-green-bright) 24px, var(--color-kcvv-green-bright) 25px)",
            }}
          />
        </div>
      )}

      {/* Bottom gradient for text legibility */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-kcvv-black/90 to-transparent"
        aria-hidden="true"
      />

      {/* Content overlay — outside <Link> so article a { color } can't bleed in */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 pointer-events-none",
          isFeatured ? "p-6 md:p-8" : "p-5",
        )}
      >
        {badge && (
          <span className="block border-l-2 border-kcvv-green-bright pl-2 text-kcvv-green-bright text-xs font-bold uppercase tracking-wider mb-2">
            {badge}
          </span>
        )}

        <Heading
          className={cn(
            "font-body text-white! group-hover:text-white/75! transition-colors font-bold! leading-snug! mb-0! line-clamp-3",
            isFeatured ? "text-2xl!" : "text-base!",
          )}
        >
          {title}
        </Heading>

        {/* Footer bar: date+time on left, countdown chip on right */}
        {(countdown ?? date ?? eventDate ?? eventTime) && (
          <div className="border-t border-white/20 mt-3 pt-3 text-white/60 text-xs flex justify-between items-center">
            <div className="flex items-center gap-3">
              {eventDate && (
                <time className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 flex-shrink-0" aria-hidden />
                  {eventDate}
                </time>
              )}
              {eventTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0" aria-hidden />
                  {eventTime}
                </span>
              )}
              {!eventDate && !eventTime && date && <time>{date}</time>}
            </div>
            {countdown && (
              <span className="text-xs uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-sm font-medium text-white/70">
                {countdown}
              </span>
            )}
            {isExternal && !countdown && (
              <ExternalLink
                className="w-3 h-3 flex-shrink-0 text-white/40"
                aria-hidden
              />
            )}
          </div>
        )}
      </div>
    </article>
  );
};
