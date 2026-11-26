"use client";

import { useRef } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import { slugify } from "@/lib/utils/slugify";
import { readEmptyStateUndoAttrs } from "@/lib/analytics/empty-state-undo-attrs";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";

/**
 * Single, always-mounted click listener for every filtered `<EmptyState>`'s
 * undo, site-wide (#2719) — this repo's first document-wide delegated
 * listener (see `apps/web/CLAUDE.md`'s analytics section for when to reach
 * for this shape versus a page-scoped wrapper like `<ErrorAnalytics>`).
 * Mounted once in `app/layout.tsx`.
 *
 * Delegates off `document.body` rather than a wrapper `<div>`: the ref is
 * seeded lazily (`document` exists once this client component renders), and
 * `useDelegatedClick` guards a null `ref.current` and never re-subscribes on
 * ref identity, so a plain `useRef` initializer is enough — no effect needed
 * to set it.
 */
export const EmptyStateUndoTracker = () => {
  const ref = useRef<HTMLElement | null>(
    typeof document === "undefined" ? null : document.body,
  );

  useDelegatedClick(ref, {
    // Matches only elements EmptyState actually renders `analyticsSource`
    // onto — `readEmptyStateUndoAttrs` still guards a missing facet as a
    // leaf-module boundary concern (mirroring `readSponsorAttrs`), not
    // because this selector can match an element without one today.
    selector: "[data-empty-state-undo-source]",
    onMatch: (el) => {
      const attrs = readEmptyStateUndoAttrs(el);
      if (!attrs) return;

      trackEvent("empty_state_undo", {
        source: attrs.source,
        filter_type: slugify(attrs.facet),
      });
    },
  });

  return null;
};
