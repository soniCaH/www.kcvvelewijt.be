import { trackEvent } from "@/lib/analytics/track-event";
import { slugify } from "@/lib/utils/slugify";

/**
 * Analytics for the homepage "Komende wedstrijden" agenda (#2398).
 *
 * Every event here starts with `match_`, a prefix already in
 * `scripts/analytics-taxonomy.mjs` — so the live GTM trigger RegEx is unchanged
 * and no container version needs publishing. Every parameter (`filter_type`,
 * `count`, `match_id`, `source`) is likewise an already-registered GA4 custom
 * dimension, so nothing new counts against the 50-dimension cap.
 *
 * No PII: the agenda carries only fixture data and squad labels, no member or
 * Sanity ids, so nothing needs hashing.
 */

/** `source` value identifying this surface among `match_card_click` emitters. */
const AGENDA_SOURCE = "home_agenda";

/**
 * Fire when a team chip is selected. `filter` is the squad label ("U15") or
 * `"all"` for the reset; `count` is the number of fixtures the choice leaves
 * visible, so a facet that empties the list is distinguishable from one nobody
 * presses.
 *
 * The label is slugged ("A-Ploeg" → "a-ploeg"): `filter_type` is one GA4
 * dimension shared with `empty_state_undo` and `search_filter_changed`, which
 * both send slugs (#2719).
 */
export function trackAgendaFilter(filter: string, count: number): void {
  trackEvent("match_agenda_filter", { filter_type: slugify(filter), count });
}

/**
 * Fire when the agenda is expanded or collapsed. `count` is the size of the
 * currently-filtered set — what the reader is choosing to see more or less of.
 *
 * The direction is in the event *name* rather than a parameter: the only
 * registered dimension that fit was `action`, whose GA4 display name is "Error
 * action", and overloading it would label agenda interactions as errors in
 * every report. Two names under the existing `match_` prefix cost nothing.
 */
export function trackAgendaExpand(count: number): void {
  trackEvent("match_agenda_expand", { count });
}

export function trackAgendaCollapse(count: number): void {
  trackEvent("match_agenda_collapse", { count });
}

/**
 * Fire when an agenda row is clicked through to its match detail. Reuses the
 * `match_card_click` event `<FirstTeamsBlock>` already emits, separated by
 * `source` — so the two homepage match surfaces stay comparable in one report.
 *
 * `team_slug` is deliberately omitted, though the locked taxonomy records it for
 * this event: the agenda knows only a squad *label* ("U15"), not the team slug
 * `<FirstTeamsBlock>` sends, and pushing a label into a slug dimension would
 * poison it for both surfaces.
 */
export function trackAgendaRowClick(matchId: number): void {
  trackEvent("match_card_click", { match_id: matchId, source: AGENDA_SOURCE });
}
