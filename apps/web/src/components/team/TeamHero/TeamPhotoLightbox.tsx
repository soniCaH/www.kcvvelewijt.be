"use client";

import { useState, type ReactNode } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

import { trackEvent } from "@/lib/analytics/track-event";
import {
  LIGHTBOX_ANIMATION,
  LIGHTBOX_BACKDROP,
  lightboxLoadingIcon,
} from "@/components/gallery/lightbox-chrome";

export interface TeamPhotoLightboxProps {
  displayName: string;
  teamSlug: string;
  /** The uncropped photo — the hero's own URL is a 3:2 hotspot crop. */
  fullUrl: string;
  /** The hero photo, which becomes the trigger. */
  children: ReactNode;
}

/**
 * The team photo as a button that opens it full screen (#3447), in the
 * gallery's viewer chrome. One photo: Zoom only — no thumbnails, no arrows.
 * The library returns focus to the trigger on close.
 */
export function TeamPhotoLightbox({
  displayName,
  teamSlug,
  fullUrl,
  children,
}: TeamPhotoLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          trackEvent("team_photo_open", { team_slug: teamSlug });
        }}
        aria-label={`Teamfoto van ${displayName} vergroten`}
        className="block h-full w-full cursor-zoom-in"
      >
        {children}
      </button>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: fullUrl, alt: `${displayName} teamfoto` }]}
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
    </>
  );
}
