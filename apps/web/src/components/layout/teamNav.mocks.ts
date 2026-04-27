import type { TeamNavVM } from "@/lib/repositories/team.repository";

export const mockSeniorTeams: TeamNavVM[] = [
  {
    id: "a-id",
    name: "Eerste Elftallen A",
    slug: "eerste-elftallen-a",
    age: "A",
    psdId: "100",
    division: null,
    divisionFull: null,
    tagline: null,
    teamImageUrl: null,
  },
  {
    id: "b-id",
    name: "Eerste Elftallen B",
    slug: "eerste-elftallen-b",
    age: "A",
    psdId: "101",
    division: null,
    divisionFull: null,
    tagline: null,
    teamImageUrl: null,
  },
];

export const mockYouthTeams: TeamNavVM[] = [
  {
    id: "u21",
    name: "KCVV U21",
    slug: "kcvv-elewijt-u21",
    age: "U21",
    psdId: null,
    division: null,
    divisionFull: null,
    tagline: null,
    teamImageUrl: null,
  },
  {
    id: "u17",
    name: "KCVV U17",
    slug: "kcvv-elewijt-u17",
    age: "U17",
    psdId: null,
    division: null,
    divisionFull: null,
    tagline: null,
    teamImageUrl: null,
  },
];
