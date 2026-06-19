import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchGoalsBlock } from "./MatchGoalsBlock";
import type { MatchEvent } from "@/components/match/MatchEvents";

const meta = {
  title: "Features/Articles/Blocks/MatchGoalsBlock",
  component: MatchGoalsBlock,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Recap-only "Doelpunten." scorer roll-call (5.d-mat lock). Reuses `<MatchEvents filter="goals">` sided rows with KCVV scorers tinted jersey-deep via `highlightTeam`. Auto-hides when the match has no goals.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream px-6 py-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MatchGoalsBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const GOALS: MatchEvent[] = [
  { id: 1, type: "goal", minute: 23, team: "home", player: "Janssens" },
  { id: 2, type: "goal", minute: 55, team: "away", player: "Devos" },
  {
    id: 3,
    type: "goal",
    minute: 78,
    team: "home",
    player: "Peeters",
    isPenalty: true,
  },
];

const OWN_GOAL: MatchEvent[] = [
  { id: 1, type: "goal", minute: 12, team: "home", player: "Janssens" },
  {
    id: 2,
    type: "goal",
    minute: 64,
    team: "away",
    player: "Mertens",
    isOwnGoal: true,
  },
];

export const KcvvHome: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "Racing Mechelen",
    events: GOALS,
    kcvvSide: "home",
  },
};

export const KcvvAway: Story = {
  args: {
    homeTeamName: "Racing Mechelen",
    awayTeamName: "KCVV Elewijt",
    events: GOALS.map((g) => ({
      ...g,
      team: g.team === "home" ? "away" : "home",
    })),
    kcvvSide: "away",
  },
};

export const PenaltyAndOwnGoal: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "Racing Mechelen",
    events: OWN_GOAL,
    kcvvSide: "home",
  },
};
