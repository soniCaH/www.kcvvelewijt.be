import { describe, it, expect } from "vitest";
import {
  groupTeamsForLanding,
  getYouthDivision,
  getYouthDivisionTone,
  isAgeCode,
  type TeamLandingItem,
} from "./group-teams";

const makeTeam = (
  overrides: Partial<TeamLandingItem> = {},
): TeamLandingItem => ({
  _id: overrides._id ?? "id-1",
  name: overrides.name ?? "Test Team",
  displayName: overrides.displayName ?? overrides.name ?? "Test Team",
  slug: overrides.slug ?? "test-team",
  age: overrides.age ?? "A",
  psdId: overrides.psdId ?? null,
  division: overrides.division ?? null,
  divisionFull: overrides.divisionFull ?? null,
  tagline: overrides.tagline ?? null,
  teamImageUrl: overrides.teamImageUrl ?? null,
  staff: overrides.staff ?? null,
});

/**
 * Look a division up by label rather than index — `youthByDivision` leads with
 * the Reserven group (#2414), so positional assertions drift.
 */
const divisionGroup = (teams: TeamLandingItem[], label: string) =>
  groupTeamsForLanding(teams).youthByDivision.find((d) => d.label === label)!;

describe("groupTeamsForLanding", () => {
  it("should extract A-team and B-team by name suffix (both have age 'A')", () => {
    const teams = [
      makeTeam({ _id: "a", age: "A", name: "Eerste Elftallen A" }),
      makeTeam({ _id: "b", age: "A", name: "Eerste Elftallen B" }),
      makeTeam({ _id: "u15", age: "U15", name: "KCVV Elewijt U15" }),
    ];

    const result = groupTeamsForLanding(teams);

    expect(result.aTeam?.name).toBe("Eerste Elftallen A");
    expect(result.bTeam?.name).toBe("Eerste Elftallen B");
  });

  it("should group youth teams into Bovenbouw, Middenbouw, Onderbouw", () => {
    const teams = [
      makeTeam({ _id: "u21", age: "U21", name: "KCVV Elewijt U21" }),
      makeTeam({ _id: "u17", age: "U17", name: "KCVV Elewijt U17" }),
      makeTeam({ _id: "u13", age: "U13", name: "KCVV Elewijt U13" }),
      makeTeam({ _id: "u10", age: "U10", name: "KCVV Elewijt U10" }),
      makeTeam({ _id: "u9", age: "U9", name: "KCVV Elewijt U9" }),
      makeTeam({ _id: "u6", age: "U6", name: "KCVV Elewijt U6" }),
    ];

    const result = groupTeamsForLanding(teams);

    // Reserven leads, then the three bouw groups small → large.
    expect(result.youthByDivision.map((d) => d.label)).toEqual([
      "Reserven",
      "Onderbouw",
      "Middenbouw",
      "Bovenbouw",
    ]);

    expect(divisionGroup(teams, "Bovenbouw").range).toBe("U17–U21");
    expect(divisionGroup(teams, "Bovenbouw").teams.map((t) => t.age)).toEqual([
      "U17",
      "U21",
    ]);

    expect(divisionGroup(teams, "Middenbouw").range).toBe("U12–U16");
    expect(divisionGroup(teams, "Middenbouw").teams.map((t) => t.age)).toEqual([
      "U13",
    ]);

    expect(divisionGroup(teams, "Onderbouw").range).toBe("U6–U11");
    expect(divisionGroup(teams, "Onderbouw").teams.map((t) => t.age)).toEqual([
      "U6",
      "U9",
      "U10",
    ]);
  });

  it("should group the reserves by psdId, with no age range", () => {
    const teams = [
      makeTeam({ _id: "a", age: "A", name: "Eerste Elftallen A" }),
      makeTeam({
        _id: "res",
        age: "A",
        psdId: "34",
        name: "Reserven",
        slug: "reserven",
      }),
      makeTeam({ _id: "u15", age: "U15", name: "KCVV Elewijt U15" }),
    ];

    const reserven = divisionGroup(teams, "Reserven");

    expect(reserven.teams.map((t) => t.name)).toEqual(["Reserven"]);
    // Not an age band like its three siblings, and the owner ruled against a
    // label saying so — #2641 fixed the misreading at the section heading
    // instead, which is where the group's context now comes from.
    expect(reserven.range).toBeUndefined();
    // The reserves are not the A-ploeg, despite sharing its age code.
    expect(groupTeamsForLanding(teams).aTeam?.name).toBe("Eerste Elftallen A");
  });

  it("should leave the reserves group empty when the roster has none", () => {
    const teams = [makeTeam({ _id: "u15", age: "U15" })];
    expect(divisionGroup(teams, "Reserven").teams).toHaveLength(0);
  });

  it("should return undefined for missing A-team or B-team", () => {
    const teams = [makeTeam({ age: "U15", name: "KCVV Elewijt U15" })];
    const result = groupTeamsForLanding(teams);

    expect(result.aTeam).toBeUndefined();
    expect(result.bTeam).toBeUndefined();
  });

  it("should sort youth teams by ascending age even when input is name-sorted", () => {
    const teams = [
      makeTeam({ _id: "u14", age: "U14", name: "KCVV Elewijt U14" }),
      makeTeam({ _id: "u15a", age: "U15", name: "KCVV Elewijt U15A" }),
      makeTeam({ _id: "u15b", age: "U15", name: "KCVV Elewijt U15B" }),
      makeTeam({ _id: "u17", age: "U17", name: "KCVV Elewijt U17" }),
      makeTeam({ _id: "u21", age: "U21", name: "KCVV Elewijt U21" }),
    ];

    expect(divisionGroup(teams, "Bovenbouw").teams.map((t) => t.age)).toEqual([
      "U17",
      "U21",
    ]);
    expect(divisionGroup(teams, "Middenbouw").teams.map((t) => t.age)).toEqual([
      "U14",
      "U15",
      "U15",
    ]);
  });

  it("should return empty arrays for divisions with no teams", () => {
    const teams = [
      makeTeam({ age: "A", name: "Eerste Elftallen A" }),
      makeTeam({ age: "U15", name: "KCVV Elewijt U15" }),
    ];
    expect(divisionGroup(teams, "Bovenbouw").teams).toHaveLength(0);
    expect(divisionGroup(teams, "Middenbouw").teams).toHaveLength(1); // U15
    expect(divisionGroup(teams, "Onderbouw").teams).toHaveLength(0);
  });

  it("should handle U19 in Bovenbouw", () => {
    const teams = [
      makeTeam({ _id: "u19", age: "U19", name: "KCVV Elewijt U19" }),
    ];
    expect(divisionGroup(teams, "Bovenbouw").teams.map((t) => t.age)).toEqual([
      "U19",
    ]);
  });

  it("should not include senior teams in youth divisions", () => {
    const teams = [
      makeTeam({ _id: "a", age: "A", name: "Eerste Elftallen A" }),
      makeTeam({ _id: "b", age: "A", name: "Eerste Elftallen B" }),
      makeTeam({ _id: "u15", age: "U15", name: "KCVV Elewijt U15" }),
    ];

    const result = groupTeamsForLanding(teams);
    const allYouth = result.youthByDivision.flatMap((d) => d.teams);

    expect(allYouth).toHaveLength(1);
    expect(allYouth[0].age).toBe("U15");
  });
});

