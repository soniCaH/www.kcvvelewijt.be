"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

export interface ErrorAnalyticsProps {
  /** HTTP error code as a string, e.g. `"404"` | `"500"`. */
  code: string;
  children: ReactNode;
}

/**
 * Client analytics shell for the 404 / 500 error pages (Phase 8.5). Fires a
 * single `error_view` on mount and delegates clicks on the recovery actions to
 * `error_action_click` — one native listener on the container, not per-button
 * `onClick` — so `<ErrorState>` stays a presentational component usable from the
 * (server) `not-found.tsx` as well as the (client) `error.tsx`.
 *
 * Both events carry `error_code` (`"404"` | `"500"`) and `path` (the URL the
 * visitor hit, read once at mount — for a 404 the missing URL, for a 500 the
 * URL that errored). The action marker `data-error-action` (set by
 * `<ErrorState>` on each action button/link → `"home"` | `"search"` | `"retry"`)
 * supplies the `action` param.
 */
export function ErrorAnalytics({ code, children }: ErrorAnalyticsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // `pathname` only (never `search`) — a page-path identifier, the same field
    // GA4 collects natively as `page_path` for every view. NOT user-authored
    // free text, so it is sent as-is: `sanitizeQuery` is the search-box helper
    // (lowercase + truncate-50) and would corrupt long 404 URLs — the very data
    // this event exists to capture — without redacting anything.
    const path = window.location.pathname;
    trackEvent("error_view", { error_code: code, path });

    const node = ref.current;
    if (!node) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("[data-error-action]");
      const action = el?.dataset.errorAction;
      if (!action) return;

      trackEvent("error_action_click", { error_code: code, path, action });
    };

    node.addEventListener("click", handleClick);
    return () => node.removeEventListener("click", handleClick);
  }, [code]);

  return <div ref={ref}>{children}</div>;
}
