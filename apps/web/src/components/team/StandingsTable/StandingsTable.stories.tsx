import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, expect } from "storybook/test";
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

/**
 * Full division with KCVV highlighted mid-table (position 6). Also the
 * deterministic fixture for the mobile-overflow structural assertion
 * (#2861, `test/vr/structural-assertions.ts`) — a real 14-team, 8-column
 * division backstops the guard year-round, independent of whether the live
 * season has started (see `apps/web/test/e2e/scroll-arrows.spec.ts`'s
 * `test.skip`-carrying live-data case, which this deterministic check
 * exists alongside).
 */
export const FullDivision: Story = {
  args: { entries: fullDivision, highlightTeamId: 1235 },
  tags: ["vr-assert-mobile-overflow"],
};

/** No highlight target — renders the table without a KCVV accent row. */
export const NoHighlight: Story = {
  args: { entries: fullDivision },
};

/**
 * Re-homed from `apps/web/test/e2e/scroll-arrows.spec.ts`'s "StandingsTable
 * on /ploegen/[slug] or /wedstrijd/[matchId]" case (#3146, deleted by this
 * ticket). That test's overflow assertion was already superseded by a
 * deterministic backstop before this ticket (#2861,
 * `test/vr/structural-assertions.ts`'s `vr-assert-mobile-overflow` tag on
 * `FullDivision` above) — this story adds the one assertion that backstop
 * does NOT cover: the anchor group (#2476 rule 3) actually carries
 * `position: sticky` on its three pinned cells (`#`, `Ploeg`, `Ptn`), not
 * just that the track overflows. Reuses the same `fullDivision` fixture so
 * the overflow precondition is guaranteed the same way. `!vr`:
 * assertion-only, computed-style check — no pixel truth to capture.
 *
 * This story's `globals.viewport` is honoured by BOTH runners now (#3188,
 * review round 2): `@storybook/addon-vitest`'s own `setViewport()` for
 * `pnpm test:storybook`, and `.storybook/test-runner.ts`'s `preVisit` (a
 * `page.setViewportSize` from the same `globals.viewport.value`, resolved
 * against `.storybook/preview.ts`'s viewport options) for `test-storybook`
 * — so this needs no runner-specific opt-out tag.
 */
export const StickyColumnsPinned: Story = {
  args: { entries: fullDivision, highlightTeamId: 1235 },
  tags: ["!vr"],
  // `kcvvMobile` (375px) turned out too wide — measured, the 8-column
  // division stops overflowing at that width — so this uses a dedicated
  // 360px option instead (`kcvvStandingsTablePhone`, matching the original
  // E2E case). See the docblock above for how both runners resolve it.
  globals: { viewport: { value: "kcvvStandingsTablePhone" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const track = canvas.getByRole("region");
    expect(track.scrollWidth).toBeGreaterThan(track.clientWidth);

    const headers = track.querySelectorAll("th");
    const pinned = [headers[0], headers[1], headers[headers.length - 1]];
    for (const cell of pinned) {
      expect(cell).toBeDefined();
      expect(getComputedStyle(cell as Element).position).toBe("sticky");
    }
  },
};

/** Empty ranking — component renders nothing (auto-hide). */
export const Empty: Story = {
  args: { entries: [] },
};

// Every row published, none scored — the state before matchday 1.
const numberlessDivision: RankingEntry[] = [
  entry(0, 101, "KSK Kampenhout", 0, 0, 0, 0, 0, 0, 0),
  entry(0, 102, "FC Perk", 0, 0, 0, 0, 0, 0, 0),
  entry(0, 1235, "KCVV Elewijt", 0, 0, 0, 0, 0, 0, 0),
  entry(0, 104, "Eppegem B", 0, 0, 0, 0, 0, 0, 0),
];

/**
 * Every entry reads `played 0` / `points 0` (#2605 decision 3) — position
 * and every numeric column drop, and the clubs render as a plain list.
 * Derived from `entries` itself, not a `numberless` prop (#2636 finding 9).
 */
export const Numberless: Story = {
  args: {
    entries: numberlessDivision,
    highlightTeamId: 1235,
    caption: "3de Afdeling Voetb Vl A",
  },
};
