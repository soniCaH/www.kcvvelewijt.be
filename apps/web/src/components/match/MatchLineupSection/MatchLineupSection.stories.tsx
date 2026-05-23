import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchLineupSection } from "./MatchLineupSection";
import type { LineupPlayer } from "../MatchLineup/MatchLineup";

const homeLineup: LineupPlayer[] = [
  {
    id: 1,
    name: "Ben Lievens",
    number: 1,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter",
    isKeeper: true,
  },
  {
    id: 2,
    name: "Niels Vermeulen",
    number: 2,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 3,
    name: "Jonas De Smet",
    number: 4,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 4,
    name: "Wim Verhoeven",
    number: 5,
    minutesPlayed: 90,
    isCaptain: true,
    status: "starter",
  },
  {
    id: 5,
    name: "Maxim Breugelmans",
    number: 6,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter",
    card: "yellow",
  },
  {
    id: 6,
    name: "Lars De Vos",
    number: 7,
    minutesPlayed: 71,
    isCaptain: false,
    status: "substituted",
  },
  {
    id: 7,
    name: "Pieter De Bondt",
    number: 16,
    minutesPlayed: 19,
    isCaptain: false,
    status: "subbed_in",
  },
  {
    id: 8,
    name: "Ruben Pauwels",
    number: 17,
    isCaptain: false,
    status: "substitute",
  },
];

const awayLineup: LineupPlayer[] = [
  {
    id: 11,
    name: "Stijn Vandenberg",
    number: 1,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter",
    isKeeper: true,
  },
  {
    id: 12,
    name: "Kevin Smets",
    number: 3,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter",
    card: "yellow",
  },
  {
    id: 13,
    name: "Robbie Vermeiren",
    number: 10,
    minutesPlayed: 90,
    isCaptain: true,
    status: "starter",
  },
  {
    id: 14,
    name: "Tom Janssens",
    number: 9,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 15,
    name: "Bart Geerts",
    number: 14,
    isCaptain: false,
    status: "substitute",
  },
];

const meta = {
  title: "Features/Matches/MatchLineupSection",
  component: MatchLineupSection,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream min-h-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MatchLineupSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullData: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "RC Mechelen",
    homeLineup,
    awayLineup,
  },
};

export const StartersOnly: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "RC Mechelen",
    homeLineup: homeLineup.filter((p) => p.status === "starter"),
    awayLineup: awayLineup.filter((p) => p.status === "starter"),
  },
};

export const KcvvOnly: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "RC Mechelen",
    homeLineup,
    awayLineup: [],
  },
};

/**
 * Empty branch — both lineups are empty (typical of upcoming matches). The
 * component returns `null`, so the story renders nothing meaningful. Tagged
 * `vr-skip` to avoid capturing a 0×0 snapshot (per Phase 6.A BioBlock.Empty
 * precedent).
 */
export const Empty: Story = {
  tags: ["vr-skip"],
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "RC Mechelen",
    homeLineup: [],
    awayLineup: [],
  },
};
