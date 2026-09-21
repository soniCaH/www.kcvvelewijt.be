// `MatchLineup` has a story and is client-safe, so #3025's "a component
// with a story belongs in its barrel" rule re-adds it here (previously
// trimmed as unconsumed by #2934/#3024). Tagged `@public`: nothing in this
// repo imports it through this barrel path (every consumer still imports
// "./MatchLineup" directly), so knip would otherwise flag it as dead — the
// tag says the export is intentional API surface, not an oversight.

/** @public */
export { MatchLineup } from "./MatchLineup";
export type { MatchLineupProps, LineupPlayer } from "./MatchLineup";
