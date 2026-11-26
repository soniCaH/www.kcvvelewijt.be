"use client";

import { useRef, type ReactNode } from "react";

import { useDelegatedClick } from "@/hooks/useDelegatedClick";
import { trackEvent } from "@/lib/analytics/track-event";

export interface SiteContentsAnalyticsProps {
  className?: string;
  children: ReactNode;
}

/**
 * Client analytics shell for `<SiteContents>`. One native listener on the
 * wrapper delegates to the `data-contents-group` rows below it, so the contents
 * page itself stays server-rendered.
 *
 * Fires `inhoud_entry_click` with `category` (which of the four groups) and
 * `position` (1-based rank inside that group) — both already-registered GA4
 * dimensions, so this event needs no new custom definition, only the
 * `inhoud_` prefix in `scripts/analytics-taxonomy.mjs`.
 *
 * The row label is deliberately **not** sent: it is the title of an article or
 * a team, which the page already exposes, but the click rate per group is the
 * question the route was approved with an open verdict on — whether a contents
 * page earns a route — and group + rank answers it.
 */
export const SiteContentsAnalytics = ({
  className,
  children,
}: SiteContentsAnalyticsProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useDelegatedClick(ref, {
    selector: "[data-contents-group]",
    onMatch: (row) => {
      const group = row.dataset.contentsGroup;
      if (!group) return;

      // Ranks are 1-based, so `> 0` rejects both `NaN` (no marker) and the 0
      // that `Number("")` returns for an empty one.
      const position = Number(row.dataset.contentsPosition);

      trackEvent("inhoud_entry_click", {
        category: group,
        ...(position > 0 ? { position } : {}),
      });
    },
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
