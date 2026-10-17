import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { RankingEntry, RankingTable } from "@kcvv/api-contract";
import { StandingsSection } from "./StandingsSection";

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
    // Mock: club_id mirrors team_id, as the highlight matches on the club.
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

// The single official table every senior side publishes.
const senior: RankingTable = {
  competition_id: 222464,
  competition_name: "3de Afdeling Voetb Vl A",
  entries: [
    entry(1, 101, "KSK Kampenhout", 18, 13, 3, 2, 41, 17, 42),
    entry(2, 102, "FC Perk", 18, 12, 4, 2, 38, 19, 40),
    entry(3, 1235, "KCVV Elewijt", 18, 11, 3, 4, 35, 22, 36),
    entry(4, 104, "Eppegem B", 18, 9, 5, 4, 30, 24, 32),
    entry(5, 105, "SK Relegem", 18, 5, 5, 8, 21, 30, 20),
    entry(6, 106, "VK Humbeek", 18, 3, 4, 11, 15, 38, 13),
  ],
} as RankingTable;

// A finished autumn poule — the phase every youth side loses at the winter
// break, replaced rather than continued.
const autumn: RankingTable = {
  competition_id: 217486,
  competition_name: "Gewestelijk U13 BJ",
  entries: [
    entry(1, 101, "KSK Kampenhout", 14, 11, 2, 1, 38, 12, 35),
    entry(2, 1235, "KCVV Elewijt", 14, 9, 3, 2, 31, 16, 30),
    entry(3, 103, "VK Weerde", 14, 8, 2, 4, 27, 19, 26),
    entry(4, 104, "FC Perk", 14, 5, 3, 6, 20, 24, 18),
    entry(5, 105, "SK Relegem", 14, 3, 2, 9, 14, 32, 11),
    entry(6, 106, "VK Humbeek", 14, 1, 2, 11, 9, 36, 5),
  ],
} as RankingTable;

// The spring poule that replaces it — for one U13 it shared 0 of 7 opponents
// with the autumn one, which is why both tables have to render.
const spring: RankingTable = {
  competition_id: 221298,
  competition_name: "Gewestelijk U13 AY",
  entries: [
    entry(1, 1235, "KCVV Elewijt", 6, 5, 1, 0, 18, 4, 16),
    entry(2, 201, "FC Mollem", 6, 4, 0, 2, 14, 9, 12),
    entry(3, 202, "KFC Kapelle-op-den-Bos", 6, 2, 2, 2, 10, 10, 8),
    entry(4, 203, "SC Steenokkerzeel", 6, 0, 1, 5, 5, 24, 1),
  ],
} as RankingTable;

const meta = {
  title: "Features/Teams/StandingsSection",
  component: StandingsSection,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof StandingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One table — every senior side, and every youth side before the winter break.
 * Sanity carries a `divisionFull` on the three senior docs, and it wins: the
 * club calls its reeks `3e Nationale VV A` where the provider files it as
 * `3de Afdeling Voetb Vl A`.
 */
export const OneTable: Story = {
  args: {
    tables: [senior],
    divisionFull: "3e Nationale VV A",
    highlightClubId: 1235,
  },
};

/**
 * Two tables — a youth side after the winter break. Both live under one
 * section: two sections would break the one-heading / one-seam / one-nav-entry
 * invariant. Sanity carries no `divisionFull` on any youth doc, so each table
 * keeps its own provider name.
 */
export const TwoTables: Story = {
  args: { tables: [autumn, spring], highlightClubId: 1235 },
};

/**
 * The provider name falling through — no editorial override, so the reeks
 * renders under the federation's own string.
 */
export const ProviderNameFallback: Story = {
  args: { tables: [senior], divisionFull: null, highlightClubId: 1235 },
};

// Every row published, none scored yet — before matchday 1 the reeks has
// entries but no numbers, so the section drops position and every numeric
// column and renders the clubs as a plain list (#2605 decision 3).
const numberlessSeason: RankingTable = {
  competition_id: 222464,
  competition_name: "3de Afdeling Voetb Vl A",
  entries: [
    entry(0, 101, "KSK Kampenhout", 0, 0, 0, 0, 0, 0, 0),
    entry(0, 102, "FC Perk", 0, 0, 0, 0, 0, 0, 0),
    entry(0, 1235, "KCVV Elewijt", 0, 0, 0, 0, 0, 0, 0),
    entry(0, 104, "Eppegem B", 0, 0, 0, 0, 0, 0, 0),
  ],
} as RankingTable;

/**
 * No table published — #2605/#2636: the section keeps rendering (its seam
 * and nav entry survive) and says so in present tense, never a promise.
 */
export const NoTables: Story = {
  args: { tables: [] },
};

// The single-table numberless render is `Features/Teams/StandingsTable`'s
// `Numberless` story — byte-identical to what this section would produce
// with one numberless table, so it isn't duplicated here (#2636 finding 6).
// `MixedTables` below is the genuinely distinct section-level case.

/**
 * The winter-break shape (#2636 finding 4): a finished, fully-scored autumn
 * poule next to a spring poule that has not kicked off. Each table is
 * classified on its own — the autumn table renders in full, the spring one
 * as a club list — never one verdict blanket-applied to both.
 */
export const MixedTables: Story = {
  args: { tables: [autumn, numberlessSeason], highlightClubId: 1235 },
};
