// apps/web/src/components/home/FirstTeamsBlock/FirstTeamsBlock.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FirstTeamsBlock } from "./FirstTeamsBlock";
import type { FirstTeamVM, FirstTeamResultVM } from "./first-teams";

const meta = {
  title: "Features/Home/FirstTeamsBlock",
  component: FirstTeamsBlock,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Homepage 'Eerste ploegen' eyecatcher — a full-bleed jersey-deep-dark " +
          "matchday-desk band (StripedSeam top + bottom) with one full-width row " +
          "per senior team: [team label] · [last-result card] · [next-fixture " +
          "card]. The result + fixture are two independent press-down cards, each " +
          "deep-linking to its own match detail. A missing side drops only its own " +
          "card; a team with neither is omitted. Spec: " +
          "docs/design/mockups/eerste-ploegen/eerste-ploegen-locked.md.",
      },
    },
  },
} satisfies Meta<typeof FirstTeamsBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

// Fixed dates → deterministic VR (the band reads no `now`; it renders the VMs).
// Hoisted so the Outcomes story can spread it without a non-null assertion.
const aResult: FirstTeamResultVM = {
  matchId: 101,
  home: { name: "KCVV Elewijt" },
  away: { name: "SK Londerzeel" },
  homeScore: 3,
  awayScore: 1,
  isHome: true,
  outcome: "win",
  date: new Date("2026-06-21T15:00:00Z"),
  competition: "3de Nationale",
};

const aTeam: FirstTeamVM = {
  label: "A-ploeg",
  slug: "a-ploeg",
  division: "3de Nationale",
  result: aResult,
  fixture: {
    matchId: 102,
    opponent: { name: "Sporting Hasselt" },
    isHome: false,
    date: new Date("2026-06-29T13:00:00Z"),
    time: "15:00",
    competition: "3de Nationale",
  },
};

const bTeam: FirstTeamVM = {
  label: "B-ploeg",
  slug: "b-ploeg",
  division: "2de Provinciale",
  result: {
    matchId: 201,
    home: { name: "Tempo Overijse" },
    away: { name: "KCVV Elewijt B" },
    homeScore: 2,
    awayScore: 0,
    isHome: false,
    outcome: "loss",
    date: new Date("2026-06-22T13:30:00Z"),
    competition: "2de Provinciale",
  },
  fixture: {
    matchId: 202,
    opponent: { name: "VK Liedekerke" },
    isHome: true,
    date: new Date("2026-06-28T17:30:00Z"),
    time: "19:30",
    competition: "2de Provinciale",
  },
};

export const Default: Story = {
  args: { teams: [aTeam, bTeam] },
};

// A draw + a win, to exercise the no-underline (draw) vs underlined outcomes.
export const Outcomes: Story = {
  args: {
    teams: [
      {
        ...aTeam,
        result: {
          ...aResult,
          homeScore: 1,
          awayScore: 1,
          outcome: "draw",
        },
      },
      bTeam,
    ],
  },
};

// Graceful skip: A has no upcoming fixture (season end), B has no recent result.
export const MissingSides: Story = {
  args: {
    teams: [
      {
        label: aTeam.label,
        slug: aTeam.slug,
        division: aTeam.division,
        result: aTeam.result,
      },
      {
        label: bTeam.label,
        slug: bTeam.slug,
        division: bTeam.division,
        fixture: bTeam.fixture,
      },
    ],
  },
};
