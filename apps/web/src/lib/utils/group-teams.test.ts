import { describe, it, expect } from "vitest";
import {
  groupTeamsForLanding,
  getYouthDivision,
  type TeamLandingItem,
} from "./group-teams";

const makeTeam = (
  overrides: Partial<TeamLandingItem> = {},
): TeamLandingItem => ({
  _id: overrides._id ?? "id-1",
  name: overrides.name ?? "Test Team",
  slug: overrides.slug ?? "test-team",
  age: overrides.age ?? "A",
  division: overrides.division ?? null,
  divisionFull: overrides.divisionFull ?? null,
  tagline: overrides.tagline ?? null,
  teamImageUrl: overrides.teamImageUrl ?? null,
  staff: overrides.staff ?? null,
});

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

    expect(result.youthByDivision).toHaveLength(3);
    expect(result.youthByDivision[0].label).toBe("Bovenbouw");
    expect(result.youthByDivision[0].range).toBe("U17–U21");
    expect(result.youthByDivision[0].teams.map((t) => t.age)).toEqual([
      "U21",
      "U17",
    ]);

    expect(result.youthByDivision[1].label).toBe("Middenbouw");
    expect(result.youthByDivision[1].range).toBe("U12–U16");
    expect(result.youthByDivision[1].teams.map((t) => t.age)).toEqual(["U13"]);

    expect(result.youthByDivision[2].label).toBe("Onderbouw");
    expect(result.youthByDivision[2].range).toBe("U6–U11");
    expect(result.youthByDivision[2].teams.map((t) => t.age)).toEqual([
      "U10",
      "U9",
      "U6",
    ]);
  });

  it("should return undefined for missing A-team or B-team", () => {
    const teams = [makeTeam({ age: "U15", name: "KCVV Elewijt U15" })];
    const result = groupTeamsForLanding(teams);

    expect(result.aTeam).toBeUndefined();
    expect(result.bTeam).toBeUndefined();
  });

  it("should sort youth teams by descending age even when input is name-sorted", () => {
    const teams = [
      makeTeam({ _id: "u14", age: "U14", name: "KCVV Elewijt U14" }),
      makeTeam({ _id: "u15a", age: "U15", name: "KCVV Elewijt U15A" }),
      makeTeam({ _id: "u15b", age: "U15", name: "KCVV Elewijt U15B" }),
      makeTeam({ _id: "u17", age: "U17", name: "KCVV Elewijt U17" }),
      makeTeam({ _id: "u21", age: "U21", name: "KCVV Elewijt U21" }),
    ];

    const result = groupTeamsForLanding(teams);

    // Bovenbouw: U21, U17
    expect(result.youthByDivision[0].teams.map((t) => t.age)).toEqual([
      "U21",
      "U17",
    ]);
    // Middenbouw: U15, U15, U14
    expect(result.youthByDivision[1].teams.map((t) => t.age)).toEqual([
      "U15",
      "U15",
      "U14",
    ]);
  });

  it("should return empty arrays for divisions with no teams", () => {
    const teams = [
      makeTeam({ age: "A", name: "Eerste Elftallen A" }),
      makeTeam({ age: "U15", name: "KCVV Elewijt U15" }),
    ];
    const result = groupTeamsForLanding(teams);

    expect(result.youthByDivision[0].teams).toHaveLength(0); // Bovenbouw: empty
    expect(result.youthByDivision[1].teams).toHaveLength(1); // Middenbouw: U15
    expect(result.youthByDivision[2].teams).toHaveLength(0); // Onderbouw: empty
  });

  it("should handle U19 in Bovenbouw", () => {
    const teams = [
      makeTeam({ _id: "u19", age: "U19", name: "KCVV Elewijt U19" }),
    ];
    const result = groupTeamsForLanding(teams);
    expect(result.youthByDivision[0].teams.map((t) => t.age)).toEqual(["U19"]);
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
