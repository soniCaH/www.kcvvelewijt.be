/**
 * `deriveCompetitiveBlockState` unit tests (#2636, split further in #2795).
 *
 * Covers all reachable states plus the null-fetch-result and
 * "unavailable" (fixtures) paths, and the gate rule itself: a match's
 * `competitionType`, never `standings.length`. #2795 adds `ranking-
 * unavailable` (a fulfilled-fixtures result with `standings: null`) and
 * proves it is never conflated with `no-table` (`standings: []`).
 */

import { describe, it, expect } from "vitest";
import type { Match, RankingEntry, RankingTable } from "@kcvv/api-contract";
import {
  classifyStandingsTables,
  competitiveBlockHeadingLabel,
  deriveCompetitiveBlockState,
  isCompetitiveBlockOpen,
  isNumberlessTable,
} from "./competitive-block-state";

function match(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    date: new Date("2026-09-05T14:00:00.000Z"),
    home_team: { id: 1235, name: "KCVV Elewijt" },
    away_team: { id: 42, name: "FC Perk" },
    status: "scheduled",
    competitionType: "league",
    ...overrides,
  } as Match;
}

function entry(overrides: Partial<RankingEntry> = {}): RankingEntry {
  return {
    position: 1,
    team_id: 1,
    team_name: "FC Test",
    played: 10,
    won: 6,
    drawn: 2,
    lost: 2,
    goals_for: 20,
    goals_against: 10,
    goal_difference: 10,
    points: 20,
    ...overrides,
  } as RankingEntry;
}

function table(overrides: Partial<RankingTable> = {}): RankingTable {
  return {
    competition_id: 222464,
    competition_name: "3de Afdeling Voetb Vl A",
    entries: [],
    ...overrides,
  } as RankingTable;
}

describe("deriveCompetitiveBlockState", () => {
  it("returns not-in-competition for the null fetch result (no usable PSD id)", () => {
    expect(deriveCompetitiveBlockState(null)).toEqual({
      kind: "not-in-competition",
    });
  });

  it("returns not-in-competition when no fixture is OFFICIAL/league", () => {
    // A tournament-only feed (the historical U9 case) is not a league — the
    // gate must not read this as being in competition.
    const state = deriveCompetitiveBlockState({
      matches: [match({ competitionType: "tournament" })],
      standings: [],
    });
    expect(state).toEqual({ kind: "not-in-competition" });
  });

  it("returns not-in-competition when there are no fixtures at all", () => {
    const state = deriveCompetitiveBlockState({ matches: [], standings: [] });
    expect(state).toEqual({ kind: "not-in-competition" });
  });

  it("does not gate on standings.length: a live fixture with zero ranking rows is still in competition", () => {
    // The A-team's calendar publishes months before its ranking does — the
    // documented #2540 measurement this ticket's gate is proven against.
    const state = deriveCompetitiveBlockState({
      matches: [match({ competitionType: "league" })],
      standings: [],
    });
    expect(state).toEqual({ kind: "no-table" });
  });

  it("returns no-table when in competition but no table has any rows", () => {
    const state = deriveCompetitiveBlockState({
      matches: [match()],
      standings: [table({ entries: [] })],
    });
    expect(state).toEqual({ kind: "no-table" });
  });

  it("returns numberless when every row reads played 0 and points 0", () => {
    const state = deriveCompetitiveBlockState({
      matches: [match()],
      standings: [
        table({
          entries: [
            entry({ played: 0, points: 0, team_id: 1 }),
            entry({ played: 0, points: 0, team_id: 2 }),
          ],
        }),
      ],
    });
    expect(state).toEqual({ kind: "numberless" });
  });

  it("returns live when at least one row carries real numbers", () => {
    const state = deriveCompetitiveBlockState({
      matches: [match()],
      standings: [table({ entries: [entry({ played: 4, points: 9 })] })],
    });
    expect(state).toEqual({ kind: "live" });
  });

  it("returns the block-level live verdict when one of two tables is numberless and the other is live", () => {
    // A youth side crossing the winter break can have a finished autumn
    // poule (live) and a fresh spring one that has not kicked off yet
    // (numberless) at the same time. `deriveCompetitiveBlockState`'s "live"
    // is a BLOCK-level verdict for the nav chip's label (#2605: "Klassement"
    // only when there are points on the page at all) — it does NOT mean
    // every table renders as a full table. `<StandingsSection>` decides that
    // per table via `isNumberlessTable`, independently, from its own
    // `tables` prop (#2636 finding 4 / finding 9).
    const numberlessEntries = [entry({ played: 0, points: 0 })];
    const liveEntries = [entry({ played: 4, points: 9 })];
    const state = deriveCompetitiveBlockState({
      matches: [match()],
      standings: [
        table({ competition_id: 1, entries: numberlessEntries }),
        table({ competition_id: 2, entries: liveEntries }),
      ],
    });
    expect(state).toEqual({ kind: "live" });
    expect(isNumberlessTable(numberlessEntries)).toBe(true);
    expect(isNumberlessTable(liveEntries)).toBe(false);
  });

  it("still returns live when a rowless table sits beside one with real numbers", () => {
    const rowless = table({ competition_id: 1, entries: [] });
    const withRows = table({
      competition_id: 2,
      entries: [entry({ played: 4, points: 9 })],
    });
    const state = deriveCompetitiveBlockState({
      matches: [match()],
      standings: [rowless, withRows],
    });
    expect(state).toEqual({ kind: "live" });
  });

  it("returns fixtures-unavailable for the 'unavailable' sentinel, without reading matches or standings", () => {
    // `fetchBffData` passes this literal when it caught a PERMANENT failure
    // on the FIXTURES read (#2636 finding 3) — a stale/mistyped psdId or an
    // undecodable response. A transient failure never reaches here at all;
    // the render throws instead so ISR can serve the last-good page.
    expect(deriveCompetitiveBlockState("unavailable")).toEqual({
      kind: "fixtures-unavailable",
    });
  });

  it("returns ranking-unavailable when fixtures fulfilled and standings is null (#2795)", () => {
    // `fetchBffData` resolves this shape when the RANKING read failed
    // permanently but the fixtures read fulfilled — the fixtures must not be
    // thrown away, only the klassement slot reports the failure.
    const state = deriveCompetitiveBlockState({
      matches: [match()],
      standings: null,
    });
    expect(state).toEqual({ kind: "ranking-unavailable" });
  });

  it("does not conflate ranking-unavailable (standings: null) with no-table (standings: [])", () => {
    const unavailable = deriveCompetitiveBlockState({
      matches: [match()],
      standings: null,
    });
    const noTable = deriveCompetitiveBlockState({
      matches: [match()],
      standings: [],
    });
    expect(unavailable).toEqual({ kind: "ranking-unavailable" });
    expect(noTable).toEqual({ kind: "no-table" });
    expect(unavailable).not.toEqual(noTable);
  });

  it("returns not-in-competition when standings is null and there is no league fixture either", () => {
    // The fixtures gate is checked before the null-standings read: without a
    // league fixture, a null ranking still collapses to not-in-competition,
    // not ranking-unavailable.
    const state = deriveCompetitiveBlockState({
      matches: [match({ competitionType: "tournament" })],
      standings: null,
    });
    expect(state).toEqual({ kind: "not-in-competition" });
  });
});

