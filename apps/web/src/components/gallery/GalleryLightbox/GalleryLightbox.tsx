"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";

import { trackEvent } from "@/lib/analytics/track-event";

export interface GalleryLightboxImage {
  url: string | null;
  lqip?: string | null;
  caption?: string | null;
  credit?: string | null;
}

export interface GalleryLightboxProps {
  gallerySlug: string;
  images: GalleryLightboxImage[];
  className?: string;
}

// Thumbnails in the (widest) first row — rendered eagerly via `priority`.
const FIRST_ROW = 4;

const sized = (url: string, w: number) => `${url}?w=${w}&q=80&fm=webp&fit=max`;

/**
 * Thumbnail grid + `yet-another-react-lightbox` viewer (Thumbnails + Zoom +
 * Captions). Thumbnails render via `next/image` in colour newsprint with LQIP
 * blur placeholders; the first row is `priority`. Captions show the per-image
 * caption with the resolved credit as a small attribution under it. Each
 * lightbox navigation fires `gallery_image_view`. Chrome is themed to the
 * redesign — sharp corners (no thumbnail border radius), ink backdrop.
 */
export const GalleryLightbox = ({
  gallerySlug,
  images,
  className,
}: GalleryLightboxProps) => {
  const [index, setIndex] = useState(-1);

  // Drop any image whose asset URL failed to resolve — a slide with no src
  // would render an empty lightbox frame.
  const usable = images.filter(
    (img): img is GalleryLightboxImage & { url: string } => Boolean(img.url),
  );

  const slides = usable.map((img) => ({
    src: sized(img.url, 1600),
    alt: img.caption || undefined,
    title: img.caption || undefined,
    description: img.credit || undefined,
  }));

  return (
    <div className={className}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {usable.map((img, i) => (
          <li key={`${img.url}-${i}`}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={img.caption || `Foto ${i + 1} vergroten`}
              className="group focus-visible:outline-ink relative block aspect-square w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Image
                src={sized(img.url, 600)}
                alt={img.caption || `Foto ${i + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                style={{ filter: "var(--filter-photo-newsprint)" }}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                placeholder={img.lqip ? "blur" : "empty"}
                blurDataURL={img.lqip ?? undefined}
                priority={i < FIRST_ROW}
              />
            </button>
          </li>
        ))}
      </ul>

      <Lightbox
        open={index >= 0}
        index={Math.max(index, 0)}
        close={() => setIndex(-1)}
        slides={slides}
        plugins={[Thumbnails, Zoom, Captions]}
        on={{
          view: ({ index: i }) =>
            trackEvent("gallery_image_view", {
              gallery_slug: gallerySlug,
              image_index: i,
            }),
        }}
        // Sharp corners + ink backdrop to match the redesign chrome.
        styles={{
          container: { backgroundColor: "rgba(20, 20, 20, 0.94)" },
          thumbnail: { borderRadius: 0 },
        }}
      />
    </div>
  );
};
