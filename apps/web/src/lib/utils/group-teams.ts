export type TeamLandingItem = {
  _id: string;
  name: string;
  slug: string;
  age: string;
  division: string | null;
  divisionFull: string | null;
  tagline: string | null;
  teamImageUrl: string | null;
  staff: { firstName: string; lastName: string; role: string }[] | null;
};

export type YouthDivisionGroup = {
  label: YouthDivisionName;
  range: string;
  teams: TeamLandingItem[];
};

export type GroupedTeams = {
  aTeam: TeamLandingItem | undefined;
  bTeam: TeamLandingItem | undefined;
  youthByDivision: YouthDivisionGroup[];
};

const BOVENBOUW = ["U21", "U19", "U17"];
const MIDDENBOUW = ["U16", "U15", "U14", "U13", "U12"];
const ONDERBOUW = ["U11", "U10", "U9", "U8", "U7", "U6"];

export type YouthDivisionName = "Bovenbouw" | "Middenbouw" | "Onderbouw";

/** Parse the numeric age from an age-group string (e.g. "U15" → 15). Returns null if unparseable. */
function parseAge(ageGroup: string): number | null {
  const match = ageGroup.match(/^U(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Derive the youth division name from an age group string (e.g. "U15" → "Middenbouw"). */
export function getYouthDivision(
  ageGroup: string | undefined,
): YouthDivisionName | null {
  if (!ageGroup) return null;
  const age = parseAge(ageGroup);
  if (age == null) return null;
  if (age >= 17 && age <= 21) return "Bovenbouw";
  if (age >= 12 && age <= 16) return "Middenbouw";
  if (age >= 6 && age <= 11) return "Onderbouw";
  return null;
}

function sortByAgeDesc(ageOrder: string[]) {
  return (a: TeamLandingItem, b: TeamLandingItem) =>
    ageOrder.indexOf(a.age) - ageOrder.indexOf(b.age);
}

/** Extract the trailing single letter from a team name, e.g. "Eerste Elftallen A" → "A" */
function nameSuffix(name: string): string {
  return name.trim().split(/\s+/).at(-1) ?? "";
}

function isSenior(t: TeamLandingItem): boolean {
  return t.age === "A";
}

export function groupTeamsForLanding(teams: TeamLandingItem[]): GroupedTeams {
  const seniors = teams.filter(isSenior);
  return {
    aTeam: seniors.find((t) => nameSuffix(t.name) === "A"),
    bTeam: seniors.find((t) => nameSuffix(t.name) === "B"),
    youthByDivision: [
      {
        label: "Bovenbouw",
        range: "U17–U21",
        teams: teams
          .filter((t) => getYouthDivision(t.age) === "Bovenbouw")
          .sort(sortByAgeDesc(BOVENBOUW)),
      },
      {
        label: "Middenbouw",
        range: "U12–U16",
        teams: teams
          .filter((t) => getYouthDivision(t.age) === "Middenbouw")
          .sort(sortByAgeDesc(MIDDENBOUW)),
      },
      {
        label: "Onderbouw",
        range: "U6–U11",
        teams: teams
          .filter((t) => getYouthDivision(t.age) === "Onderbouw")
          .sort(sortByAgeDesc(ONDERBOUW)),
      },
    ],
  };
}
