import { describe, it, expect } from "vitest";
import type { Match } from "@/lib/effect/schemas";
import type { ScheduleMatch } from "@/components/match/types";
import type { FirstTeamVM } from "./first-teams";
import { asNonPlaceholder } from "@/components/match/test-narrowing";

import {
  deriveFirstTeamVM,
  firstTeamsHeading,
  selectSeniorTeams,
  SETTLED_LOOKAHEAD_MS,
} from "./first-teams";
import { RESERVEN_PSD_ID } from "@/lib/utils/group-teams";

// The row label moved to `teamDisplayName` (#2630) — covered by
// `src/lib/utils/team-display-name.test.ts`, which also guards the other
// seventeen routes this block never saw.

describe("selectSeniorTeams", () => {
  const A = { psdId: "1235", age: "A", slug: "eerste-elftallen-a" };
  const B = { psdId: "1236", age: "A", slug: "eerste-elftallen-b" };
  // Reserven's Sanity `age` is "A", the same senior code the first teams carry.
  const RESERVEN = { psdId: RESERVEN_PSD_ID, age: "A", slug: "reserven" };
  const U15 = { psdId: "222", age: "U15", slug: "u15" };

  it("keeps only A and B, in that order", () => {
    expect(selectSeniorTeams([B, U15, RESERVEN, A])).toEqual([A, B]);
  });

  it("drops Reserven even though its age is a senior code", () => {
    expect(selectSeniorTeams([RESERVEN])).toEqual([]);
  });
});

const NOW = new Date("2026-06-23T12:00:00Z");

/** Minimal structural Match factory — the derive logic only reads these fields. */
function match(p: {
  id: number;
  date: string;
  status: Match["status"];
  isHome?: boolean;
  homeName?: string;
  awayName?: string;
  homeScore?: number;
  awayScore?: number;
  time?: string;
  competition?: string;
  isReservation?: boolean;
}): Match {
  return {
    id: p.id,
    date: new Date(p.date),
    time: p.time,
    home_team: { id: 1, name: p.homeName ?? "Home", score: p.homeScore },
    away_team: { id: 2, name: p.awayName ?? "Away", score: p.awayScore },
    status: p.status,
    competition: p.competition,
    is_home: p.isHome,
    is_placeholder: p.isReservation,
  } as unknown as Match;
}

const team = { label: "A-ploeg", slug: "a-ploeg", division: "3de Nationale" };

