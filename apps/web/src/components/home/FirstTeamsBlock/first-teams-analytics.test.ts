import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackEvent } from "@/lib/analytics/track-event";
import { trackFirstTeamsCardClick } from "./first-teams-analytics";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

describe("trackFirstTeamsCardClick", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fires match_card_click with first_teams_result source", () => {
    trackFirstTeamsCardClick({
      teamSlug: "a-ploeg",
      matchId: 42,
      kind: "result",
    });
    expect(trackEvent).toHaveBeenCalledWith("match_card_click", {
      team_slug: "a-ploeg",
      match_id: 42,
      source: "first_teams_result",
    });
  });

  it("fires match_card_click with first_teams_fixture source", () => {
    trackFirstTeamsCardClick({
      teamSlug: "b-ploeg",
      matchId: 7,
      kind: "fixture",
    });
    expect(trackEvent).toHaveBeenCalledWith("match_card_click", {
      team_slug: "b-ploeg",
      match_id: 7,
      source: "first_teams_fixture",
    });
  });
});
