import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchTeaser } from "./MatchTeaser";

const KCVV_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1";
const OPPONENT_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1";

const kcvv = { id: 1235, name: "KCVV Elewijt", logo: KCVV_LOGO };
const opponent = { id: 59, name: "RC Mechelen", logo: OPPONENT_LOGO };

const meta = {
  title: "Features/Matches/MatchTeaser",
  component: MatchTeaser,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft min-h-[200px] p-8">
        <div className="mx-auto max-w-[560px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof MatchTeaser>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  homeTeam: kcvv,
  awayTeam: opponent,
  date: "2025-09-13",
  time: "14:30",
  venue: "Sportpark Elewijt",
  highlightTeamId: 1235,
  href: "/wedstrijd/12345",
} as const;

export const Upcoming: Story = {
  args: {
    ...baseArgs,
    status: "upcoming",
  },
};

export const Finished: Story = {
  args: {
    ...baseArgs,
    score: { home: 3, away: 1 },
    status: "finished",
  },
};

export const Forfeited: Story = {
  args: {
    ...baseArgs,
    score: { home: 5, away: 0 },
    status: "forfeited",
  },
};

export const Postponed: Story = {
  args: {
    ...baseArgs,
    status: "postponed",
  },
};

export const Cancelled: Story = {
  args: {
    ...baseArgs,
    status: "cancelled",
  },
};

export const Stopped: Story = {
  args: {
    ...baseArgs,
    score: { home: 1, away: 1 },
    status: "stopped",
  },
};

/**
 * KCVV plays away — the highlight emphasis lands on the right column.
 * Same fixture geometry, different `highlightTeamId`.
 */
export const KcvvAway: Story = {
  args: {
    ...baseArgs,
    homeTeam: opponent,
    awayTeam: kcvv,
    score: { home: 0, away: 2 },
    status: "finished",
  },
};

/**
 * `teamLabel` renders a mono-caps pre-stub label above the card — used by
 * `<CalendarMonth>` to disambiguate when several KCVV teams play on the
 * same day.
 */
export const WithTeamLabel: Story = {
  args: {
    ...baseArgs,
    teamLabel: "A-Ploeg",
    status: "upcoming",
  },
};

export const NoLogos: Story = {
  args: {
    ...baseArgs,
    homeTeam: { id: 1235, name: "KCVV Elewijt" },
    awayTeam: { id: 59, name: "RC Mechelen" },
    status: "upcoming",
  },
};

export const LongTeamNames: Story = {
  args: {
    ...baseArgs,
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
    score: { home: 2, away: 2 },
    status: "finished",
  },
};

export const MinimalData: Story = {
  args: {
    homeTeam: kcvv,
    awayTeam: opponent,
    date: "2025-09-13",
    status: "upcoming",
  },
};

export const Loading: Story = {
  tags: ["vr-skip"],
  args: {
    ...baseArgs,
    status: "upcoming",
    isLoading: true,
  },
};
