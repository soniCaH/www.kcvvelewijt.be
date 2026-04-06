import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type {
  TEAMS_QUERY_RESULT,
  TEAM_BY_SLUG_QUERY_RESULT,
  TEAMS_LANDING_QUERY_RESULT,
} from "../sanity/sanity.types";

// Mock the sanity client before importing the repository
vi.mock("../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import { sanityClient } from "../sanity/client";
import {
  TeamRepository,
  TeamRepositoryLive,
  type TeamNavVM,
  type StaffMemberVM,
  type YouthTeamForContactVM,
} from "./team.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, TeamRepository>) {
  return Effect.runPromise(Effect.provide(effect, TeamRepositoryLive));
}

// Fixture: a team row as returned by TEAMS_QUERY
function makeTeamRow(
  overrides: Partial<TEAMS_QUERY_RESULT[number]> = {},
): TEAMS_QUERY_RESULT[number] {
  return {
    _id: "team-1",
    psdId: "100",
    name: "Eerste Elftallen A",
    slug: "eerste-elftallen-a",
    age: "A",
    gender: "male",
    footbelId: 12345,
    division: "3de Afdeling",
    divisionFull: "3de Afdeling VFV A",
    tagline: "Er is maar één plezante compagnie",
    teamImageUrl: "https://cdn.sanity.io/team.webp",
    ...overrides,
  };
}

