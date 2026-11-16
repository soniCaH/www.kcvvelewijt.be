"use client";

import { usePathname } from "next/navigation";
import { urlSearchParamPreviewPathname } from "@sanity/preview-url-secret/constants";

/**
 * The notice every page shows in preview mode ("Voorbeeld", #3619) — rendered
 * by the root layout only when the draft-mode cookie is set, so a visitor never
 * gets it. A client component only to read the current path: the link hands it
 * to the disable endpoint so the editor lands back on the same page.
 */
export const PreviewBanner = () => {
  const pathname = usePathname();
  const href = `/api/preview/disable?${new URLSearchParams({
    [urlSearchParamPreviewPathname]: pathname,
  })}`;

  return (
    <div
      role="status"
      className="bg-ink text-cream flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-center font-mono text-xs font-medium"
    >
      <span>Je bekijkt een voorbeeld met niet-gepubliceerde wijzigingen.</span>
      {/* A route handler, not a page: a plain anchor, never `next/link`, so
          nothing prefetches the endpoint and ends preview mode unasked. */}
      <a href={href} className="font-semibold underline underline-offset-2">
        Voorbeeld sluiten
      </a>
    </div>
  );
};
