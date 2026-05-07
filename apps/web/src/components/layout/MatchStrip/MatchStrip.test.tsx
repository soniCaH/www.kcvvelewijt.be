import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/server/match-data", () => ({
  getFirstTeamNextMatch: vi.fn(),
}));

import { getFirstTeamNextMatch } from "@/lib/server/match-data";
import { MatchStrip } from "./MatchStrip";

const mocked = getFirstTeamNextMatch as unknown as ReturnType<typeof vi.fn>;

describe("MatchStrip (server component)", () => {
  it("returns null when no upcoming match is available", async () => {
    mocked.mockResolvedValueOnce(null);
    const result = await MatchStrip();
    expect(result).toBeNull();
  });

  it("renders MatchStripView when an upcoming match is available", async () => {
    mocked.mockResolvedValueOnce({
      id: 1,
      date: new Date("2026-05-10T19:30:00Z"),
      time: "19:30",
      status: "scheduled",
      homeTeam: { id: 1235, name: "KCVV" },
      awayTeam: { id: 9999, name: "RC Mechelen" },
    });
    const result = await MatchStrip();
    expect(result).not.toBeNull();
  });
});
