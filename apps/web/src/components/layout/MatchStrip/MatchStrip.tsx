import { getFirstTeamNextMatch } from "@/lib/server/match-data";
import { MatchStripView } from "./MatchStripView";

/**
 * Server component. Fetches the first-team next fixture via the cached
 * `getFirstTeamNextMatch()` helper. Returns `null` when no upcoming match is
 * available, producing zero DOM (the strip slot reserves no space).
 *
 * The strip is rendered by the `(landing)` route group only — detail-page
 * route groups omit the slot entirely. See spec
 * `docs/design/mockups/phase-3-c-header-and-matchstrip/matchstrip-locked.md`.
 */
export async function MatchStrip() {
  const match = await getFirstTeamNextMatch();
  if (!match) return null;
  return <MatchStripView match={match} />;
}
