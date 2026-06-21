import {
  NewsCard,
  type NewsCardBg,
  type NewsCardRotation,
} from "@/components/article/NewsCard/NewsCard";

/** Dutch photo count — "1 foto" / "12 foto's". */
export function formatImageCount(count: number): string {
  return `${count} foto${count === 1 ? "" : "'s"}`;
}

export interface GalleryCardProps {
  title: string;
  /** Detail-page link target (`/galerij/{slug}`). */
  href: string;
  /** Cover = first gallery image. Absent → striped fallback. */
  coverUrl?: string | null;
  coverAlt?: string;
  /** Sanity `metadata.lqip` data-URI for the blur placeholder. */
  coverLqip?: string | null;
  imageCount: number;
  /** Pre-formatted Dutch date (e.g. "15 januari 2025"). */
  date?: string;
  rotation?: NewsCardRotation;
  bg?: NewsCardBg;
  as?: "h2" | "h3";
  className?: string;
}

/**
 * Retro-terrace gallery card. A thin adapter over `<NewsCard>` — the cover (in
 * colour newsprint), MonoLabel count, title, date, press-down hover and paper
 * shell are all the shared card vocabulary; this only maps gallery fields onto
 * it (photo count → badge, "Bekijk galerij" CTA, LQIP cover blur).
 */
export const GalleryCard = ({
  title,
  href,
  coverUrl,
  coverAlt,
  coverLqip,
  imageCount,
  date,
  rotation = "none",
  bg = "cream",
  as = "h3",
  className,
}: GalleryCardProps) => (
  <NewsCard
    title={title}
    href={href}
    imageUrl={coverUrl ?? undefined}
    imageAlt={coverAlt ?? title}
    imageLqip={coverLqip}
    badge={formatImageCount(imageCount)}
    date={date}
    cta="Bekijk galerij"
    rotation={rotation}
    bg={bg}
    as={as}
    className={className}
  />
);
