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

import { Spinner } from "@/components/design-system";
import { trackEvent } from "@/lib/analytics/track-event";

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

// Every lightbox motion is Arrival — a photo entering the screen — on The
// Curve (DESIGN.md → Motion). The literal is `--ease-out`'s value (a test pins
// them together): the library also feeds `easing.fade` to `Element.animate()`
// (pull-to-close release), which rejects `var()`. Under
// `prefers-reduced-motion: reduce` the library itself skips the slide
// animations and zeroes the fade, so nothing is gated here. One exception no
// prop reaches: the Zoom plugin hardcodes `ease-in-out` for a fresh zoom.
const ARRIVAL_MS = 500;
const THE_CURVE = "cubic-bezier(0, 0, 0.58, 1)";
const LIGHTBOX_ANIMATION = {
  fade: ARRIVAL_MS,
  swipe: ARRIVAL_MS,
  navigation: ARRIVAL_MS,
  easing: { fade: THE_CURVE, swipe: THE_CURVE, navigation: THE_CURVE },
};

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
                onClick={() => setIndex(i)}
                aria-label={`${alt} vergroten`}
                className="group relative block aspect-square w-full overflow-hidden"
              >
                <Image
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

      <Lightbox
        open={index >= 0}
        index={Math.max(index, 0)}
        close={() => setIndex(-1)}
        slides={slides}
        plugins={[Thumbnails, Zoom, Captions]}
        animation={LIGHTBOX_ANIMATION}
        render={{
          // A visitor-requested photo is loading: the site's waiting device.
          // `yarl__slide_loading` is the library's own class for its default
          // icon: it brings the delayed fade-in (no flash on a fast load) and
          // the reduced-motion opt-out; `aria-hidden` keeps the carousel's
          // live region as quiet as it was with the library icon.
          iconLoading: () => (
            <div className="yarl__slide_loading" aria-hidden="true">
              <Spinner
                variant="compact"
                className="[--spinner-dot:var(--color-cream)]"
              />
            </div>
          ),
        }}
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
