"use client";

import { lazy, Suspense, useState, type ReactNode } from "react";

import { trackEvent } from "@/lib/analytics/track-event";

const TeamPhotoViewer = lazy(() => import("./TeamPhotoViewer"));

export interface TeamPhotoLightboxProps {
  displayName: string;
  teamSlug: string;
  /** The uncropped photo — the hero's own URL is a 3:2 hotspot crop. */
  fullUrl: string;
  /** The hero photo, which becomes the trigger. */
  children: ReactNode;
}

/**
 * The team photo as a button that opens it full screen (#3447). The viewer
 * loads on the first click and stays mounted after, so it can animate closed.
 * The library returns focus to the trigger on close.
 */
export function TeamPhotoLightbox({
  displayName,
  teamSlug,
  fullUrl,
  children,
}: TeamPhotoLightboxProps) {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          // A double-click must not fire a second open event.
          if (open) return;
          setOpen(true);
          setRequested(true);
          trackEvent("team_photo_open", { team_slug: teamSlug });
        }}
        aria-label={`Teamfoto van ${displayName} vergroten`}
        // Inset ring: TapedFigure's `overflow-hidden` clips an outset one. Warm,
        // because the ground is a photo (globals.css → focus ring).
        className="focus-ring-inset block h-full w-full cursor-zoom-in [--focus-ring:var(--color-warm)]"
      >
        {children}
      </button>

      {requested ? (
        <Suspense fallback={null}>
          <TeamPhotoViewer
            open={open}
            close={() => setOpen(false)}
            src={fullUrl}
            alt={`${displayName} teamfoto`}
          />
        </Suspense>
      ) : null}
    </>
  );
}
