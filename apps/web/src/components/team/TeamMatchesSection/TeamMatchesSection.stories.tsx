import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamMatchesSection } from "./TeamMatchesSection";
import type { ScheduleMatch } from "@/components/match/types";

const KCVV = { id: 1235, name: "KCVV Elewijt" };
const OPP_A = { id: 42, name: "KSV Schoonbeek-Beverst A" };
const OPP_B = { id: 43, name: "FC Mollem" };
const OPP_C = { id: 44, name: "SK Relegem" };
const OPP_D = { id: 45, name: "Racing Gent B" };

function m(
  id: number,
  daysOffset: number,
  status: ScheduleMatch["status"],
  scores?: [number, number],
  isHome = true,
  opp = OPP_A,
): ScheduleMatch {
  const date = new Date("2026-09-15T12:00:00.000Z");
  date.setDate(date.getDate() + daysOffset);
  return {
    id,
    date,
    time: "15:00",
    homeTeam: isHome ? KCVV : opp,
    awayTeam: isHome ? opp : KCVV,
    status,
    competition: "3e Provinciale A",
    isHome,
    homeScore: scores?.[0],
    awayScore: scores?.[1],
  };
}

/** Mid-season: a mix of recent results + featured next match. */
const midSeason: ScheduleMatch[] = [
  m(1, -21, "finished", [0, 2], false, OPP_D),
  m(2, -14, "finished", [1, 1], true, OPP_C),
  m(3, -7, "finished", [3, 0], true, OPP_B),
  m(4, 7, "scheduled", undefined, false, OPP_A),
  m(5, 14, "scheduled", undefined, true, OPP_B),
];

/** Season-start: only future matches — no results yet. */
const seasonStart: ScheduleMatch[] = [
  m(10, 7, "scheduled", undefined, true, OPP_A),
  m(11, 14, "scheduled", undefined, false, OPP_B),
  m(12, 21, "scheduled", undefined, true, OPP_C),
];

const meta = {
  title: "Features/Teams/TeamMatchesSection",
  component: TeamMatchesSection,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
  args: { teamSlug: "kcvv-elewijt-a", kcvvTeamId: 1235 },
} satisfies Meta<typeof TeamMatchesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mid-season: featured next match + recent results. */
export const MidSeason: Story = {
  args: { matches: midSeason },
};

/** Season-start: only the next fixture; no results. */
export const SeasonStart: Story = {
  args: { matches: seasonStart },
};

/** Empty — component renders nothing (auto-hide). */
export const Empty: Story = {
  args: { matches: [] },
};
