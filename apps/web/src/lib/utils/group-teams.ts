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
  label: string;
  range: string;
  teams: TeamLandingItem[];
};

export type GroupedTeams = {
  aTeam: TeamLandingItem | undefined;
  bTeam: TeamLandingItem | undefined;
  youthByDivision: YouthDivisionGroup[];
};

const BOVENBOUW = ["U21", "U17", "U15", "U14"];
const MIDDENBOUW = ["U13", "U12", "U11", "U10"];
const ONDERBOUW = ["U9", "U8", "U7", "U6"];

export function groupTeamsForLanding(teams: TeamLandingItem[]): GroupedTeams {
  return {
    aTeam: teams.find((t) => t.age === "A"),
    bTeam: teams.find((t) => t.age === "B"),
    youthByDivision: [
      {
        label: "Bovenbouw",
        range: "U14–U21",
        teams: teams.filter((t) => BOVENBOUW.includes(t.age)),
      },
      {
        label: "Middenbouw",
        range: "U10–U13",
        teams: teams.filter((t) => MIDDENBOUW.includes(t.age)),
      },
      {
        label: "Onderbouw",
        range: "U6–U9",
        teams: teams.filter((t) => ONDERBOUW.includes(t.age)),
      },
    ],
  };
}