describe("deriveFirstTeamVM", () => {
  it("picks the most recent played match as the result", () => {
    const vm = deriveFirstTeamVM(
      team,
      [
        match({
          id: 1,
          date: "2026-06-01T15:00:00Z",
          status: "finished",
          isHome: true,
          homeScore: 1,
          awayScore: 0,
        }),
        match({
          id: 2,
          date: "2026-06-15T15:00:00Z",
          status: "finished",
          isHome: true,
          homeScore: 3,
          awayScore: 1,
        }),
        match({
          id: 3,
          date: "2026-06-08T15:00:00Z",
          status: "finished",
          isHome: false,
          homeScore: 2,
          awayScore: 2,
        }),
      ],
      NOW,
    );
    expect(vm.result?.id).toBe(2);
    expect(asNonPlaceholder(vm.result).homeScore).toBe(3);
    expect(asNonPlaceholder(vm.result).awayScore).toBe(1);
    // Emitted as a ScheduleMatch so it can render via the shared <TeamAgendaRow>.
    expect(vm.result?.status).toBe("finished");
  });

  it("picks the earliest upcoming scheduled match as the fixture", () => {
    const vm = deriveFirstTeamVM(
      team,
      [
        match({ id: 10, date: "2026-07-05T15:00:00Z", status: "scheduled" }),
        match({ id: 11, date: "2026-06-29T15:00:00Z", status: "scheduled" }),
      ],
      NOW,
    );
    expect(vm.fixture?.id).toBe(11);
    expect(vm.fixture?.status).toBe("scheduled");
  });

  it("ignores future matches for result and past matches for fixture", () => {
    const vm = deriveFirstTeamVM(
      team,
      [
        match({ id: 20, date: "2026-06-29T15:00:00Z", status: "scheduled" }),
        match({
          id: 21,
          date: "2026-06-10T15:00:00Z",
          status: "finished",
          isHome: true,
          homeScore: 0,
          awayScore: 0,
        }),
        // A past scheduled match is never a fixture. It is a result candidate
        // since #2390, but an older one loses to the finished match below.
        match({ id: 22, date: "2026-06-01T15:00:00Z", status: "scheduled" }),
      ],
      NOW,
    );
    expect(vm.result?.id).toBe(21);
    expect(vm.fixture?.id).toBe(20);
  });

  it("carries both sides + isHome onto the result ScheduleMatch", () => {
    // Outcome is no longer derived here — <TeamAgendaRow> recomputes it from
    // scores + isHome + status. The derivation must forward those fields intact.
    const vm = deriveFirstTeamVM(
      team,
      [
        match({
          id: 1,
          date: "2026-06-10T15:00:00Z",
          status: "finished",
          isHome: false,
          homeName: "Overijse",
          awayName: "KCVV",
          homeScore: 2,
          awayScore: 0,
        }),
      ],
      NOW,
    );
    expect(asNonPlaceholder(vm.result).homeTeam.name).toBe("Overijse");
    expect(asNonPlaceholder(vm.result).awayTeam.name).toBe("KCVV");
    expect(asNonPlaceholder(vm.result).isHome).toBe(false);
    expect(asNonPlaceholder(vm.result).homeScore).toBe(2);
    expect(asNonPlaceholder(vm.result).awayScore).toBe(0);
  });

  it("keeps both fixture sides so the row can pick the opponent from isHome", () => {
    const home = deriveFirstTeamVM(
      team,
      [
        match({
          id: 1,
          date: "2026-06-29T15:00:00Z",
          status: "scheduled",
          isHome: true,
          homeName: "KCVV",
          awayName: "Hasselt",
        }),
      ],
      NOW,
    );
    expect(asNonPlaceholder(home.fixture).homeTeam.name).toBe("KCVV");
    expect(asNonPlaceholder(home.fixture).awayTeam.name).toBe("Hasselt");
    expect(asNonPlaceholder(home.fixture).isHome).toBe(true);

    const away = deriveFirstTeamVM(
      team,
      [
        match({
          id: 2,
          date: "2026-06-29T15:00:00Z",
          status: "scheduled",
          isHome: false,
          homeName: "Overijse",
          awayName: "KCVV",
        }),
      ],
      NOW,
    );
    expect(asNonPlaceholder(away.fixture).homeTeam.name).toBe("Overijse");
    expect(asNonPlaceholder(away.fixture).isHome).toBe(false);
  });

  it("omits result/fixture when absent and never drops the team identity", () => {
    const onlyResult = deriveFirstTeamVM(
      team,
      [
        match({
          id: 1,
          date: "2026-06-10T15:00:00Z",
          status: "finished",
          isHome: true,
          homeScore: 1,
          awayScore: 0,
        }),
      ],
      NOW,
    );
    expect(onlyResult.result).toBeDefined();
    expect(onlyResult.fixture).toBeUndefined();

    const empty = deriveFirstTeamVM(team, [], NOW);
    expect(empty.result).toBeUndefined();
    expect(empty.fixture).toBeUndefined();
    expect(empty.label).toBe("A-ploeg");
    expect(empty.division).toBe("3de Nationale");
  });

  // #2423 — four of the six `MatchStatus` members matched neither predicate, so
  // a forfeited / postponed / cancelled / stopped match was invisible in both
  // slots. Only `forfeited` belongs in one; the rest are excluded on purpose.
  describe("non-scheduled, non-finished statuses (#2423)", () => {
    it("selects a forfeited match settled before its kickoff as the result", () => {
      // The live case: a cup tie awarded 5-0 by forfeit ~8h before kickoff.
      const vm = deriveFirstTeamVM(
        team,
        [
          match({
            id: 1,
            date: "2026-06-20T15:00:00Z",
            status: "finished",
            isHome: true,
            homeScore: 1,
            awayScore: 5,
          }),
          match({
            id: 2,
            date: "2026-06-23T16:30:00Z",
            status: "forfeited",
            isHome: false,
            homeScore: 5,
            awayScore: 0,
          }),
        ],
        NOW,
      );
      expect(vm.result?.id).toBe(2);
      expect(asNonPlaceholder(vm.result).homeScore).toBe(5);
      expect(vm.fixture).toBeUndefined();
    });

    it("selects a forfeited match whose kickoff has passed as the result", () => {
      const vm = deriveFirstTeamVM(
        team,
        [
          match({
            id: 1,
            date: "2026-06-10T15:00:00Z",
            status: "forfeited",
            isHome: true,
            homeScore: 0,
            awayScore: 5,
          }),
        ],
        NOW,
      );
      expect(vm.result?.id).toBe(1);
    });

    it("excludes a stopped match — an abandoned scoreline is not a result", () => {
      // A match abandoned at 2-1 may be replayed; headlining it would publish a
      // score that never counted. Same reasoning as `postponed`.
      const vm = deriveFirstTeamVM(
        team,
        [
          match({
            id: 1,
            date: "2026-06-10T15:00:00Z",
            status: "stopped",
            isHome: true,
            homeScore: 2,
            awayScore: 1,
          }),
        ],
        NOW,
      );
      expect(vm.result).toBeUndefined();
      expect(vm.fixture).toBeUndefined();
    });

    it("does not let a far-future forfeit displace the genuine last result", () => {
      // `forfait général`: a withdrawing club has every remaining fixture
      // stamped 5-0 at once. Those must not outrank last Saturday's real win.
      const vm = deriveFirstTeamVM(
        team,
        [
          match({
            id: 1,
            date: "2026-06-20T15:00:00Z",
            status: "finished",
            isHome: true,
            homeScore: 3,
            awayScore: 1,
          }),
          match({
            id: 2,
            date: "2026-11-24T15:00:00Z",
            status: "forfeited",
            isHome: true,
            homeScore: 5,
            awayScore: 0,
          }),
        ],
        NOW,
      );
      expect(vm.result?.id).toBe(1);
    });

    it("admits a settled forfeit exactly on the lookahead boundary", () => {
      const vm = deriveFirstTeamVM(
        team,
        [
          match({
            id: 1,
            date: new Date(NOW.getTime() + SETTLED_LOOKAHEAD_MS).toISOString(),
            status: "forfeited",
            isHome: true,
            homeScore: 5,
            awayScore: 0,
          }),
        ],
        NOW,
      );
      expect(vm.result?.id).toBe(1);
    });

    it("keeps a future played match without a scoreline out of the result slot", () => {
      // Nothing is settled yet, so it must not headline with a kickoff time in
      // the result slot — it stays out until its kickoff has passed.
      const vm = deriveFirstTeamVM(
        team,
        [match({ id: 1, date: "2026-06-29T15:00:00Z", status: "forfeited" })],
        NOW,
      );
      expect(vm.result).toBeUndefined();
    });

    it.each(["postponed", "cancelled"] as const)(
      "excludes a %s match from both slots and falls through to the next real one",
      (status) => {
        const vm = deriveFirstTeamVM(
          team,
          [
            match({ id: 1, date: "2026-06-25T15:00:00Z", status }),
            match({ id: 2, date: "2026-06-29T15:00:00Z", status: "scheduled" }),
          ],
          NOW,
        );
        expect(vm.result).toBeUndefined();
        expect(vm.fixture?.id).toBe(2);
      },
    );
  });

  // #2390 — between kickoff and PSD publishing the result, a match is still
  // `scheduled` with a past date, so it fell out of both slots and the club's
  // most recent match was nowhere on the homepage for the hours that matters
  // most (the evening after it was played).
  describe("kicked off, result not yet published (#2390)", () => {
    it("headlines a kicked-off match in the result slot without a scoreline", () => {
      const vm = deriveFirstTeamVM(
        team,
        [
          match({
            id: 1,
            date: "2026-06-22T19:30:00Z",
            status: "scheduled",
            isHome: true,
            homeName: "KCVV Elewijt B",
            awayName: "FC Zemst Sportief",
          }),
        ],
        NOW,
      );
      expect(vm.result?.id).toBe(1);
      expect(vm.result?.status).toBe("scheduled");
      expect(asNonPlaceholder(vm.result).homeScore).toBeUndefined();
      expect(asNonPlaceholder(vm.result).awayScore).toBeUndefined();
    });

    it("does not also leave it in the fixture slot", () => {
      // The awaiting-result match belongs to one slot only; the fixture slot
      // keeps answering "where do I go next".
      const vm = deriveFirstTeamVM(
        team,
        [
          match({ id: 1, date: "2026-06-22T19:30:00Z", status: "scheduled" }),
          match({ id: 2, date: "2026-06-29T15:00:00Z", status: "scheduled" }),
        ],
        NOW,
      );
      expect(vm.result?.id).toBe(1);
      expect(vm.fixture?.id).toBe(2);
    });

    it("yields the slot to a more recent finished match on the same day", () => {
      const vm = deriveFirstTeamVM(
        team,
        [
          match({
            id: 1,
            date: "2026-06-23T09:00:00Z",
            status: "scheduled",
          }),
          match({
            id: 2,
            date: "2026-06-23T11:00:00Z",
            status: "finished",
            isHome: true,
            homeScore: 2,
            awayScore: 1,
          }),
        ],
        NOW,
      );
      expect(vm.result?.id).toBe(2);
      expect(asNonPlaceholder(vm.result).homeScore).toBe(2);
    });

    it("outranks an older finished match", () => {
      const vm = deriveFirstTeamVM(
        team,
        [
          match({
            id: 1,
            date: "2026-06-16T15:00:00Z",
            status: "finished",
            isHome: true,
            homeScore: 3,
            awayScore: 1,
          }),
          match({ id: 2, date: "2026-06-22T19:30:00Z", status: "scheduled" }),
        ],
        NOW,
      );
      expect(vm.result?.id).toBe(2);
    });

    // Past-dated is the new coverage: the #2423 block only dates these two
    // ahead of `NOW`, so nothing there would catch a `date < now`-alone
    // implementation. (`stopped` is already covered past-dated above.)
    it.each(["postponed", "cancelled"] as const)(
      "still skips a past %s match — only a kickoff that happened qualifies",
      (status) => {
        const vm = deriveFirstTeamVM(
          team,
          [match({ id: 1, date: "2026-06-22T19:30:00Z", status })],
          NOW,
        );
        expect(vm.result).toBeUndefined();
      },
    );

    it("keeps a not-yet-kicked-off scheduled match out of the result slot", () => {
      const vm = deriveFirstTeamVM(
        team,
        [match({ id: 1, date: "2026-06-29T15:00:00Z", status: "scheduled" })],
        NOW,
      );
      expect(vm.result).toBeUndefined();
      expect(vm.fixture?.id).toBe(1);
    });
  });

  it("leaves scores undefined on the ScheduleMatch when the source has none", () => {
    // A finished match without a recorded scoreline stays scoreless — the row
    // then falls back to the kickoff time rather than inventing an outcome
    // (not "Uitslag volgt": PSD closed it, a score may never come — #2587).
    const noScore = deriveFirstTeamVM(
      team,
      [
        match({
          id: 1,
          date: "2026-06-10T15:00:00Z",
          status: "finished",
          isHome: true,
        }),
      ],
      NOW,
    );
    expect(asNonPlaceholder(noScore.result).homeScore).toBeUndefined();
    expect(asNonPlaceholder(noScore.result).awayScore).toBeUndefined();
  });

  // #2606, #2688 — a reservation carries no result vocabulary at all, on any
  // status or any date. Before #2688 a past-dated (but still `scheduled`)
  // reservation fell into the result slot the same way a kicked-off match
  // does (#2390), headlining the homepage's "Laatste uitslag" column reading
  // "UITSLAG · TORNOOI".
  describe("pitch-reservation placeholder (#2606, #2688)", () => {
    it("routes a past-dated reservation to the fixture slot, never the result slot", () => {
      const vm = deriveFirstTeamVM(
        team,
        [
          match({
            id: 90,
            date: "2026-06-01T09:30:00Z", // well before NOW (2026-06-23)
            status: "scheduled",
            competition: "Tornooi",
            isReservation: true,
          }),
        ],
        NOW,
      );
      expect(vm.result).toBeUndefined();
      expect(vm.fixture?.id).toBe(90);
      expect(vm.fixture?.kind).toBe("reservation");
    });

    it("routes a future-dated reservation to the fixture slot too", () => {
      const vm = deriveFirstTeamVM(
        team,
        [
          match({
            id: 91,
            date: "2026-07-01T09:30:00Z",
            status: "scheduled",
            competition: "Tornooi",
            isReservation: true,
          }),
        ],
        NOW,
      );
      expect(vm.fixture?.id).toBe(91);
    });

    it("drops a cancelled reservation from both slots — same rule as a real cancelled match", () => {
      const vm = deriveFirstTeamVM(
        team,
        [
          match({
            id: 92,
            date: "2026-06-01T09:30:00Z",
            status: "cancelled",
            competition: "Tornooi",
            isReservation: true,
          }),
        ],
        NOW,
      );
      expect(vm.result).toBeUndefined();
      expect(vm.fixture).toBeUndefined();
    });
  });
});

