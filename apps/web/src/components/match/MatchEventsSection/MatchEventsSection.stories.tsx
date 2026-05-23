import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchEventsSection } from "./MatchEventsSection";
import type { MatchEvent } from "../MatchEvents/MatchEvents";

const KCVV_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1";
const OPPONENT_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1";

const events: MatchEvent[] = [
  {
    id: 1,
    type: "goal",
    minute: 12,
    team: "home",
    player: "Lars De Vos",
  },
  {
    id: 2,
    type: "yellow_card",
    minute: 28,
    team: "away",
    player: "Kevin Smets",
  },
  {
    id: 3,
    type: "goal",
    minute: 45,
    additionalTime: 2,
    team: "home",
    player: "Jens Vermeulen",
    isPenalty: true,
  },
  {
    id: 4,
    type: "goal",
    minute: 56,
    team: "away",
    player: "Tom Janssens",
  },
  {
    id: 5,
    type: "yellow_card",
    minute: 67,
    team: "home",
    player: "Maxim Breugelmans",
  },
  {
    id: 6,
    type: "substitution",
    minute: 71,
    team: "home",
    playerIn: "Pieter De Bondt",
    playerOut: "Lars De Vos",
  },
  {
    id: 7,
    type: "goal",
    minute: 78,
    team: "home",
    player: "Maxim Breugelmans",
  },
  {
    id: 8,
    // Same player as event #2 → tweede gele kaart → distinct stacked glyph.
    type: "second_yellow",
    minute: 84,
    team: "away",
    player: "Kevin Smets",
  },
  {
    id: 9,
    // Direct red, different player — visually distinct from event #8.
    type: "red_card",
    minute: 90,
    team: "away",
    player: "Bart Geerts",
  },
];

const meta = {
  title: "Features/Matches/MatchEventsSection",
  component: MatchEventsSection,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream min-h-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MatchEventsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullData: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "RC Mechelen",
    homeTeamLogo: KCVV_LOGO,
    awayTeamLogo: OPPONENT_LOGO,
    events,
  },
};

export const GoalsOnly: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "RC Mechelen",
    homeTeamLogo: KCVV_LOGO,
    awayTeamLogo: OPPONENT_LOGO,
    events: events.filter((e) => e.type === "goal"),
  },
};

export const StoppageTimeOrder: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "RC Mechelen",
    homeTeamLogo: KCVV_LOGO,
    awayTeamLogo: OPPONENT_LOGO,
    events: [
      // Out-of-order input — the section sorts chronologically with stoppage
      // time inserted before the next regular minute.
      { id: 1, type: "goal", minute: 46, team: "home", player: "After Half" },
      {
        id: 2,
        type: "goal",
        minute: 45,
        additionalTime: 2,
        team: "home",
        player: "Jens Vermeulen",
      },
      {
        id: 3,
        type: "yellow_card",
        minute: 90,
        additionalTime: 4,
        team: "away",
        player: "Late Card",
      },
    ],
  },
};

/**
 * Typographic-shield fallback when no logo URL is provided — the row chip
 * renders the team-name initial in a circle (same pattern as `<MatchHero>`).
 */
export const NoLogos: Story = {
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "RC Mechelen",
    events: events.slice(0, 5),
  },
};

/**
 * Empty branch — no events recorded (typical of upcoming matches). The
 * component returns `null`. Tagged `vr-skip` per Phase 6.A precedent.
 */
export const Empty: Story = {
  tags: ["vr-skip"],
  args: {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "RC Mechelen",
    events: [],
  },
};
