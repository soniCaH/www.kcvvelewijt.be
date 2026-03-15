/**
 * Mock data for UpcomingMatches component
 * Used in Storybook and as fallback data during development
 */
import type { UpcomingMatch } from "./UpcomingMatches";

export const mockScheduledMatches: UpcomingMatch[] = [
  {
    id: 1,
    date: new Date("2025-12-06T09:00:00Z"),
    time: "09:00",
    homeTeam: {
      id: 448,
      name: "Londerzeel United",
      logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/448.png?v=1",
    },
    awayTeam: {
      id: 1235,
      name: "Kcvv Elewijt",
      logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
    },
    status: "scheduled",
    round: "U9",
    competition: "Competitie",
  },
  {
    id: 2,
    date: new Date("2025-12-06T09:30:00Z"),
    time: "09:30",
    homeTeam: {
      id: 1235,
      name: "Kcvv Elewijt",
      logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
    },
    awayTeam: {
      id: 425,
      name: "Verbr Hofstade",
      logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/425.png?v=1",
    },
    status: "scheduled",
    round: "U6",
    competition: "Competitie",
  },
  {
    id: 3,
    date: new Date("2025-12-07T15:00:00Z"),
    time: "15:00",
    homeTeam: {
      id: 1235,
      name: "Kcvv Elewijt",
      logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
    },
    awayTeam: {
      id: 59,
      name: "Kfc Turnhout",
      logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1",
    },
    status: "scheduled",
    round: "A",
    competition: "Competitie",
  },
];

export const mockScheduledMatchWithScores: UpcomingMatch = {
  id: 10,
  date: new Date("2025-01-15T15:30:00Z"),
  time: "15:30",
  homeTeam: {
    id: 1235,
    name: "Kcvv Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
    score: 2,
  },
  awayTeam: {
    id: 628,
    name: "Vc Bertem-leefdaal",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/628.png?v=1",
    score: 1,
  },
  status: "scheduled",
  round: "U15",
  competition: "Competitie",
};

export const mockFinishedMatch: UpcomingMatch = {
  id: 11,
  date: new Date("2025-12-06T09:30:00Z"),
  time: "09:30",
  homeTeam: {
    id: 756,
    name: "Vc Rijmenam",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/756.png?v=1",
    score: 0,
  },
  awayTeam: {
    id: 1235,
    name: "Kcvv Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
    score: 5,
  },
  status: "finished",
  round: "U15",
  competition: "Competitie",
};

export const mockPostponedMatch: UpcomingMatch = {
  id: 12,
  date: new Date("2025-12-15T15:00:00Z"),
  homeTeam: {
    id: 1235,
    name: "Kcvv Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
  },
  awayTeam: {
    id: 872,
    name: "Zennester Hombeek",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/872.png?v=1",
  },
  status: "postponed",
  round: "U13",
  competition: "Competitie",
};

export const mockForfeitedMatch: UpcomingMatch = {
  id: 13,
  date: new Date("2025-12-22T14:30:00Z"),
  homeTeam: {
    id: 230,
    name: "Kcs Machelen",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/230.png?v=1",
  },
  awayTeam: {
    id: 1235,
    name: "Kcvv Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
  },
  status: "forfeited",
  round: "U12",
  competition: "Competitie",
};

/**
 * Combined mock data for various scenarios
 */
export const mockMatches = {
  scheduled: mockScheduledMatches,
  scheduledWithScores: mockScheduledMatchWithScores,
  finished: mockFinishedMatch,
  postponed: mockPostponedMatch,
  forfeited: mockForfeitedMatch,
  all: [
    mockScheduledMatchWithScores,
    ...mockScheduledMatches,
    mockFinishedMatch,
  ],
  mixed: [
    mockScheduledMatchWithScores,
    mockScheduledMatches[0],
    mockFinishedMatch,
    mockScheduledMatches[1],
    mockPostponedMatch,
    mockScheduledMatches[2],
    mockForfeitedMatch,
  ],
};