describe("TeamRepository", () => {
  describe("findAll", () => {
    it("maps all TeamNavVM fields correctly from GROQ result", async () => {
      const row = makeTeamRow();
      mockFetch.mockResolvedValueOnce([row]);

      const teams = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findAll();
        }),
      );

      expect(teams).toHaveLength(1);
      const t = teams[0];
      expect(t).toEqual<TeamNavVM>({
        id: "team-1",
        name: "Eerste Elftallen A",
        slug: "eerste-elftallen-a",
        age: "A",
        psdId: "100",
        division: "3de Afdeling",
        divisionFull: "3de Afdeling VFV A",
        tagline: "Er is maar één plezante compagnie",
        teamImageUrl: "https://cdn.sanity.io/team.webp",
      });
    });

    it("handles null fields gracefully", async () => {
      mockFetch.mockResolvedValueOnce([
        makeTeamRow({
          name: null,
          slug: null,
          age: null,
          psdId: null,
          division: null,
          divisionFull: null,
          tagline: null,
          teamImageUrl: null,
        }),
      ]);

      const [t] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findAll();
        }),
      );

      expect(t.name).toBe("");
      expect(t.slug).toBe("");
      expect(t.age).toBeNull();
      expect(t.psdId).toBeNull();
      expect(t.division).toBeNull();
      expect(t.divisionFull).toBeNull();
      expect(t.tagline).toBeNull();
      expect(t.teamImageUrl).toBeNull();
    });
  });

  describe("findBySlug", () => {
    // The generated type is `{ ... } | null`, so we need the non-null shape
    type TeamDetailRow = Exclude<TEAM_BY_SLUG_QUERY_RESULT, null>;

    function makeDetailRow(
      overrides: Partial<TeamDetailRow> = {},
    ): TeamDetailRow {
      return {
        _id: "team-1",
        psdId: "100",
        name: "Eerste Elftallen A",
        slug: "eerste-elftallen-a",
        age: "A",
        gender: "male",
        footbelId: 12345,
        division: "3de Afdeling",
        divisionFull: "3de Afdeling VFV A",
        tagline: "Er is maar één plezante compagnie",
        teamImageUrl: "https://cdn.sanity.io/team.webp",
        body: null,
        contactInfo: null,
        trainingSchedule: null,
        players: [
          {
            _id: "player-1",
            psdId: "42",
            firstName: "Jan",
            lastName: "Janssens",
            jerseyNumber: 7,
            keeper: false,
            positionPsd: "Middenvelder",
            position: "Aanvaller",
            psdImageUrl: "https://cdn.sanity.io/psd.webp",
            transparentImageUrl: "https://cdn.sanity.io/transparent.webp",
          },
        ],
        staff: [
          {
            role: null,
            member: {
              _id: "staff-1",
              firstName: "Piet",
              lastName: "Pieters",
              functionTitle: null,
              photoUrl: "https://cdn.sanity.io/photo.webp",
            },
          },
        ],
        ...overrides,
      };
    }

    it("maps TeamDetailVM fields correctly from GROQ result", async () => {
      mockFetch.mockResolvedValueOnce(makeDetailRow());

      const team = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findBySlug("eerste-elftallen-a");
        }),
      );

      expect(team).not.toBeNull();
      const t = team!;

      // Core fields
      expect(t.id).toBe("team-1");
      expect(t.name).toBe("Eerste Elftallen A");
      expect(t.slug).toBe("eerste-elftallen-a");
      expect(t.psdId).toBe("100");
      expect(t.teamImageUrl).toBe("https://cdn.sanity.io/team.webp");

      // Computed fields (absorbed from utils.ts)
      expect(t.tagline).toBe("Er is maar één plezante compagnie");
      expect(t.teamType).toBe("senior");
      expect(t.ageGroup).toBeUndefined(); // "A" doesn't match U-pattern

      // Players transformed to PlayerVM
      expect(t.players).toHaveLength(1);
      expect(t.players[0].firstName).toBe("Jan");
      expect(t.players[0].position).toBe("Aanvaller");
      expect(t.players[0].imageUrl).toBe(
        "https://cdn.sanity.io/transparent.webp",
      );
      expect(t.players[0].href).toBe("/spelers/42");

      // Staff transformed to StaffMemberVM
      expect(t.staff).toHaveLength(1);
      expect(t.staff[0]).toEqual<StaffMemberVM>({
        id: "staff-1",
        firstName: "Piet",
        lastName: "Pieters",
        role: "",
        imageUrl: "https://cdn.sanity.io/photo.webp",
      });
    });

    it("computes tagline fallback: tagline → divisionFull → division", async () => {
      // tagline null → falls back to divisionFull
      mockFetch.mockResolvedValueOnce(makeDetailRow({ tagline: null }));
      const t1 = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findBySlug("test");
        }),
      );
      expect(t1!.tagline).toBe("3de Afdeling VFV A");

      // tagline + divisionFull null → falls back to division
      mockFetch.mockResolvedValueOnce(
        makeDetailRow({ tagline: null, divisionFull: null }),
      );
      const t2 = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findBySlug("test");
        }),
      );
      expect(t2!.tagline).toBe("3de Afdeling");

      // all null → undefined
      mockFetch.mockResolvedValueOnce(
        makeDetailRow({
          tagline: null,
          divisionFull: null,
          division: null,
        }),
      );
      const t3 = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findBySlug("test");
        }),
      );
      expect(t3!.tagline).toBeUndefined();
    });

    it("computes teamType: youth for U-ages, senior otherwise", async () => {
      mockFetch.mockResolvedValueOnce(makeDetailRow({ age: "U15" }));
      const t1 = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findBySlug("test");
        }),
      );
      expect(t1!.teamType).toBe("youth");
      expect(t1!.ageGroup).toBe("U15");

      mockFetch.mockResolvedValueOnce(makeDetailRow({ age: "A" }));
      const t2 = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findBySlug("test");
        }),
      );
      expect(t2!.teamType).toBe("senior");
    });

    it("handles null players and staff arrays", async () => {
      mockFetch.mockResolvedValueOnce(
        makeDetailRow({ players: null, staff: null }),
      );

      const t = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(t!.players).toEqual([]);
      expect(t!.staff).toEqual([]);
    });

    it("filters out staff entries with null member", async () => {
      mockFetch.mockResolvedValueOnce(
        makeDetailRow({
          staff: [
            {
              role: null,
              member: null,
            },
            {
              role: "trainer",
              member: {
                _id: "staff-2",
                firstName: "Jan",
                lastName: "Janssens",
                functionTitle: "T1",
                photoUrl: null,
              },
            },
          ],
        }),
      );

      const t = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(t!.staff).toHaveLength(1);
      expect(t!.staff[0].id).toBe("staff-2");
    });

    it("staff with null photoUrl gets undefined imageUrl", async () => {
      mockFetch.mockResolvedValueOnce(
        makeDetailRow({
          staff: [
            {
              role: null,
              member: {
                _id: "s1",
                firstName: "A",
                lastName: "B",
                functionTitle: null,
                photoUrl: null,
              },
            },
          ],
        }),
      );

      const t = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(t!.staff[0].imageUrl).toBeUndefined();
    });

    it("returns null for unknown slug", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findBySlug("unknown-slug");
        }),
      );

      expect(result).toBeNull();
    });
  });

  describe("findYouthTeamsForContact", () => {
    it("maps youth teams with staff contact info", async () => {
      mockFetch.mockResolvedValueOnce([
        {
          _id: "team-u13",
          name: "U13A",
          slug: "u13a",
          age: "U13",
          staff: [
            {
              role: "trainer",
              member: {
                _id: "staff-1",
                firstName: "Jan",
                lastName: "Janssens",
                email: "jan@kcvv.be",
                phone: "+32 123",
              },
            },
            {
              role: "afgevaardigde",
              member: {
                _id: "staff-2",
                firstName: "Piet",
                lastName: "Pieters",
                email: "piet@kcvv.be",
                phone: null,
              },
            },
          ],
        },
      ]);

      const teams = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findYouthTeamsForContact();
        }),
      );

      expect(teams).toHaveLength(1);
      expect(teams[0]).toEqual<YouthTeamForContactVM>({
        id: "team-u13",
        name: "U13A",
        slug: "u13a",
        age: "U13",
        staff: [
          {
            id: "staff-1",
            firstName: "Jan",
            lastName: "Janssens",
            role: "trainer",
            email: "jan@kcvv.be",
            phone: "+32 123",
          },
          {
            id: "staff-2",
            firstName: "Piet",
            lastName: "Pieters",
            role: "afgevaardigde",
            email: "piet@kcvv.be",
          },
        ],
      });
    });

    it("filters out staff entries with null member", async () => {
      mockFetch.mockResolvedValueOnce([
        {
          _id: "team-u9",
          name: "U9A",
          slug: "u9a",
          age: "U9",
          staff: [
            { role: "trainer", member: null },
            {
              role: "afgevaardigde",
              member: {
                _id: "staff-3",
                firstName: "Kim",
                lastName: "De Smet",
                email: null,
                phone: null,
              },
            },
          ],
        },
      ]);

      const teams = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findYouthTeamsForContact();
        }),
      );

      expect(teams[0].staff).toHaveLength(1);
      expect(teams[0].staff[0].id).toBe("staff-3");
      expect(teams[0].staff[0].email).toBeUndefined();
      expect(teams[0].staff[0].phone).toBeUndefined();
    });

    it("filters out staff entries with null role", async () => {
      mockFetch.mockResolvedValueOnce([
        {
          _id: "team-u11",
          name: "U11A",
          slug: "u11a",
          age: "U11",
          staff: [
            {
              role: null,
              member: {
                _id: "staff-no-role",
                firstName: "Tom",
                lastName: "Bakker",
                email: "tom@kcvv.be",
                phone: null,
              },
            },
            {
              role: "trainer",
              member: {
                _id: "staff-with-role",
                firstName: "Jan",
                lastName: "Janssens",
                email: null,
                phone: null,
              },
            },
          ],
        },
      ]);

      const teams = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findYouthTeamsForContact();
        }),
      );

      expect(teams[0].staff).toHaveLength(1);
      expect(teams[0].staff[0].id).toBe("staff-with-role");
    });

    it("handles null staff array", async () => {
      mockFetch.mockResolvedValueOnce([
        { _id: "team-u7", name: "U7A", slug: "u7a", age: "U7", staff: null },
      ]);

      const teams = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findYouthTeamsForContact();
        }),
      );

      expect(teams[0].staff).toEqual([]);
    });
  });

  describe("findAllForLanding", () => {
    function makeLandingRow(
      overrides: Partial<TEAMS_LANDING_QUERY_RESULT[number]> = {},
    ): TEAMS_LANDING_QUERY_RESULT[number] {
      return {
        _id: "team-1",
        name: "Eerste Elftallen A",
        slug: "eerste-elftallen-a",
        age: "A",
        division: "3de Afdeling",
        divisionFull: "3de Afdeling VFV A",
        tagline: "Er is maar één plezante compagnie",
        teamImageUrl: "https://cdn.sanity.io/team.webp",
        staff: [
          {
            role: null,
            member: {
              firstName: "Piet",
              lastName: "Pieters",
              functionTitle: null,
            },
          },
        ],
        ...overrides,
      };
    }

    it("maps landing rows to TeamLandingItem[]", async () => {
      mockFetch.mockResolvedValueOnce([makeLandingRow()]);

      const teams = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findAllForLanding();
        }),
      );

      expect(teams).toHaveLength(1);
      expect(teams[0]).toEqual({
        _id: "team-1",
        name: "Eerste Elftallen A",
        slug: "eerste-elftallen-a",
        age: "A",
        division: "3de Afdeling",
        divisionFull: "3de Afdeling VFV A",
        tagline: "Er is maar één plezante compagnie",
        teamImageUrl: "https://cdn.sanity.io/team.webp",
        staff: [{ firstName: "Piet", lastName: "Pieters", role: "" }],
      });
    });

    it("handles null fields by providing defaults", async () => {
      mockFetch.mockResolvedValueOnce([
        makeLandingRow({
          name: null,
          slug: null,
          age: null,
          division: null,
          divisionFull: null,
          tagline: null,
          teamImageUrl: null,
          staff: null,
        }),
      ]);

      const [t] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findAllForLanding();
        }),
      );

      expect(t.name).toBe("");
      expect(t.slug).toBe("");
      expect(t.age).toBe("");
      expect(t.staff).toBeNull();
    });
  });
});
