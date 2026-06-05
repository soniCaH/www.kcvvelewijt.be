import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { CalendarMonth } from "./CalendarMonth";
import type { CalendarMatch, CalendarEvent } from "@/app/(main)/kalender/utils";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Calendar/CalendarMonth",
  component: CalendarMonth,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
  args: {
    onSelectDate: fn(),
  },
} satisfies Meta<typeof CalendarMonth>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Mock data ──────────────────────────────────────────────────────────────

const kcvv = {
  id: 1,
  name: "KCVV Elewijt A",
  logo: fixtureImage("sponsor-logo", 0),
};
const opponent = {
  id: 2,
  name: "Racing Mechelen",
  logo: fixtureImage("sponsor-logo", 1),
};

const marchMatches: CalendarMatch[] = [
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
    isHome: true,
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
    isHome: false,
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
    isHome: true,
  },
];

const marchEvents: CalendarEvent[] = [
  {
    id: "e1",
    title: "Paastoernooi",
    dateStart: "2026-03-20T10:00:00",
    href: "/evenementen/paastoernooi",
    eventType: "Clubevent",
  },
];

// A 10-match Saturday + 1 event — the dense-day stress case (6d0 audit).
const denseSaturdayMatches: CalendarMatch[] = Array.from(
  { length: 10 },
  (_, i) => ({
    id: 100 + i,
    date: `2026-03-14T${String(9 + i).padStart(2, "0")}:00:00`,
    time: `${String(9 + i).padStart(2, "0")}:00`,
    homeTeam: i % 3 === 0 ? opponent : kcvv,
    awayTeam: i % 3 === 0 ? kcvv : { id: 30 + i, name: "Tegenstander" },
    scoreDisplay: { type: "vs" },
    status: "scheduled",
    competition: "Jeugd",
    team: `U${7 + i}`,
    isHome: i % 3 !== 0,
  }),
);

const denseSaturdayEvents: CalendarEvent[] = [
  {
    id: "e-dense",
    title: "Spaghetti-avond",
    dateStart: "2026-03-14T18:00:00",
    href: "/evenementen/spaghetti-avond",
    eventType: "Clubevent",
  },
];

// ── Stories ────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    matches: marchMatches,
    events: marchEvents,
    selectedDate: "2026-03-15",
    currentMonth: 3,
    currentYear: 2026,
  },
};

export const SelectedDayWithMatches: Story = {
  args: {
    matches: marchMatches,
    events: [],
    selectedDate: "2026-03-15",
    currentMonth: 3,
    currentYear: 2026,
  },
};

export const SelectedDayWithEvent: Story = {
  args: {
    matches: [],
    events: marchEvents,
    selectedDate: "2026-03-20",
    currentMonth: 3,
    currentYear: 2026,
  },
};

export const DenseSaturday: Story = {
  args: {
    matches: denseSaturdayMatches,
    events: denseSaturdayEvents,
    selectedDate: "2026-03-14",
    currentMonth: 3,
    currentYear: 2026,
  },
};

export const SelectedDayEmpty: Story = {
  args: {
    matches: marchMatches,
    events: [],
    selectedDate: "2026-03-10",
    currentMonth: 3,
    currentYear: 2026,
  },
};

export const NoMatchesInMonth: Story = {
  args: {
    matches: [],
    events: [],
    selectedDate: "2026-04-01",
    currentMonth: 4,
    currentYear: 2026,
  },
};
