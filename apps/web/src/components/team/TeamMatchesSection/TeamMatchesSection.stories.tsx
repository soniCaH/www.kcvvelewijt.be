import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamMatchesSection } from "./TeamMatchesSection";
import type { ScheduleMatch, ScheduleRow } from "@/components/match/types";
import { VR_FROZEN_NOW_ISO } from "../../../../test/vr/frozen-clock";

const KCVV = { id: 1235, name: "KCVV Elewijt" };
const OPP_A = { id: 42, name: "KSV Schoonbeek-Beverst A" };
const OPP_B = { id: 43, name: "FC Mollem" };
const OPP_C = { id: 44, name: "SK Relegem" };
const OPP_D = { id: 45, name: "Racing Gent B" };

// Anchored to the VR harness's FROZEN clock (`test-runner.ts`), not a real
// calendar date — <TeamMatchesSection> filters past/future against that
// frozen instant during a VR capture, never the real "today". Imported
// rather than hand-copied so the two can never drift apart again: an anchor
// picked relative to a real calendar date instead silently drops every
// "recent result" row from the baseline without failing anything, as soon
// as real time carries the anchor past the frozen clock.
const STORY_ANCHOR = VR_FROZEN_NOW_ISO;

/** Every fixture in this file is dated relative to the frozen VR anchor. */
function dateFromAnchor(daysOffset: number): Date {
  const date = new Date(STORY_ANCHOR);
  date.setDate(date.getDate() + daysOffset);
  return date;
}

function m(
  id: number,
  daysOffset: number,
  status: ScheduleMatch["status"],
  scores?: [number, number],
  isHome = true,
  opp = OPP_A,
): ScheduleMatch {
  return {
    kind: "match",
    id,
    date: dateFromAnchor(daysOffset),
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

/**
 * A youth team's next fixture is a pitch-reservation placeholder (#2606) —
 * a tournament with the opponents not yet known, the seasonal pattern that
 * hits seven or eight youth pages at once every May. The featured
 * "Eerstvolgende" slot renders it with the reduced placeholder content
 * (one crest, competition label, real kickoff), not the two-sided
 * scoreboard, and it is not a link.
 */
export const PlaceholderNextMatch: Story = {
  args: {
    matches: [
      m(2, -14, "finished", [1, 1], true, OPP_C),
      m(3, -7, "finished", [3, 0], true, OPP_B),
      {
        kind: "reservation",
        id: 20,
        date: dateFromAnchor(10),
        time: "09:30",
        team: KCVV,
        status: "scheduled",
        competition: "Tornooi",
      } satisfies ScheduleRow,
    ],
  },
};
