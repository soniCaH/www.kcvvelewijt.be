import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarView, type CalendarMatch } from "./CalendarView";

const meta: Meta<typeof CalendarView> = {
  title: "Features/Calendar/CalendarView",
  component: CalendarView,
  parameters: {
    layout: "padded",
    nextjs: {
      navigation: { pathname: "/calendar", query: {} },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CalendarView>;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const kcvv: CalendarMatch["homeTeam"] = {
  id: 1,
  name: "KCVV Elewijt A",
  logo: "https://placehold.co/40x40/4acf52/ffffff?text=KE",
};
const opponent1: CalendarMatch["homeTeam"] = {
  id: 2,
  name: "Racing Mechelen",
  logo: "https://placehold.co/40x40/cccccc/333333?text=RM",
};
const opponent2: CalendarMatch["homeTeam"] = {
  id: 3,
  name: "FC Leuven B",
};

const mockMatches: CalendarMatch[] = [
  // Past — finished
  {
    id: 1,
    date: "2026-02-08T15:00:00",
    homeTeam: kcvv,
    awayTeam: opponent1,
    homeScore: 3,
    awayScore: 1,
    status: "finished",
    competition: "Nationale 1",
    team: "A-ploeg",
  },
  // Past — postponed
  {
    id: 2,
    date: "2026-02-15T14:30:00",
    homeTeam: opponent1,
    awayTeam: kcvv,
    status: "postponed",
    competition: "Nationale 1",
    team: "A-ploeg",
  },
  // Fixed date fixture — represents a forfeited match (2025-12-07T15:00:00Z)
  {
    id: 3,
    date: "2025-12-07T15:00:00.000Z",
    homeTeam: kcvv,
    awayTeam: opponent2,
    homeScore: 3,
    awayScore: 0,
    status: "forfeited",
    competition: "Beker",
    team: "B-ploeg",
  },
  // Upcoming — scheduled
  {
    id: 4,
    date: "2026-03-01T15:00:00",
    homeTeam: opponent2,
    awayTeam: kcvv,
    status: "scheduled",
    competition: "Nationale 1",
    team: "A-ploeg",
  },
  {
    id: 5,
    date: "2026-03-01T11:00:00",
    homeTeam: kcvv,
    awayTeam: { id: 4, name: "KFC Diest" },
    status: "scheduled",
    competition: "Jeugdcompetitie",
    team: "U15 A",
  },
  // Future — stopped
  {
    id: 6,
    date: "2026-03-08T15:00:00",
    homeTeam: kcvv,
    awayTeam: { id: 5, name: "Sporting Lokeren" },
    status: "stopped",
    competition: "Nationale 1",
    team: "A-ploeg",
  },
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** All match statuses across multiple teams and dates. Filter tabs visible. */
export const Default: Story = {
  args: { matches: mockMatches },
};

/** Only A-ploeg matches — URL param `?team=A-ploeg` pre-selects the tab. */
export const FilteredByTeam: Story = {
  args: { matches: mockMatches },
  parameters: {
    nextjs: {
      navigation: { pathname: "/calendar", query: { team: "A-ploeg" } },
    },
  },
};

/** No matches — shows the empty state. */
export const Empty: Story = {
  args: { matches: [] },
};

/** Mobile viewport. */
export const Mobile: Story = {
  args: { matches: mockMatches },
  globals: {
    viewport: { value: "mobile1" },
  },
};
