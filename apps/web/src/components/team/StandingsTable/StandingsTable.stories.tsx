import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { RankingEntry } from "@kcvv/api-contract";
import { StandingsTable } from "./StandingsTable";

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

// A realistic 14-team provincial division with KCVV mid-table.
const fullDivision: RankingEntry[] = [
  entry(1, 101, "KSK Kampenhout", 18, 13, 3, 2, 41, 17, 42),
  entry(2, 102, "FC Perk", 18, 12, 4, 2, 38, 19, 40),
  entry(3, 103, "VK Weerde", 18, 11, 3, 4, 35, 22, 36),
  entry(4, 104, "Eppegem B", 18, 9, 5, 4, 30, 24, 32),
  entry(5, 105, "SK Kampenhout B", 18, 8, 6, 4, 28, 23, 30),
  entry(6, 1235, "KCVV Elewijt", 18, 8, 4, 6, 27, 25, 28),
  entry(7, 107, "Hofstade VV", 18, 7, 5, 6, 26, 26, 26),
  entry(8, 108, "KSV Schoonbeek-Beverst A", 18, 6, 6, 6, 24, 27, 24),
  entry(9, 109, "FC Mollem", 18, 6, 4, 8, 22, 28, 22),
  entry(10, 110, "SK Relegem", 18, 5, 5, 8, 21, 30, 20),
  entry(11, 111, "Racing Gent B", 18, 5, 3, 10, 19, 33, 18),
  entry(12, 112, "VK Humbeek", 18, 4, 4, 10, 18, 35, 16),
  entry(13, 113, "KFC Kapelle-op-den-Bos", 18, 3, 4, 11, 15, 38, 13),
  entry(14, 114, "SC Steenokkerzeel", 18, 2, 3, 13, 12, 42, 9),
];

const meta = {
  title: "Features/Teams/StandingsTable",
  component: StandingsTable,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof StandingsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full division with KCVV highlighted mid-table (position 6). */
export const FullDivision: Story = {
  args: { entries: fullDivision, highlightTeamId: 1235 },
};

/** No highlight target — renders the table without a KCVV accent row. */
export const NoHighlight: Story = {
  args: { entries: fullDivision },
};

/** Empty ranking — component renders nothing (auto-hide). */
export const Empty: Story = {
  args: { entries: [] },
};
