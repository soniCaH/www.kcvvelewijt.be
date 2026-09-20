// Match components — `MatchLineup`, `MatchStatusBadge`, `MatchHero`,
// `MatchEvents`, `MatchLineupSection`, `MatchEventsSection` and
// `MatchStandingsSection` are deliberately NOT re-exported here: every
// consumer imports each directly from its own subpath (e.g.
// "@/components/match/MatchHero") — see the `Alert` barrel
// (@/components/design-system/Alert/index.ts) for the same pattern.
// `transformMatchToSchedule` stays: several pages import it through this
// barrel path.
export type { MatchLineupProps, LineupPlayer } from "./MatchLineup";
export type { MatchStatusBadgeProps } from "./MatchStatusBadge";
export type { MatchHeroProps, MatchHeroTeam } from "./MatchHero";
export type { MatchEventsProps, MatchEvent } from "./MatchEvents/MatchEvents";
export type { MatchLineupSectionProps } from "./MatchLineupSection";
export type { MatchEventsSectionProps } from "./MatchEventsSection";
export type { MatchStandingsSectionProps } from "./MatchStandingsSection";

export { transformMatchToSchedule } from "./transform";
