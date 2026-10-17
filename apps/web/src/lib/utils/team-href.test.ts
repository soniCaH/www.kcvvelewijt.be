import { describe, expect, it } from "vitest";
import { BOARD_TEAM_SLUGS, isBoardTeamSlug, teamHref } from "./team-href";

describe("teamHref", () => {
  it.each(BOARD_TEAM_SLUGS)("sends the board team %s to /club/%s", (slug) => {
    expect(teamHref(slug)).toBe(`/club/${slug}`);
    expect(isBoardTeamSlug(slug)).toBe(true);
  });

  it.each(["kcvve-u5", "fc-weitse-gans", "eerste-elftallen-a", "bestuurders"])(
    "keeps the real team %s under /ploegen",
    (slug) => {
      expect(teamHref(slug)).toBe(`/ploegen/${slug}`);
      expect(isBoardTeamSlug(slug)).toBe(false);
    },
  );
});
