import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchHero } from "./MatchHero";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Matches/MatchHero",
  component: MatchHero,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft min-h-[400px] p-10">
        <div className="mx-auto max-w-[760px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof MatchHero>;

export default meta;
type Story = StoryObj<typeof meta>;

const KCVV_LOGO = fixtureImage("sponsor-logo", 0);
const OPPONENT_LOGO = fixtureImage("sponsor-logo", 1);

const defaultHomeTeam = {
  name: "KCVV Elewijt",
  logo: KCVV_LOGO,
};
const defaultAwayTeam = {
  name: "RC Mechelen",
  logo: OPPONENT_LOGO,
};

const upcomingDate = new Date("2025-09-13T13:30:00Z");
const finishedDate = new Date("2025-09-06T13:30:00Z");

const baseArgs = {
  homeTeam: defaultHomeTeam,
  awayTeam: defaultAwayTeam,
  date: upcomingDate,
  time: "14:30",
  venue: "Sportpark Elewijt",
  competition: "3e provinciale A",
  kcvvTeamLabel: "KCVV-A",
} as const;

export const Upcoming: Story = {
  args: {
    ...baseArgs,
    status: "scheduled",
  },
};

export const Finished: Story = {
  args: {
    ...baseArgs,
    date: finishedDate,
    homeTeam: { ...defaultHomeTeam, score: 3 },
    awayTeam: { ...defaultAwayTeam, score: 1 },
    status: "finished",
  },
};

export const Forfeited: Story = {
  args: {
    ...baseArgs,
    date: finishedDate,
    homeTeam: { ...defaultHomeTeam, score: 5 },
    awayTeam: { ...defaultAwayTeam, score: 0 },
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
    date: finishedDate,
    homeTeam: { ...defaultHomeTeam, score: 1 },
    awayTeam: { ...defaultAwayTeam, score: 1 },
    status: "stopped",
  },
};

export const LongTeamNames: Story = {
  args: {
    ...baseArgs,
    date: finishedDate,
    homeTeam: {
      name: "KFC Sint-Stevens-Woluwe-Diegem",
      logo: defaultHomeTeam.logo,
      score: 2,
    },
    awayTeam: {
      name: "Royal Antwerpen-Borgerhout SK",
      logo: defaultAwayTeam.logo,
      score: 2,
    },
    status: "finished",
  },
};

export const NoLogos: Story = {
  args: {
    ...baseArgs,
    homeTeam: { name: "KCVV Elewijt" },
    awayTeam: { name: "RC Mechelen" },
    status: "scheduled",
  },
};

export const MinimalData: Story = {
  args: {
    homeTeam: defaultHomeTeam,
    awayTeam: defaultAwayTeam,
    date: upcomingDate,
    status: "scheduled",
  },
};

/**
 * Mobile collapse — at narrow widths the two-zone grid stacks vertically,
 * the divider rotates from vertical-right to horizontal-bottom, and the
 * status badge stays anchored to the card's top-right.
 */
export const MobileCollapse: Story = {
  args: {
    ...baseArgs,
    date: finishedDate,
    homeTeam: { ...defaultHomeTeam, score: 3 },
    awayTeam: { ...defaultAwayTeam, score: 1 },
    status: "finished",
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft min-h-[600px] p-4">
        <div className="mx-auto max-w-[360px]">
          <Story />
        </div>
      </div>
    ),
  ],
};