describe("firstTeamsHeading", () => {
  // Tuesday 2026-06-23 12:00 UTC — every case below is relative to this.
  const TUESDAY = new Date("2026-06-23T12:00:00Z");

  /** Only `fixture.date` is read, so the rest of the VM stays structural. */
  function team(fixtureIso?: string): FirstTeamVM {
    return {
      label: "A-ploeg",
      slug: "eerste-elftallen-a",
      ...(fixtureIso
        ? { fixture: { date: new Date(fixtureIso) } as ScheduleMatch }
        : {}),
    };
  }

  it("says 'Dit weekend.' for a Saturday fixture inside the window", () => {
    expect(firstTeamsHeading([team("2026-06-27T19:00:00Z")], TUESDAY)).toBe(
      "Dit weekend.",
    );
  });

  it("says 'Dit weekend.' for a Sunday fixture inside the window", () => {
    expect(firstTeamsHeading([team("2026-06-28T15:00:00Z")], TUESDAY)).toBe(
      "Dit weekend.",
    );
  });

  // The #2392 regression: a midweek cup tie is not "dit weekend".
  it("says 'Volgende wedstrijd.' for a midweek fixture inside the window", () => {
    expect(firstTeamsHeading([team("2026-06-24T19:30:00Z")], TUESDAY)).toBe(
      "Volgende wedstrijd.",
    );
  });

  it("says 'Volgende wedstrijd.' for a Saturday fixture beyond the window", () => {
    expect(firstTeamsHeading([team("2026-07-04T19:00:00Z")], TUESDAY)).toBe(
      "Volgende wedstrijd.",
    );
  });

  it("picks the soonest fixture across teams", () => {
    const teams = [team("2026-06-27T19:00:00Z"), team("2026-06-24T19:30:00Z")];
    expect(firstTeamsHeading(teams, TUESDAY)).toBe("Volgende wedstrijd.");
  });

  it("says 'Volgende wedstrijd.' when no team has a fixture", () => {
    expect(firstTeamsHeading([team(), team()], TUESDAY)).toBe(
      "Volgende wedstrijd.",
    );
    expect(firstTeamsHeading([], TUESDAY)).toBe("Volgende wedstrijd.");
  });

  // The BFF packs the Belgian kickoff wall-clock into the Date's UTC fields, so
  // a late Sunday kickoff must stay Sunday. Re-zoning to Europe/Brussels would
  // add a phantom +2h and roll it into Monday.
  it("keeps a late Sunday kickoff on the weekend", () => {
    expect(firstTeamsHeading([team("2026-06-28T22:30:00Z")], TUESDAY)).toBe(
      "Dit weekend.",
    );
  });
});
