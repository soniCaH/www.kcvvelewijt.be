import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarWidget } from "./CalendarWidget";
import type {
  CalendarMatch,
  CalendarEvent,
  CalendarTeamInfo,
} from "@/app/(main)/kalender/utils";

const kcvv = {
  id: 1,
  name: "KCVV Elewijt A",
  logo: "https://placehold.co/40x40/4acf52/ffffff?text=KE",
};
const opponent = {
  id: 2,
  name: "Racing Mechelen",
  logo: "https://placehold.co/40x40/cccccc/333333?text=RM",
};

const matches: CalendarMatch[] = [
  {
    id: 1,
    date: "2026-03-15T15:00:00",
    time: "15:00",
    homeTeam: kcvv,
    awayTeam: opponent,
    scoreDisplay: { type: "vs" },
    status: "scheduled",
    competition: "Nationale 1",
    team: "A-ploeg",
  },
  {
    id: 2,
    date: "2026-03-22T14:30:00",
    time: "14:30",
    homeTeam: opponent,
    awayTeam: kcvv,
    scoreDisplay: { type: "vs" },
    status: "scheduled",
    competition: "Nationale 1",
    team: "A-ploeg",
  },
  {
    id: 3,
    date: "2026-03-15T10:00:00",
    time: "10:00",
    homeTeam: kcvv,
    awayTeam: { id: 3, name: "KFC Diest" },
    scoreDisplay: { type: "vs" },
    status: "scheduled",
    competition: "Jeugd",
    team: "U15 A",
  },
];

const events: CalendarEvent[] = [
  {
    id: "e1",
    title: "Paastoernooi",
    dateStart: "2026-03-20T10:00:00",
    href: "/events/paastoernooi",
  },
];

const teams: CalendarTeamInfo[] = [
  { id: "t1", name: "A-ploeg", psdId: 101, label: "A-ploeg" },
  { id: "t2", name: "U15 A", psdId: 103, label: "U15 A" },
];

const meta = {
  title: "Features/Calendar/CalendarWidget",
  component: CalendarWidget,
  parameters: {
    layout: "padded",
    nextjs: {
      navigation: { pathname: "/kalender", query: {} },
    },
  },
  tags: ["autodocs"],
  args: {
    matches,
    events,
    teams,
    activeTeamFilter: "all",
  },
} satisfies Meta<typeof CalendarWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ────────────────────────────────────────────────────────────────

export const MonthView: Story = {
  parameters: {
    nextjs: {
      navigation: { pathname: "/kalender", query: { view: "month" } },
    },
  },
};

export const WeekView: Story = {
  parameters: {
    nextjs: {
      navigation: { pathname: "/kalender", query: { view: "week" } },
    },
  },
};

export const ListView: Story = {
  parameters: {
    nextjs: {
      navigation: { pathname: "/kalender", query: { view: "list" } },
    },
  },
};

export const SubscribePanelOpen: Story = {
  parameters: {
    nextjs: {
      navigation: { pathname: "/kalender", query: { view: "month" } },
    },
  },
};
