"use client";

import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";

import { trackEvent } from "@/lib/analytics/track-event";
import {
  LIGHTBOX_ANIMATION,
  LIGHTBOX_BACKDROP,
  lightboxLoadingIcon,
} from "../lightbox-chrome";

export interface GalleryViewerSlide {
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

export interface GalleryViewerProps {
  gallerySlug: string;
  slides: GalleryViewerSlide[];
  open: boolean;
  index: number;
  close: () => void;
}

/**
 * The gallery's full-screen viewer (Thumbnails + Zoom + Captions). Its own
 * module so `GalleryLightbox` can load the library, its plugins and their CSS
 * on demand (#3480) — most visitors never open a photo. Each navigation fires
 * `gallery_image_view`. Chrome is themed to the redesign: sharp corners, ink
 * backdrop.
 */
export default function GalleryViewer({
  gallerySlug,
  slides,
  open,
  index,
  close,
}: GalleryViewerProps) {
  return (
    <Lightbox
      open={open}
      index={index}
      close={close}
      slides={slides}
      plugins={[Thumbnails, Zoom, Captions]}
      animation={LIGHTBOX_ANIMATION}
      render={{ iconLoading: lightboxLoadingIcon }}
      on={{
        view: ({ index: i }) =>
          trackEvent("gallery_image_view", {
            gallery_slug: gallerySlug,
            image_index: i,
          }),
      }}
      // Sharp corners + ink backdrop to match the redesign chrome.
      styles={{
        container: LIGHTBOX_BACKDROP,
        thumbnail: { borderRadius: 0 },
      }}
    />
  );
}
