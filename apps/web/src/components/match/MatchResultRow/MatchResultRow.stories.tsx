import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchResultRow } from "./MatchResultRow";
import type { ScheduleMatch } from "../types";

const KCVV_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1";
const OPPONENT_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1";

const kcvv = { id: 1235, name: "KCVV Elewijt", logo: KCVV_LOGO };
const opponent = { id: 59, name: "RC Mechelen", logo: OPPONENT_LOGO };

const baseMatch: ScheduleMatch = {
  id: 12345,
  date: new Date("2025-09-13T13:30:00Z"),
  time: "14:30",
  homeTeam: kcvv,
  awayTeam: opponent,
  status: "finished",
  competition: "3e provinciale A",
  isHome: true,
};

const meta = {
  title: "Features/Matches/MatchResultRow",
  component: MatchResultRow,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft min-h-[180px] p-8">
        <div className="mx-auto max-w-[640px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof MatchResultRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  match: baseMatch,
  href: "/wedstrijd/12345",
} as const;

// ─── Result outcomes ────────────────────────────────────────────────────

export const Win: Story = {
  args: {
    ...baseArgs,
    match: { ...baseMatch, homeScore: 3, awayScore: 1 },
  },
};

export const Draw: Story = {
  args: {
    ...baseArgs,
    match: { ...baseMatch, homeScore: 1, awayScore: 1 },
  },
};

export const Loss: Story = {
  args: {
    ...baseArgs,
    match: { ...baseMatch, homeScore: 0, awayScore: 2 },
  },
};

// ─── KCVV away (isHome=false) ──────────────────────────────────────────

export const KcvvAwayWin: Story = {
  args: {
    ...baseArgs,
    match: {
      ...baseMatch,
      homeTeam: opponent,
      awayTeam: kcvv,
      homeScore: 0,
      awayScore: 2,
      isHome: false,
    },
  },
};

// ─── Edge states (corner-stamp badge) ──────────────────────────────────

export const Postponed: Story = {
  args: {
    ...baseArgs,
    match: { ...baseMatch, status: "postponed" },
  },
};

export const Cancelled: Story = {
  args: {
    ...baseArgs,
    match: { ...baseMatch, status: "cancelled" },
  },
};

export const Forfeited: Story = {
  args: {
    ...baseArgs,
    match: {
      ...baseMatch,
      status: "forfeited",
      homeScore: 5,
      awayScore: 0,
    },
  },
};

export const Stopped: Story = {
  args: {
    ...baseArgs,
    match: {
      ...baseMatch,
      status: "stopped",
      homeScore: 1,
      awayScore: 1,
    },
  },
};

// ─── Next-up annotation ────────────────────────────────────────────────

export const IsNext: Story = {
  args: {
    ...baseArgs,
    isNext: true,
    match: { ...baseMatch, status: "scheduled", time: "14:30" },
  },
};

// ─── Stress + fallbacks ────────────────────────────────────────────────

export const NoLogos: Story = {
  args: {
    ...baseArgs,
    match: {
      ...baseMatch,
      homeTeam: { id: 1235, name: "KCVV Elewijt" },
      awayTeam: { id: 59, name: "RC Mechelen" },
      homeScore: 2,
      awayScore: 0,
    },
  },
};

export const LongTeamNames: Story = {
  args: {
    ...baseArgs,
    match: {
      ...baseMatch,
      homeTeam: {
        id: 1235,
        name: "KFC Sint-Stevens-Woluwe-Diegem",
        logo: KCVV_LOGO,
      },
      awayTeam: {
        id: 59,
        name: "Royal Antwerpen-Borgerhout SK",
        logo: OPPONENT_LOGO,
      },
      homeScore: 2,
      awayScore: 2,
    },
  },
};

export const NonMember: Story = {
  args: {
    ...baseArgs,
    match: {
      ...baseMatch,
      // No `isHome` → no team highlight + no result pill (the row is being
      // viewed without a tracked side, e.g. an opponent-of-the-week panel).
      isHome: undefined,
      homeScore: 3,
      awayScore: 1,
    },
  },
};