describe("isAgeCode", () => {
  it("should accept any U<n> code, including ones no division claims", () => {
    expect(isAgeCode("U21")).toBe(true);
    expect(isAgeCode("U6")).toBe(true);
    // Deliberately broader than getYouthDivision — U5 is a real age code that
    // falls outside Onderbouw's U6–U11 band. Callers that render the age want
    // it; callers that place a team in a band must use getYouthDivision.
    expect(isAgeCode("U5")).toBe(true);
    expect(getYouthDivision("U5")).toBeNull();
  });

  it("should reject senior codes and absent ages", () => {
    expect(isAgeCode("A")).toBe(false);
    expect(isAgeCode("")).toBe(false);
    expect(isAgeCode(undefined)).toBe(false);
  });
});

describe("getYouthDivision", () => {
  it("should return Bovenbouw for U17–U21", () => {
    expect(getYouthDivision("U21")).toBe("Bovenbouw");
    expect(getYouthDivision("U19")).toBe("Bovenbouw");
    expect(getYouthDivision("U17")).toBe("Bovenbouw");
  });

  it("should return Middenbouw for U12–U16", () => {
    expect(getYouthDivision("U16")).toBe("Middenbouw");
    expect(getYouthDivision("U15")).toBe("Middenbouw");
    expect(getYouthDivision("U14")).toBe("Middenbouw");
    expect(getYouthDivision("U13")).toBe("Middenbouw");
    expect(getYouthDivision("U12")).toBe("Middenbouw");
  });

  it("should return Onderbouw for U6–U11", () => {
    expect(getYouthDivision("U11")).toBe("Onderbouw");
    expect(getYouthDivision("U10")).toBe("Onderbouw");
    expect(getYouthDivision("U9")).toBe("Onderbouw");
    expect(getYouthDivision("U6")).toBe("Onderbouw");
  });

  it("should handle age groups not in the standard roster via numeric parsing", () => {
    expect(getYouthDivision("U18")).toBe("Bovenbouw");
    expect(getYouthDivision("U5")).toBeNull();
    expect(getYouthDivision("U22")).toBeNull();
  });

  it("should return null for non-youth age groups", () => {
    expect(getYouthDivision("A")).toBeNull();
    expect(getYouthDivision(undefined)).toBeNull();
  });
});

describe("getYouthDivisionTone", () => {
  // Includes the null branch directly: `getYouthDivision()` returns null for
  // both senior age codes and U5 (see the `getYouthDivision` suite above),
  // and `getYouthDivisionTone`'s null arm is a single literal ("ink") no
  // matter which of those produced it — so one direct-null assertion here is
  // exhaustive; wrapping both `getYouthDivision` null cases through it again
  // would cover no additional behaviour.
  it("should return one tone per division", () => {
    expect(getYouthDivisionTone(null)).toBe("ink");
    expect(getYouthDivisionTone("Bovenbouw")).toBe("jersey-deep");
    expect(getYouthDivisionTone("Middenbouw")).toBe("alert");
    expect(getYouthDivisionTone("Onderbouw")).toBe("warning");
  });
});
