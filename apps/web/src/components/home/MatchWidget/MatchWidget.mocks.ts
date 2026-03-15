import type { UpcomingMatch } from "@/components/match/types";

export const mockUpcomingMatch: UpcomingMatch = {
  id: 100,
  date: new Date("2026-03-22T14:00:00Z"),
  time: "15:00",
  homeTeam: {
    id: 1235,
    name: "KCVV Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
  },
  awayTeam: {
    id: 59,
    name: "KVC Wilrijk",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1",
  },
  status: "scheduled",
  round: "A",
  competition: "3e Afdeling VV",
  venue: "Thuis",
};

export const mockFinishedMatchWin: UpcomingMatch = {
  id: 101,
  date: new Date("2026-03-08T14:00:00Z"),
  time: "15:00",
  homeTeam: {
    id: 1235,
    name: "KCVV Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
    score: 3,
  },
  awayTeam: {
    id: 448,
    name: "FC Wezel Sport",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/448.png?v=1",
    score: 1,
  },
  status: "finished",
  round: "A",
  competition: "3e Afdeling VV",
};

export const mockFinishedMatchDraw: UpcomingMatch = {
  id: 102,
  date: new Date("2026-03-01T14:00:00Z"),
  time: "15:00",
  homeTeam: {
    id: 628,
    name: "City Pirates",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/628.png?v=1",
    score: 2,
  },
  awayTeam: {
    id: 1235,
    name: "KCVV Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
    score: 2,
  },
  status: "finished",
  round: "A",
  competition: "3e Afdeling VV",
};

export const mockPostponedMatch: UpcomingMatch = {
  id: 103,
  date: new Date("2026-03-29T14:00:00Z"),
  homeTeam: {
    id: 1235,
    name: "KCVV Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
  },
  awayTeam: {
    id: 230,
    name: "KCS Machelen",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/230.png?v=1",
  },
  status: "postponed",
  round: "A",
  competition: "3e Afdeling VV",
};

export const mockForfeitedMatch: UpcomingMatch = {
  id: 104,
  date: new Date("2026-03-15T14:00:00Z"),
  homeTeam: {
    id: 59,
    name: "KVC Wilrijk",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1",
  },
  awayTeam: {
    id: 1235,
    name: "KCVV Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
  },
  status: "forfeited",
  round: "A",
  competition: "3e Afdeling VV",
};

export const mockLongTeamNames: UpcomingMatch = {
  id: 105,
  date: new Date("2026-04-05T13:00:00Z"),
  time: "14:00",
  homeTeam: {
    id: 1235,
    name: "KCVV Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
  },
  awayTeam: {
    id: 756,
    name: "Verbroedering Hofstade-Zemst",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/756.png?v=1",
  },
  status: "scheduled",
  round: "A",
  competition: "3e Afdeling VV",
  venue: "Sportpark Elewijt",
};
