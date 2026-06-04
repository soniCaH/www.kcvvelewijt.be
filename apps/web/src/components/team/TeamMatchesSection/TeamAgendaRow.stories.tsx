import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamAgendaRow } from "./TeamAgendaRow";
import type { ScheduleMatch } from "@/components/match/types";

const KCVV = { id: 1235, name: "KCVV Elewijt" };
const OPP = { id: 42, name: "KSV Schoonbeek-Beverst A" };

const upcoming: ScheduleMatch = {
  id: 1,
  date: new Date("2026-09-20T15:00:00.000Z"),
  time: "15:00",
  homeTeam: KCVV,
  awayTeam: OPP,
  status: "scheduled",
  competition: "3e Provinciale A",
  isHome: true,
};

const win: ScheduleMatch = {
  ...upcoming,
  id: 2,
  date: new Date("2026-09-13T15:00:00.000Z"),
  status: "finished",
  homeScore: 3,
  awayScore: 1,
};

const draw: ScheduleMatch = {
  ...upcoming,
  id: 3,
  date: new Date("2026-09-06T15:00:00.000Z"),
  status: "finished",
  homeScore: 1,
  awayScore: 1,
};

// KCVV plays away (awayTeam), opponent (OPP) wins at home 2-0 → loss for KCVV.
const loss: ScheduleMatch = {
  ...upcoming,
  id: 4,
  date: new Date("2026-08-30T15:00:00.000Z"),
  status: "finished",
  homeScore: 2,
  awayScore: 0,
  isHome: false,
  homeTeam: OPP,
  awayTeam: KCVV,
};

const meta = {
  title: "Features/Teams/TeamAgendaRow",
  component: TeamAgendaRow,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof TeamAgendaRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Featured "Eerstvolgende" card (jersey-deep bg) — next upcoming match. */
export const Featured: Story = {
  args: { match: upcoming, featured: true },
};

/** Finished — win outcome (jersey-deep underline). */
export const FinishedWin: Story = {
  args: { match: win },
};

/** Finished — draw (no underline). */
export const FinishedDraw: Story = {
  args: { match: draw },
};

/** Finished — loss (brick/alert underline). */
export const FinishedLoss: Story = {
  args: { match: loss },
};

/** Upcoming — kickoff time in display italic. */
export const Upcoming: Story = {
  args: { match: upcoming },
};

/**
 * Opponent fields a non-first team — the "U23" designation (from PSD's
 * `awayTeam` code) is pinned beside the club name. The KCVV side carries its
 * numeric squad code and shows no suffix.
 */
export const WithOpponentTeamLabel: Story = {
  args: {
    match: {
      ...upcoming,
      awayTeam: {
        id: 88,
        name: "Yellow Red KV Mechelen",
        teamLabel: "U23",
      },
    },
  },
};
