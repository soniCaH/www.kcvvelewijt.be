// apps/web/src/components/home/LatestNews/NewsCard.tsx
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface NewsCardProps {
  title: string;
  href: string;
  imageUrl?: string;
  imageAlt?: string;
  /** Single category label — shown above title and in footer */
  badge?: string;
  date?: string;
  variant?: "standard" | "featured";
  className?: string;
}

export const NewsCard = ({
  title,
  href,
  imageUrl,
  imageAlt,
  badge,
  date,
  variant = "standard",
  className,
}: NewsCardProps) => {
  const isFeatured = variant === "featured";

  return (
    <article
      className={cn(
        // Base
        "relative group overflow-hidden rounded bg-kcvv-black",
        // Hover lift + shadow
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        // Green top-border revealed on hover via before pseudo-element
        "before:absolute before:top-0 before:inset-x-0 before:h-0.5 before:bg-kcvv-green",
        "before:scale-x-0 hover:before:scale-x-100 before:transition-transform before:duration-300 before:z-10",
        // Aspect ratio — wide on desktop for featured, square-ish for standard
        isFeatured ? "aspect-[3/2] md:aspect-[21/9]" : "aspect-[3/2]",
        className,
      )}
    >
      <Link href={href} className="absolute inset-0">
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
          <div className="absolute inset-0 bg-kcvv-black" aria-hidden="true" />
        )}

        {/* Bottom gradient for text legibility */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-kcvv-black/90 to-transparent"
          aria-hidden="true"
        />

        {/* Content overlay */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0",
            isFeatured ? "p-6 md:p-8" : "p-5",
          )}
        >
          {badge && (
            <span className="block border-l-2 border-kcvv-green pl-2 text-kcvv-green text-xs font-bold uppercase tracking-wider mb-2">
              {badge}
            </span>
          )}

          <h3
            className={cn(
              "text-white font-bold leading-snug line-clamp-3",
              isFeatured ? "text-2xl" : "text-base",
            )}
          >
            {title}
          </h3>

          {(date ?? badge) && (
            <div className="border-t border-white/10 mt-3 pt-3 text-white/40 text-xs flex justify-between">
              {date && <time>{date}</time>}
              {badge && <span>{badge}</span>}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
};
