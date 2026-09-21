// Match components. `MatchLineup`, `MatchStatusBadge`, `MatchHero`,
// `MatchEvents`, `MatchLineupSection`, `MatchEventsSection` and
// `MatchStandingsSection` all have stories and are client-safe, so #3025's
// "a component with a story belongs in its barrel" rule re-adds them here
// (previously trimmed as unconsumed by #2934/#3024). Each is tagged
// `@public` — knip has no consumer to trace for these re-exports (no
// wildcard reads this barrel the way `.design-sync/entry.ts` reads
// design-system/layout), so without the tag it would flag them as dead;
// `@public` says the export is intentional API surface, not an oversight.

/** @public */
export { MatchLineup } from "./MatchLineup";
export type { MatchLineupProps, LineupPlayer } from "./MatchLineup";

/** @public */
export { MatchStatusBadge } from "./MatchStatusBadge";
export type { MatchStatusBadgeProps } from "./MatchStatusBadge";

/** @public */
export { MatchHero } from "./MatchHero";
export type { MatchHeroProps, MatchHeroTeam } from "./MatchHero";

/** @public */
export { MatchEvents } from "./MatchEvents/MatchEvents";
export type { MatchEventsProps, MatchEvent } from "./MatchEvents/MatchEvents";

/** @public */
export { MatchLineupSection } from "./MatchLineupSection";
export type { MatchLineupSectionProps } from "./MatchLineupSection";

/** @public */
export { MatchEventsSection } from "./MatchEventsSection";
export type { MatchEventsSectionProps } from "./MatchEventsSection";

/** @public */
export { MatchStandingsSection } from "./MatchStandingsSection";
export type { MatchStandingsSectionProps } from "./MatchStandingsSection";

export { transformMatchToSchedule } from "./transform";
