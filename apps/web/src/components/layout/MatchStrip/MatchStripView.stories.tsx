import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchStripView } from "./MatchStripView";
import type { UpcomingMatch } from "@/components/match/types";
import { KCVV_FIRST_TEAM_CLUB_ID } from "@/lib/constants";

const meta = {
  title: "UI/MatchStrip",
  component: MatchStripView,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MatchStripView>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseMatch: UpcomingMatch = {
  id: 12345,
  date: new Date("2026-05-10T19:30:00Z"),
  time: "19:30",
  venue: "De Schalk",
  competition: "Tweede Provinciale A",
  status: "scheduled",
  homeTeam: {
    id: KCVV_FIRST_TEAM_CLUB_ID,
    name: "KCVV",
  },
  awayTeam: {
    id: 9999,
    name: "RC Mechelen",
    logo: "/images/logos/kcvv-logo.png",
  },
};

export const HomeUpcoming: Story = {
  args: { match: baseMatch },
};

export const AwayUpcoming: Story = {
  args: {
    match: {
      ...baseMatch,
      homeTeam: { id: 9999, name: "VK De Volharding" },
      awayTeam: { id: KCVV_FIRST_TEAM_CLUB_ID, name: "KCVV" },
      // intentionally no opponent logo — exercises the initial-fallback path
    },
  },
};

export const WithoutOptionalFields: Story = {
  args: {
    match: {
      ...baseMatch,
      time: undefined,
      venue: undefined,
      competition: undefined,
    },
  },
};
