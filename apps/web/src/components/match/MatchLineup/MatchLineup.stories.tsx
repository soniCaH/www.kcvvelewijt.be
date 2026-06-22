/**
 * MatchLineup Component Stories
 *
 * Displays starting XI and substitutes for both teams.
 *
 * Stories created BEFORE implementation (Storybook-first workflow).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchLineup } from "./MatchLineup";

const mockHomeLineup = [
  {
    id: 1,
    name: "Van Hoof Jannes",
    number: 99,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 2,
    name: "Merckaert Wout",
    number: 3,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 3,
    name: "Bouakhounov Amirgan",
    number: 5,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 4,
    name: "Breugelmans Maxim",
    number: 10,
    minutesPlayed: 90,
    isCaptain: true,
    status: "starter" as const,
  },
  {
    id: 5,
    name: "Mertens Alec",
    number: 17,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 6,
    name: "El Attabi Adil",
    number: 20,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 7,
    name: "Bell Alexander",
    number: 21,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 8,
    name: "Barbieux Milan",
    number: 15,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 9,
    name: "Vantomme Marnicqo",
    number: 8,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 10,
    name: "Fozin Tembou James",
    number: 9,
    minutesPlayed: 75,
    isCaptain: false,
    status: "substituted" as const,
  },
  {
    id: 11,
    name: "Beersaerts Yanis",
    number: 25,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 12,
    name: "Honshoven Lucas",
    number: 12,
    minutesPlayed: 15,
    isCaptain: false,
    status: "subbed_in" as const,
  },
  {
    id: 13,
    name: "Verstraeten Joren",
    number: 16,
    isCaptain: false,
    status: "substitute" as const,
  },
];

const mockAwayLineup = [
  {
    id: 101,
    name: "Janssen Pieter",
    number: 1,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 102,
    name: "De Vries Tom",
    number: 4,
    minutesPlayed: 90,
    isCaptain: true,
    status: "starter" as const,
  },
  {
    id: 103,
    name: "Hermans Kevin",
    number: 5,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 104,
    name: "Peeters Jef",
    number: 7,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 105,
    name: "Maes Wim",
    number: 9,
    minutesPlayed: 65,
    isCaptain: false,
    status: "substituted" as const,
  },
  {
    id: 106,
    name: "Van Damme Kris",
    number: 10,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 107,
    name: "Claes Bart",
    number: 11,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 108,
    name: "Wouters Steven",
    number: 14,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 109,
    name: "Jacobs Raf",
    number: 18,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 110,
    name: "Lenaerts Sven",
    number: 22,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 111,
    name: "Michiels Dirk",
    number: 33,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter" as const,
  },
  {
    id: 112,
    name: "Verhoeven Nick",
    number: 16,
    minutesPlayed: 25,
    isCaptain: false,
    status: "subbed_in" as const,
  },
];

const meta = {
  title: "Features/Matches/MatchLineup",
  component: MatchLineup,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
Displays starting XI and substitutes for both teams in a match.

**Features:**
- Two-column layout (home vs away)
- Groups players by status (starters, substitutes)
- Substitution status icons (red down arrow = subbed out, green up arrow = came on)
- Captain indicator
- Jersey number display
- Minutes played (if available)

**Usage:**
Used within match detail pages to show team lineups.
        `,
      },
    },
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    homeTeamName: { control: "text", description: "Home team name" },
    awayTeamName: { control: "text", description: "Away team name" },
    homeLineup: { control: "object", description: "Home team lineup" },
    awayLineup: { control: "object", description: "Away team lineup" },
    isLoading: { control: "boolean", description: "Loading state" },
  },
} satisfies Meta<typeof MatchLineup>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default - Full lineups for both teams
 */
export const Default: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    homeLineup: mockHomeLineup,
    awayLineup: mockAwayLineup,
  },
};

/**
 * Starters only (no substitutes used)
 */
export const StartersOnly: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    homeLineup: mockHomeLineup.filter((p) => p.status === "starter"),
    awayLineup: mockAwayLineup.filter((p) => p.status === "starter"),
  },
};

/**
 * With multiple substitutions - shows both in/out icons
 */
export const WithSubstitutions: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    homeLineup: [
      ...mockHomeLineup.slice(0, 8),
      {
        ...mockHomeLineup[8],
        minutesPlayed: 60,
        status: "substituted" as const,
      },
      {
        ...mockHomeLineup[9],
        minutesPlayed: 70,
        status: "substituted" as const,
      },
      {
        ...mockHomeLineup[10],
        minutesPlayed: 80,
        status: "substituted" as const,
      },
      {
        id: 14,
        name: "Sub One (came on)",
        number: 7,
        minutesPlayed: 30,
        status: "subbed_in" as const,
        isCaptain: false,
      },
      {
        id: 15,
        name: "Sub Two (came on)",
        number: 19,
        minutesPlayed: 20,
        status: "subbed_in" as const,
        isCaptain: false,
      },
      {
        id: 16,
        name: "Sub Three (came on)",
        number: 23,
        minutesPlayed: 10,
        status: "subbed_in" as const,
        isCaptain: false,
      },
      {
        id: 17,
        name: "Unused Sub",
        number: 30,
        status: "substitute" as const,
        isCaptain: false,
      },
    ],
    awayLineup: mockAwayLineup,
  },
};

/**
 * Loading skeleton
 */
export const Loading: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    homeLineup: [],
    awayLineup: [],
    isLoading: true,
  },
};

/**
 * Empty lineups (no data available)
 */
export const EmptyLineups: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    homeLineup: [],
    awayLineup: [],
  },
};

/**
 * Minimal data (just names)
 */
export const MinimalData: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    homeLineup: [
      { name: "Player One", isCaptain: false, status: "starter" as const },
      { name: "Player Two", isCaptain: true, status: "starter" as const },
      { name: "Player Three", isCaptain: false, status: "starter" as const },
    ],
    awayLineup: [
      { name: "Away Player One", isCaptain: true, status: "starter" as const },
      { name: "Away Player Two", isCaptain: false, status: "starter" as const },
    ],
  },
};

/**
 * Mobile viewport
 */
export const MobileView: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    homeLineup: mockHomeLineup,
    awayLineup: mockAwayLineup,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};
