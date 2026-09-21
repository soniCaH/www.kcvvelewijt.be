// Match components. `MatchLineup`, `MatchStatusBadge`, `MatchHero`,
// `MatchEvents`, `MatchLineupSection`, `MatchEventsSection` and
// `MatchStandingsSection` all have stories and are client-safe, so #3025's
// "a component with a story belongs in its barrel" rule re-adds them here
// (previously trimmed as unconsumed by #2934/#3024).
export { MatchLineup } from "./MatchLineup";
export type { MatchLineupProps, LineupPlayer } from "./MatchLineup";

export { MatchStatusBadge } from "./MatchStatusBadge";
export type { MatchStatusBadgeProps } from "./MatchStatusBadge";

export { MatchHero } from "./MatchHero";
export type { MatchHeroProps, MatchHeroTeam } from "./MatchHero";

export { MatchEvents } from "./MatchEvents/MatchEvents";
export type { MatchEventsProps, MatchEvent } from "./MatchEvents/MatchEvents";

export { MatchLineupSection } from "./MatchLineupSection";
export type { MatchLineupSectionProps } from "./MatchLineupSection";

export { MatchEventsSection } from "./MatchEventsSection";
export type { MatchEventsSectionProps } from "./MatchEventsSection";

export { MatchStandingsSection } from "./MatchStandingsSection";
export type { MatchStandingsSectionProps } from "./MatchStandingsSection";

export { transformMatchToSchedule } from "./transform";
