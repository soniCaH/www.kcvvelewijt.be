import type { YouthTeamForContactVM } from "@/lib/repositories/team.repository";

export const mockYouthTeams: YouthTeamForContactVM[] = [
  {
    id: "team-u7a",
    name: "U7A",
    slug: "u7a",
    age: "U7",
    staff: [
      {
        id: "staff-trainer-u7a",
        firstName: "Jan",
        lastName: "Janssens",
        role: "trainer",
        email: "jan@kcvv.be",
        phone: "+32 123 456 789",
      },
      {
        id: "staff-afg-u7a",
        firstName: "Piet",
        lastName: "Pieters",
        role: "afgevaardigde",
        email: "piet@kcvv.be",
      },
    ],
  },
  {
    id: "team-u13a",
    name: "U13A",
    slug: "u13a",
    age: "U13",
    staff: [
      {
        id: "staff-trainer-u13a",
        firstName: "Kim",
        lastName: "De Smet",
        role: "trainer",
        email: "kim@kcvv.be",
      },
    ],
  },
  {
    id: "team-u17a",
    name: "U17A",
    slug: "u17a",
    age: "U17",
    staff: [],
  },
];
