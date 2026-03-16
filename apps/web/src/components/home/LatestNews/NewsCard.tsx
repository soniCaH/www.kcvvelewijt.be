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
  variant = "standard",
  as: Heading = "h3",
  className,
}: NewsCardProps) => {
  const isFeatured = variant === "featured";

  return (
    <article
      className={cn(
        "relative group overflow-hidden rounded bg-kcvv-black",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        "aspect-[3/2]",
        className,
      )}
    >
      {/* Green top-border: hidden by default, expands from center on hover */}
      <div
        className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
        aria-hidden="true"
      />

      {/* Full-card link — click target only, text sits outside */}
      <Link href={href} className="absolute inset-0 z-10" aria-label={title} />

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

        {(date ?? badge) && (
          <div className="border-t border-white/20 mt-3 pt-3 text-white/60 text-xs flex justify-between">
            {date && <time>{date}</time>}
            {badge && <span>{badge}</span>}
          </div>
        )}
      </div>
    </article>
  );
};
