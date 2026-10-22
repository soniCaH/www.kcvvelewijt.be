"use client";

import { lazy, Suspense, useState } from "react";
import { SanityImage } from "@/lib/image/sanity-image";
import { LightboxLoading } from "../lightbox-chrome";

// The viewer (library, plugins, CSS) is its own chunk (#3480). `loadViewer` is
// shared by `lazy()` and the hover/focus preload, so both hit one import.
const loadViewer = () => import("./GalleryViewer");
// A failed chunk load (deploy skew, flaky network) renders nothing instead of
// throwing into the route's error boundary, so the photo grid stays usable. No
// retry: `lazy()` caches its result, and after a deploy the old chunk is gone —
// a reload is the real fix.
const GalleryViewer = lazy(() =>
  loadViewer().catch(() => ({ default: () => <></> })),
);
// A hover/focus warm-up that fails (deploy skew, flaky network) must not be an
// unhandled rejection; the click's own `lazy()` load handles a real failure.
const preloadViewer = () => {
  loadViewer().catch(() => {});
};

export interface GalleryLightboxImage {
  url: string | null;
  lqip?: string | null;
  /**
   * Editor-provided alt text (STUDIO-8). Authored only — the caption is no
   * longer coalesced into it at query time, because the caption renders
   * visibly beside the image and an alt repeating it says nothing new.
   */
  alt?: string | null;
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
 * What one gallery photo says when it cannot be seen (#2559 / #2548 rule 5).
 *
 * A gallery photo is the site's one genuinely alone image: nothing else on the
 * page names it. So it says its **position and extent** — never the collection,
 * which the page's own `<h1>` already names in the same section. The shipped
 * fallback was `Foto 1` … `Foto 55`, which located the reader nowhere.
 *
 * An authored alt always wins; there is no caption fallback, because a caption
 * renders visibly and rule 2 makes a captioned figure silent.
 */
export const galleryImageAlt = (
  image: Pick<GalleryLightboxImage, "alt">,
  index: number,
  total: number,
): string => image.alt?.trim() || `Foto ${index + 1} van ${total}`;

/**
 * Thumbnail grid + `yet-another-react-lightbox` viewer (Thumbnails + Zoom +
 * Captions). Thumbnails render via `next/image` in colour newsprint with LQIP
 * blur placeholders; the first row is `priority`. Captions show the per-image
 * caption with the resolved credit as a small attribution under it. Each
 * lightbox navigation fires `gallery_image_view`. Chrome is themed to the
 * redesign — sharp corners (no thumbnail border radius), ink backdrop.
 *
 * The viewer is `<GalleryViewer>`, loaded on demand (#3480): the import starts
 * on a thumbnail's hover or focus so the first click is rarely waiting, the
 * viewer mounts on the first click and then stays mounted so it can animate
 * closed.
 */
export const GalleryLightbox = ({
  gallerySlug,
  images,
  className,
}: GalleryLightboxProps) => {
  const [index, setIndex] = useState(-1);
  const [requested, setRequested] = useState(false);

  // Drop any image whose asset URL failed to resolve — a slide with no src
  // would render an empty lightbox frame.
  const usable = images.filter(
    (img): img is GalleryLightboxImage & { url: string } => Boolean(img.url),
  );

  const slides = usable.map((img, i) => ({
    src: sized(img.url, 1600),
    alt: galleryImageAlt(img, i, usable.length),
    title: img.caption || undefined,
    description: img.credit || undefined,
  }));

  return (
    <div className={className}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {usable.map((img, i) => {
          // One derivation per thumbnail, shared by the control name and the
          // image itself so the two can never drift apart.
          const alt = galleryImageAlt(img, i, usable.length);
          return (
            <li key={`${img.url}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  setIndex(i);
                  setRequested(true);
                }}
                onPointerEnter={preloadViewer}
                onFocus={preloadViewer}
                aria-label={`${alt} vergroten`}
                className="group relative block aspect-square w-full overflow-hidden"
              >
                <SanityImage
                  src={sized(img.url, 600)}
                  alt={alt}
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
          );
        })}
      </ul>

      {requested ? (
        <Suspense fallback={<LightboxLoading />}>
          <GalleryViewer
            gallerySlug={gallerySlug}
            slides={slides}
            open={index >= 0}
            index={Math.max(index, 0)}
            close={() => setIndex(-1)}
          />
        </Suspense>
      ) : null}
    </div>
  );
};
