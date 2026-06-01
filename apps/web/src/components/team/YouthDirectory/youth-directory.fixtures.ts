import type { YouthDivisionGroup } from "@/lib/utils/group-teams";

/**
 * Build a youth `TeamLandingItem` from just an age code (e.g. "U13").
 * Shared by `<YouthDirectory>`'s stories and unit tests so the fixture
 * shape stays in one place.
 */
export function youthTeam(age: string): YouthDivisionGroup["teams"][number] {
  return {
    _id: `t-${age}`,
    name: `KCVV Elewijt ${age}`,
    slug: `kcvv-elewijt-${age.toLowerCase()}`,
    age,
    division: null,
    divisionFull: null,
    season: "25/26",
    tagline: null,
    teamImageUrl: null,
    staff: null,
  };
}