describe("isNumberlessTable", () => {
  it("is true when every entry is played 0 / points 0", () => {
    expect(
      isNumberlessTable([
        entry({ played: 0, points: 0, team_id: 1 }),
        entry({ played: 0, points: 0, team_id: 2 }),
      ]),
    ).toBe(true);
  });

  it("is false when at least one entry carries real numbers", () => {
    expect(isNumberlessTable([entry({ played: 4, points: 9 })])).toBe(false);
  });
});

describe("classifyStandingsTables", () => {
  it("reads no-table for an empty array", () => {
    expect(classifyStandingsTables([])).toBe("no-table");
  });

  it("reads no-table when every table is published but rowless", () => {
    expect(classifyStandingsTables([table({ entries: [] })])).toBe("no-table");
  });
});

describe("competitiveBlockHeadingLabel", () => {
  it("reads null for not-in-competition — no nav entry to label", () => {
    expect(
      competitiveBlockHeadingLabel({ kind: "not-in-competition" }),
    ).toBeNull();
  });

  it("reads null for fixtures-unavailable — no nav entry to label", () => {
    expect(
      competitiveBlockHeadingLabel({ kind: "fixtures-unavailable" }),
    ).toBeNull();
  });

  it("reads null for ranking-unavailable — the failure notice earns no nav chip (#2795)", () => {
    expect(
      competitiveBlockHeadingLabel({ kind: "ranking-unavailable" }),
    ).toBeNull();
  });

  it("reads Klassement for a live state", () => {
    expect(competitiveBlockHeadingLabel({ kind: "live" })).toBe("Klassement");
  });

  it("reads De reeks for a no-table state", () => {
    expect(competitiveBlockHeadingLabel({ kind: "no-table" })).toBe("De reeks");
  });

  it("reads De reeks for a numberless state", () => {
    expect(competitiveBlockHeadingLabel({ kind: "numberless" })).toBe(
      "De reeks",
    );
  });
});

describe("isCompetitiveBlockOpen", () => {
  it("is false for not-in-competition", () => {
    expect(isCompetitiveBlockOpen({ kind: "not-in-competition" })).toBe(false);
  });

  it("is false for fixtures-unavailable", () => {
    expect(isCompetitiveBlockOpen({ kind: "fixtures-unavailable" })).toBe(
      false,
    );
  });

  it("is true for ranking-unavailable — #wedstrijden must still render (#2795)", () => {
    // This is the load-bearing case: with the fixtures read fulfilled and
    // only the ranking read permanently failed, the block stays "open" so
    // `#wedstrijden` renders in full — `competitiveBlockHeadingLabel` alone
    // (null for this state) must never be used to derive this flag.
    expect(isCompetitiveBlockOpen({ kind: "ranking-unavailable" })).toBe(true);
  });

  it("is true for no-table", () => {
    expect(isCompetitiveBlockOpen({ kind: "no-table" })).toBe(true);
  });

  it("is true for numberless", () => {
    expect(isCompetitiveBlockOpen({ kind: "numberless" })).toBe(true);
  });

  it("is true for live", () => {
    expect(isCompetitiveBlockOpen({ kind: "live" })).toBe(true);
  });
});
