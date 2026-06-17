import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { RankingEntry } from "@kcvv/api-contract";
import { MatchStandingsSection } from "./MatchStandingsSection";

function entry(
  position: number,
  team_id: number,
  team_name: string,
  played: number,
  won: number,
  drawn: number,
  lost: number,
  goals_for: number,
  goals_against: number,
  points: number,
): RankingEntry {
  return {
    position,
    team_id,
    // Mock: club_id mirrors team_id so the head-to-head filter (by club id) and
    // the KCVV highlight (by team id) line up on the same numbers.
    club_id: team_id,
    team_name,
    played,
    won,
    drawn,
    lost,
    goals_for,
    goals_against,
    goal_difference: goals_for - goals_against,
    points,
  } as RankingEntry;
}

// A realistic provincial division with KCVV mid-table (team_id 1235).
const fullDivision: RankingEntry[] = [
  entry(1, 101, "KSK Kampenhout", 18, 13, 3, 2, 41, 17, 42),
  entry(2, 102, "FC Perk", 18, 12, 4, 2, 38, 19, 40),
  entry(3, 103, "VK Weerde", 18, 11, 3, 4, 35, 22, 36),
  entry(4, 104, "Eppegem B", 18, 9, 5, 4, 30, 24, 32),
  entry(5, 105, "SK Kampenhout B", 18, 8, 6, 4, 28, 23, 30),
  entry(6, 1235, "KCVV Elewijt", 18, 8, 4, 6, 27, 25, 28),
  entry(7, 107, "Hofstade VV", 18, 7, 5, 6, 26, 26, 26),
  entry(8, 108, "FC Mollem", 18, 6, 4, 8, 22, 28, 22),
  entry(9, 109, "SK Relegem", 18, 5, 5, 8, 21, 30, 20),
  entry(10, 110, "VK Humbeek", 18, 4, 4, 10, 18, 35, 16),
];

const meta = {
  title: "Features/Matches/MatchStandingsSection",
  component: MatchStandingsSection,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MatchStandingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * League match KCVV (6th) vs VK Weerde (3rd) — the full division is passed but
 * only the two teams playing render, each at its real position; KCVV tinted.
 */
export const Default: Story = {
  args: {
    entries: fullDivision,
    homeClubId: 1235,
    awayClubId: 103,
    highlightTeamId: 1235,
  },
};

/** Without a highlight (e.g. team id unresolved) — neither row is tinted. */
export const NoHighlight: Story = {
  args: { entries: fullDivision, homeClubId: 1235, awayClubId: 103 },
};

/**
 * Empty ranking (off-season / cup / friendly) — the section auto-hides, so the
 * story renders nothing. Tagged `vr-skip` since there's no visual to capture.
 */
export const EmptyAutoHides: Story = {
  args: { entries: [], homeClubId: 1235, awayClubId: 103 },
  tags: ["vr-skip"],
};
