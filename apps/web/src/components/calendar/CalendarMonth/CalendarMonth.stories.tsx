import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { CalendarMonth } from "./CalendarMonth";
import type { CalendarMatch, CalendarEvent } from "@/app/(main)/kalender/utils";

const meta = {
  title: "Features/Calendar/CalendarMonth",
  component: CalendarMonth,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    onSelectDate: fn(),
    onPrevMonth: fn(),
    onNextMonth: fn(),
  },
} satisfies Meta<typeof CalendarMonth>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Mock data ──────────────────────────────────────────────────────────────

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

const marchEvents: CalendarEvent[] = [
  {
    id: "e1",
    title: "Paastoernooi",
    dateStart: "2026-03-20T10:00:00",
    href: "/events/paastoernooi",
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
