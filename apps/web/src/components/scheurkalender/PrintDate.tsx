"use client";

import { useSyncExternalStore } from "react";
import { CLUB_TIMEZONE } from "@/lib/utils/club-timezone";

const noopSubscribe = () => () => {};

// Same shape as `formatArticleDate` ("d MMMM yyyy", nl) without Luxon, which
// would otherwise ship to the browser for this one line (#3480). Built once,
// lazily: `useSyncExternalStore` calls the snapshot on every render.
let formatter: Intl.DateTimeFormat | undefined;
const getToday = () =>
  (formatter ??= new Intl.DateTimeFormat("nl-BE", {
    timeZone: CLUB_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  })).format(new Date());

/**
 * PrintDate — today's Belgian date, read at hydration/print time.
 *
 * The page is ISR (`revalidate = 900`), so the server HTML can be a day old by
 * the time it hydrates. The server snapshot is empty, so server HTML and the
 * hydration render agree and React reports no mismatch; the client snapshot
 * then fills in today's date. `suppressHydrationWarning` alone would keep the
 * stale server date instead.
 */
export function PrintDate() {
  return <>{useSyncExternalStore(noopSubscribe, getToday, () => "")}</>;
}
