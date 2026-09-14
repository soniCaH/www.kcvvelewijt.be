import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";

vi.mock("@/lib/server/match-data", () => ({
  getFirstTeamStripData: vi.fn(),
}));

import { getFirstTeamStripData } from "@/lib/server/match-data";
import { MatchStrip } from "./MatchStrip";
import { clubToday } from "@/lib/utils/dates";
import type {
  ScheduleMatch,
  ScheduleReducedMatch,
  ScheduleReservation,
} from "@/components/match/types";

const mocked = vi.mocked(getFirstTeamStripData);

const fixture: ScheduleMatch = {
  kind: "match",
  id: 1,
  date: new Date("2026-05-10T19:30:00Z"),
  time: "19:30",
  status: "scheduled",
  homeTeam: { id: 1235, name: "KCVV" },
  awayTeam: { id: 9999, name: "RC Mechelen" },
};

const result: ScheduleMatch = {
  ...fixture,
  id: 2,
  date: new Date("2026-05-03T15:00:00Z"),
  status: "finished",
  homeScore: 2,
  awayScore: 1,
};

/** `MatchStrip()` returns the element itself, not rendered output — read the
 * prop straight off it, the same way the existing tests above read `null`. */
async function matchDayProp(): Promise<boolean | undefined> {
  const element = await MatchStrip();
  return (element as ReactElement<{ matchDay?: boolean }> | null)?.props
    .matchDay;
}

describe("MatchStrip (server component)", () => {
  it("returns null when neither a result nor a fixture is available", async () => {
    mocked.mockResolvedValueOnce(null);
    expect(await MatchStrip()).toBeNull();
  });

  it("renders MatchStripView when the helper returns data", async () => {
    mocked.mockResolvedValueOnce({ result: null, fixture });
    expect(await MatchStrip()).not.toBeNull();
  });

  // #2616 — the strip's dark match-day ground is a prop MatchStrip computes
  // once, server-side, from clubToday() — never recomputed by the client
  // component on hydration (see MatchStripView's own docblock for why).
  describe("matchDay (#2616)", () => {
    it("is true when the fixture is a real match on today's calendar day", async () => {
      const todaysFixture: ScheduleMatch = {
        ...fixture,
        date: new Date(`${clubToday()}T12:00:00Z`),
      };
      mocked.mockResolvedValueOnce({ result: null, fixture: todaysFixture });
      expect(await matchDayProp()).toBe(true);
    });

    it("is false when the fixture is on another day", async () => {
      mocked.mockResolvedValueOnce({ result: null, fixture });
      expect(await matchDayProp()).toBe(false);
    });

    it("is false when there is no fixture, even with a recent result", async () => {
      mocked.mockResolvedValueOnce({ result, fixture: null });
      expect(await matchDayProp()).toBe(false);
    });

    // A pitch-reservation placeholder is not a Match (docs/ubiquitous-language.md)
    // — it carries no opponent, kickoff certainty, or confirmed venue, so it
    // never earns the "Vandaag" relabel or the dark ground even when dated today.
    it("is false when the next fixture is a pitch-reservation placeholder dated today", async () => {
      const todaysReservation: ScheduleReservation = {
        kind: "reservation",
        id: 99,
        date: new Date(`${clubToday()}T09:30:00Z`),
        team: { id: 1235, name: "KCVV Elewijt" },
        status: "scheduled",
        competition: "Tornooi",
      };
      mocked.mockResolvedValueOnce({
        result: null,
        fixture: todaysReservation,
      });
      expect(await matchDayProp()).toBe(false);
    });

    // #2802 review — excluding only the reservation case alone let this one
    // through: a reduced tournament fixture isn't a reservation either, but
    // is no more a confirmed "Match" than a reservation is.
    it("is false when the next fixture is a reduced tournament fixture dated today", async () => {
      const todaysTournament: ScheduleReducedMatch = {
        kind: "reduced",
        id: 91,
        date: new Date(`${clubToday()}T09:30:00Z`),
        team: { id: 1391, name: "FC Zemst Sportief" },
        status: "scheduled",
        competition: "Tornooi",
        competitionType: "tournament",
      };
      mocked.mockResolvedValueOnce({
        result: null,
        fixture: todaysTournament,
      });
      expect(await matchDayProp()).toBe(false);
    });
  });
});
