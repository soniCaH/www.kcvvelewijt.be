import { describe, it, expect } from "vitest";
import { groupTeamsForLanding, type TeamLandingItem } from "./group-teams";

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
  it("should extract A-team and B-team from the list", () => {
    const teams = [
      makeTeam({ _id: "a", age: "A", name: "KCVV Elewijt A" }),
      makeTeam({ _id: "b", age: "B", name: "KCVV Elewijt B" }),
      makeTeam({ _id: "u15", age: "U15", name: "U15" }),
    ];

    const result = groupTeamsForLanding(teams);

    expect(result.aTeam?.name).toBe("KCVV Elewijt A");
    expect(result.bTeam?.name).toBe("KCVV Elewijt B");
  });

  it("should group youth teams into Bovenbouw, Middenbouw, Onderbouw", () => {
    const teams = [
      makeTeam({ _id: "u21", age: "U21", name: "U21" }),
      makeTeam({ _id: "u17", age: "U17", name: "U17" }),
      makeTeam({ _id: "u13", age: "U13", name: "U13" }),
      makeTeam({ _id: "u10", age: "U10", name: "U10" }),
      makeTeam({ _id: "u9", age: "U9", name: "U9" }),
      makeTeam({ _id: "u6", age: "U6", name: "U6" }),
    ];

    const result = groupTeamsForLanding(teams);

    expect(result.youthByDivision).toHaveLength(3);
    expect(result.youthByDivision[0].label).toBe("Bovenbouw");
    expect(result.youthByDivision[0].range).toBe("U14–U21");
    expect(result.youthByDivision[0].teams.map((t) => t.age)).toEqual([
      "U21",
      "U17",
    ]);

    expect(result.youthByDivision[1].label).toBe("Middenbouw");
    expect(result.youthByDivision[1].range).toBe("U10–U13");
    expect(result.youthByDivision[1].teams.map((t) => t.age)).toEqual([
      "U13",
      "U10",
    ]);

    expect(result.youthByDivision[2].label).toBe("Onderbouw");
    expect(result.youthByDivision[2].range).toBe("U6–U9");
    expect(result.youthByDivision[2].teams.map((t) => t.age)).toEqual([
      "U9",
      "U6",
    ]);
  });

  it("should return undefined for missing A-team or B-team", () => {
    const teams = [makeTeam({ age: "U15" })];
    const result = groupTeamsForLanding(teams);

    expect(result.aTeam).toBeUndefined();
    expect(result.bTeam).toBeUndefined();
  });

  it("should return empty arrays for divisions with no teams", () => {
    const teams = [makeTeam({ age: "A" }), makeTeam({ age: "U15" })];
    const result = groupTeamsForLanding(teams);

    expect(result.youthByDivision[0].teams).toHaveLength(1); // Bovenbouw: U15
    expect(result.youthByDivision[1].teams).toHaveLength(0); // Middenbouw: empty
    expect(result.youthByDivision[2].teams).toHaveLength(0); // Onderbouw: empty
  });
});
