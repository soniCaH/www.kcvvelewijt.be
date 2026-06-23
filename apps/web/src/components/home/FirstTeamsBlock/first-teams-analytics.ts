import { trackEvent } from "@/lib/analytics/track-event";

/** Which card in a first-teams row was clicked. */
export type FirstTeamsCardKind = "result" | "fixture";

/**
 * Fire `match_card_click` when a homepage "Eerste ploegen" card is clicked
 * through to its match detail. Reuses the existing `match_` event family +
 * `team_slug` / `match_id` / `source` params (taxonomy `scripts/analytics-taxonomy.mjs`);
 * `source` encodes which card (`first_teams_result` | `first_teams_fixture`).
 */
export function trackFirstTeamsCardClick(args: {
  teamSlug: string;
  matchId: number;
  kind: FirstTeamsCardKind;
}): void {
  trackEvent("match_card_click", {
    team_slug: args.teamSlug,
    match_id: args.matchId,
    source:
      args.kind === "result" ? "first_teams_result" : "first_teams_fixture",
  });
}
