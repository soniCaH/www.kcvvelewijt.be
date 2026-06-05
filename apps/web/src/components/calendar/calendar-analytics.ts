import { trackEvent } from "@/lib/analytics/track-event";

/** Which feed source a clicked `/kalender` item came from (`source` param). */
export type KalenderItemSource = "match" | "event" | "article";

/**
 * Fire `kalender_item_click` when a feed item is clicked through to its detail
 * route. Centralised so the event name + `source` param shape stay identical
 * across the agenda, week, and month-detail surfaces (taxonomy PRD §9).
 */
export function trackKalenderItemClick(source: KalenderItemSource): void {
  trackEvent("kalender_item_click", { source });
}
