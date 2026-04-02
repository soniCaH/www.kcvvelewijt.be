/**
 * TeamStandings Component Stories
 *
 * League standings table with team highlighting and form display.
 *
 * Stories created BEFORE implementation (Storybook-first workflow).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamStandings, type StandingsEntry } from "./TeamStandings";

const meta = {
  title: "Features/Teams/TeamStandings",
  component: TeamStandings,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
League standings table component.

**Features:**
- Full standings with all columns (P, W, D, L, G+, G-, +/-, Pts)
- Team highlighting for KCVV teams
- Form display (recent results as WWLDW)
- Compact variant showing top N teams
- Responsive design for mobile

**Usage:**
Used in team detail pages "Stand" tab and on homepage.
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    standings: { control: "object", description: "Array of standings entries" },
    highlightTeamId: {
      control: "number",
      description: "Team ID to highlight (KCVV)",
    },
    showForm: { control: "boolean", description: "Show recent form column" },
    limit: { control: "number", description: "Limit number of rows shown" },
    isLoading: { control: "boolean", description: "Loading state" },
    className: { control: "text", description: "Additional CSS classes" },
  },
} satisfies Meta<typeof TeamStandings>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data based on actual PSD API structure
const mockStandings: StandingsEntry[] = [
  {
    position: 1,
    teamId: 1235,
    teamName: "KCVV ELEWIJT",
    teamLogo:
      "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
    played: 15,
    won: 12,
    drawn: 2,
    lost: 1,
    goalsFor: 38,
    goalsAgainst: 12,
    goalDifference: 26,
    points: 38,
    form: "WWWDW",
  },
  {
    position: 2,
    teamId: 59,
    teamName: "KFC TURNHOUT",
    teamLogo:
      "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1",
    played: 15,
    won: 11,
    drawn: 2,
    lost: 2,
    goalsFor: 35,
    goalsAgainst: 15,
    goalDifference: 20,
    points: 35,
    form: "WWDWL",
  },
  {
    position: 3,
    teamId: 123,
    teamName: "FC DIEST",
    played: 15,
    won: 10,
    drawn: 3,
    lost: 2,
    goalsFor: 28,
    goalsAgainst: 14,
    goalDifference: 14,
    points: 33,
    form: "DWWWW",
  },
  {
    position: 4,
    teamId: 456,
    teamName: "UNION MECHELEN",
    played: 15,
    won: 9,
    drawn: 4,
    lost: 2,
    goalsFor: 30,
    goalsAgainst: 18,
    goalDifference: 12,
    points: 31,
    form: "WDWDW",
  },
  {
    position: 5,
    teamId: 789,
    teamName: "KVK TIENEN",
    played: 15,
    won: 8,
    drawn: 4,
    lost: 3,
    goalsFor: 25,
    goalsAgainst: 16,
    goalDifference: 9,
    points: 28,
    form: "LWWWW",
  },
  {
    position: 6,
    teamId: 111,
    teamName: "SK LONDERZEEL",
    played: 15,
    won: 7,
    drawn: 5,
    lost: 3,
    goalsFor: 22,
    goalsAgainst: 15,
    goalDifference: 7,
    points: 26,
    form: "DWDWL",
  },
  {
    position: 7,
    teamId: 222,
    teamName: "VK LINDEN",
    played: 15,
    won: 6,
    drawn: 5,
    lost: 4,
    goalsFor: 20,
    goalsAgainst: 18,
    goalDifference: 2,
    points: 23,
    form: "DDWLW",
  },
  {
    position: 8,
    teamId: 333,
    teamName: "KFC NIJLEN",
    played: 15,
    won: 5,
    drawn: 6,
    lost: 4,
    goalsFor: 18,
    goalsAgainst: 17,
    goalDifference: 1,
    points: 21,
    form: "DDDWL",
  },
  {
    position: 9,
    teamId: 444,
    teamName: "VC WESTERLO B",
    played: 15,
    won: 5,
    drawn: 4,
    lost: 6,
    goalsFor: 19,
    goalsAgainst: 22,
    goalDifference: -3,
    points: 19,
    form: "LWDWL",
  },
  {
    position: 10,
    teamId: 555,
    teamName: "KSK HEIST",
    played: 15,
    won: 4,
    drawn: 5,
    lost: 6,
    goalsFor: 16,
    goalsAgainst: 20,
    goalDifference: -4,
    points: 17,
    form: "LLDWD",
  },
  {
    position: 11,
    teamId: 666,
    teamName: "SC GRIMBERGEN",
    played: 15,
    won: 3,
    drawn: 5,
    lost: 7,
    goalsFor: 14,
    goalsAgainst: 24,
    goalDifference: -10,
    points: 14,
    form: "LDLLD",
  },
  {
    position: 12,
    teamId: 777,
    teamName: "RFC HOEI",
    played: 15,
    won: 2,
    drawn: 4,
    lost: 9,
    goalsFor: 12,
    goalsAgainst: 28,
    goalDifference: -16,
    points: 10,
    form: "LLLLD",
  },
];

/**
 * Default - Full standings table
 */
export const Default: Story = {
  args: {
    standings: mockStandings,
    highlightTeamId: 1235,
  },
};

/**
 * Highlighted team - KCVV row emphasized
 */
export const Highlighted: Story = {
  args: {
    standings: mockStandings,
    highlightTeamId: 1235,
  },
};

/**
 * Compact view - Top 5 only
 */
export const Compact: Story = {
  args: {
    standings: mockStandings,
    highlightTeamId: 1235,
    limit: 5,
  },
};

/**
 * With form column - Recent results shown
 */
export const WithForm: Story = {
  args: {
    standings: mockStandings,
    highlightTeamId: 1235,
    showForm: true,
  },
};

/**
 * Without logos - Teams without logos render correctly
 */
export const WithoutLogos: Story = {
  args: {
    standings: mockStandings.map((s) => ({ ...s, teamLogo: undefined })),
    highlightTeamId: 1235,
  },
};

/**
 * Loading skeleton
 */
export const Loading: Story = {
  args: {
    standings: [],
    isLoading: true,
  },
};

/**
 * Empty state - No standings available
 */
export const Empty: Story = {
  args: {
    standings: [],
  },
};

/**
 * KCVV not in top 5 - Ensures highlight works when scrolled
 */
export const HighlightedLower: Story = {
  args: {
    standings: [
      ...mockStandings.slice(1, 5),
      { ...mockStandings[0], position: 6 },
      ...mockStandings.slice(5),
    ].map((s, i) => ({ ...s, position: i + 1 })),
    highlightTeamId: 1235,
    showForm: true,
  },
};
