import type { OrgChartNode } from "@/types/organigram";
import type { YouthTeamSource } from "@/lib/utils/match-youth-team";

/** Shared fixtures for `<TeamCard>` and the `<HubSearch>` team-card seam. */

const team = (slug: string, age: string): YouthTeamSource => ({
  _id: slug,
  slug,
  name: slug,
  age,
  hasStaff: true,
});

/** A roster shaped like production (2026–27). `kcvve-u16` carries PSD age U17. */
export const TEAM_CARD_TEAMS: YouthTeamSource[] = [
  team("eerste-elftallen-a", "A"),
  team("kcvve-u5", "U5"),
  team("kcvve-u6", "U6"),
  team("kcvve-u7", "U7"),
  team("kcvve-u8-wit", "U8"),
  team("kcvve-u8-groen", "U8"),
  team("kcvve-u9", "U9"),
  team("kcvve-u10", "U10"),
  team("kcvve-u10p", "U10"),
  team("kcvve-u11", "U11"),
  team("kcvve-u12", "U12"),
  team("kcvve-u13", "U13"),
  team("kcvve-u14", "U14"),
  team("kcvve-u15", "U15"),
  team("kcvve-u16", "U17"),
  team("kcvve-u17", "U17"),
  team("kcvve-u19", "U19"),
  team("kcvve-u21", "U21"),
];

/** Season 2026–27. */
export const TEAM_CARD_SEASON_YEAR = 2026;
/** Autumn 2026, so an age reads the same birth years as the season. */
export const TEAM_CARD_CALENDAR_YEAR = 2026;

const node = (
  roleCode: string,
  title: string,
  name: string,
  email: string,
): OrgChartNode => ({
  id: `node-${roleCode.toLowerCase()}`,
  title,
  roleCode,
  pillar: "jeugd-organisatie",
  members: [
    {
      id: `staff-${roleCode.toLowerCase()}`,
      name,
      email,
      phone: "0470 12 34 56",
    },
  ],
});

/** The four nodes the card reads, each with one active member. */
export const TEAM_CARD_NODES: OrgChartNode[] = [
  node("TVJO", "TVJO", "Tom Verhaegen", "tvjo@kcvvelewijt.be"),
  node(
    "JC-OB",
    "Jeugdcoördinator Onderbouw",
    "Sofie Claes",
    "onderbouw@kcvvelewijt.be",
  ),
  node(
    "JC-MB",
    "Jeugdcoördinator Middenbouw",
    "Pieter Van den Broeck",
    "middenbouw@kcvvelewijt.be",
  ),
  node(
    "JC-BB",
    "Jeugdcoördinator Bovenbouw",
    "Kris Wouters",
    "bovenbouw@kcvvelewijt.be",
  ),
];

/** The same nodes with `roleCode`'s box emptied — its coordinator row hides. */
export const withoutHolder = (roleCode: string): OrgChartNode[] =>
  TEAM_CARD_NODES.map((n) =>
    n.roleCode === roleCode ? { ...n, members: [] } : n,
  );
