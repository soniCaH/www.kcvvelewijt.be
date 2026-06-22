/**
 * MatchEvents Storybook Stories
 *
 * Timeline of match events (goals, cards, substitutions).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchEvents } from "./MatchEvents";

const meta = {
  title: "Features/Matches/MatchEvents",
  component: MatchEvents,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "vr"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MatchEvents>;

export default meta;
type Story = StoryObj<typeof meta>;

const fullEvents = [
  {
    id: 1,
    type: "goal" as const,
    minute: 12,
    team: "home" as const,
    player: "Jonas Vermeersch",
    assist: "Pieter Janssen",
  },
  {
    id: 2,
    type: "yellow_card" as const,
    minute: 23,
    team: "away" as const,
    player: "Marc Declercq",
  },
  {
    id: 3,
    type: "substitution" as const,
    minute: 45,
    team: "home" as const,
    playerIn: "Kevin Mertens",
    playerOut: "Thomas Peeters",
  },
  {
    id: 4,
    type: "goal" as const,
    minute: 56,
    team: "away" as const,
    player: "Yannick Hermans",
  },
  {
    id: 5,
    type: "goal" as const,
    minute: 67,
    team: "home" as const,
    player: "Jonas Vermeersch",
    assist: "Kevin Mertens",
  },
  {
    id: 6,
    type: "yellow_card" as const,
    minute: 72,
    team: "home" as const,
    player: "Pieter Janssen",
  },
  {
    id: 7,
    type: "red_card" as const,
    minute: 78,
    team: "away" as const,
    player: "Marc Declercq",
  },
  {
    id: 8,
    type: "goal" as const,
    minute: 89,
    team: "home" as const,
    player: "Kevin Mertens",
    isPenalty: true,
  },
];

/**
 * Default - Full timeline with various event types
 */
export const Default: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    events: fullEvents,
  },
};

/**
 * Goals only - filtered to just goals
 */
export const GoalsOnly: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    events: fullEvents,
    filter: "goals",
  },
};

/**
 * With event icons
 */
export const WithIcons: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    events: fullEvents,
    showIcons: true,
  },
};

/**
 * Grouped by team
 */
export const ByTeam: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    events: fullEvents,
    groupBy: "team",
  },
};

/**
 * High scoring match
 */
export const HighScoring: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    events: [
      {
        id: 1,
        type: "goal" as const,
        minute: 5,
        team: "home" as const,
        player: "Jonas Vermeersch",
      },
      {
        id: 2,
        type: "goal" as const,
        minute: 18,
        team: "away" as const,
        player: "Marc Declercq",
      },
      {
        id: 3,
        type: "goal" as const,
        minute: 23,
        team: "home" as const,
        player: "Pieter Janssen",
      },
      {
        id: 4,
        type: "goal" as const,
        minute: 34,
        team: "home" as const,
        player: "Kevin Mertens",
      },
      {
        id: 5,
        type: "goal" as const,
        minute: 52,
        team: "away" as const,
        player: "Yannick Hermans",
      },
      {
        id: 6,
        type: "goal" as const,
        minute: 67,
        team: "home" as const,
        player: "Jonas Vermeersch",
      },
      {
        id: 7,
        type: "goal" as const,
        minute: 78,
        team: "home" as const,
        player: "Thomas Peeters",
      },
      {
        id: 8,
        type: "goal" as const,
        minute: 90,
        team: "away" as const,
        player: "Marc Declercq",
      },
    ],
  },
};

/**
 * Physical match with many cards
 */
export const PhysicalMatch: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    events: [
      {
        id: 1,
        type: "yellow_card" as const,
        minute: 15,
        team: "home" as const,
        player: "Jonas Vermeersch",
      },
      {
        id: 2,
        type: "yellow_card" as const,
        minute: 23,
        team: "away" as const,
        player: "Marc Declercq",
      },
      {
        id: 3,
        type: "goal" as const,
        minute: 34,
        team: "home" as const,
        player: "Pieter Janssen",
      },
      {
        id: 4,
        type: "yellow_card" as const,
        minute: 45,
        team: "away" as const,
        player: "Yannick Hermans",
      },
      {
        id: 5,
        type: "yellow_card" as const,
        minute: 56,
        team: "home" as const,
        player: "Kevin Mertens",
      },
      {
        id: 6,
        type: "red_card" as const,
        minute: 67,
        team: "away" as const,
        player: "Marc Declercq",
      },
      {
        id: 7,
        type: "yellow_card" as const,
        minute: 72,
        team: "home" as const,
        player: "Thomas Peeters",
      },
      {
        id: 8,
        type: "red_card" as const,
        minute: 85,
        team: "home" as const,
        player: "Pieter Janssen",
      },
    ],
  },
};

/**
 * Many substitutions
 */
export const ManySubstitutions: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    events: [
      {
        id: 1,
        type: "substitution" as const,
        minute: 45,
        team: "home" as const,
        playerIn: "Kevin Mertens",
        playerOut: "Thomas Peeters",
      },
      {
        id: 2,
        type: "substitution" as const,
        minute: 55,
        team: "away" as const,
        playerIn: "Jan Janssen",
        playerOut: "Marc Declercq",
      },
      {
        id: 3,
        type: "substitution" as const,
        minute: 60,
        team: "home" as const,
        playerIn: "Luc Verstappen",
        playerOut: "Jonas Vermeersch",
      },
      {
        id: 4,
        type: "substitution" as const,
        minute: 65,
        team: "away" as const,
        playerIn: "Tim Hendrickx",
        playerOut: "Yannick Hermans",
      },
      {
        id: 5,
        type: "goal" as const,
        minute: 78,
        team: "home" as const,
        player: "Kevin Mertens",
      },
      {
        id: 6,
        type: "substitution" as const,
        minute: 80,
        team: "home" as const,
        playerIn: "Bart Michiels",
        playerOut: "Pieter Janssen",
      },
    ],
  },
};

/**
 * Own goal
 */
export const WithOwnGoal: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    events: [
      {
        id: 1,
        type: "goal" as const,
        minute: 25,
        team: "home" as const,
        player: "Jonas Vermeersch",
      },
      {
        id: 2,
        type: "goal" as const,
        minute: 45,
        team: "away" as const,
        player: "Marc Declercq",
        isOwnGoal: true,
      },
      {
        id: 3,
        type: "goal" as const,
        minute: 78,
        team: "away" as const,
        player: "Yannick Hermans",
      },
    ],
  },
};

/**
 * Empty - No events yet
 */
export const Empty: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    events: [],
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    events: [],
    isLoading: true,
  },
};
