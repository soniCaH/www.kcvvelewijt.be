"use client";

import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

import {
  LIGHTBOX_ANIMATION,
  LIGHTBOX_BACKDROP,
  lightboxLoadingIcon,
} from "@/components/gallery/lightbox-chrome";

export interface TeamPhotoViewerProps {
  open: boolean;
  close: () => void;
  src: string;
  alt: string;
}

/**
 * The full-screen team photo (#3447), in the gallery's viewer chrome. One
 * photo: Zoom only — no thumbnails, no arrows. Its own module so
 * `TeamPhotoLightbox` can load it on the first click: few visitors open it, and
 * the library + Zoom are ~25 KB gzipped on every team page otherwise.
 */
export default function TeamPhotoViewer({
  open,
  close,
  src,
  alt,
}: TeamPhotoViewerProps) {
  return (
    <Lightbox
      open={open}
      close={close}
      slides={[{ src, alt }]}
      plugins={[Zoom]}
      carousel={{ finite: true }}
      controller={{ closeOnBackdropClick: true }}
      animation={LIGHTBOX_ANIMATION}
      render={{
        iconLoading: lightboxLoadingIcon,
        buttonPrev: () => null,
        buttonNext: () => null,
      }}
      styles={{ container: LIGHTBOX_BACKDROP }}
    />
  );
}
