import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { CalendarWeek } from "./CalendarWeek";
import type { CalendarMatch, CalendarEvent } from "@/app/(main)/kalender/utils";

const meta = {
  title: "Features/Calendar/CalendarWeek",
  component: CalendarWeek,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    onPrevWeek: fn(),
    onNextWeek: fn(),
  },
} satisfies Meta<typeof CalendarWeek>;

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

const weekMatches: CalendarMatch[] = [
  {
    id: 1,
    date: "2026-03-28T15:00:00",
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
    date: "2026-03-29T10:00:00",
    time: "10:00",
    homeTeam: kcvv,
    awayTeam: { id: 3, name: "KFC Diest" },
    scoreDisplay: { type: "vs" },
    status: "scheduled",
    competition: "Jeugd",
    team: "U15 A",
  },
];

const weekEvents: CalendarEvent[] = [
  {
    id: "e1",
    title: "Jeugdtraining extra",
    dateStart: "2026-03-25T18:00:00",
    href: "/events/jeugdtraining",
  },
];

// ── Stories ────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    matches: weekMatches,
    events: weekEvents,
    weekStart: "2026-03-23",
  },
};

export const EmptyWeek: Story = {
  args: {
    matches: [],
    events: [],
    weekStart: "2026-04-06",
  },
};
