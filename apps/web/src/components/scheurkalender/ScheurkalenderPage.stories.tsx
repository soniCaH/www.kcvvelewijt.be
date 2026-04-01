/**
 * ScheurkalenderPage Stories
 *
 * Print-friendly upcoming-matches calendar, grouped by date.
 * The print layout (print: classes) is visible when using the browser's
 * print preview; the screen layout is shown by default in Storybook.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ScheurkalenderPage,
  type ScheurkalenderDay,
} from "./ScheurkalenderPage";
import ScheurkalenderLoading from "@/app/(main)/scheurkalender/loading";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toLabel(date: Date): string {
  return date.toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const day1 = daysFromNow(3);
const day2 = daysFromNow(7);
const day3 = daysFromNow(14);

const mockDays: ScheurkalenderDay[] = [
  {
    key: toKey(day1),
    label: toLabel(day1),
    matches: [
      {
        id: 1,
        time: "15:00",
        squadLabel: "A-Ploeg",
        homeTeam: { name: "KCVV Elewijt" },
        awayTeam: { name: "Strombeek" },
      },
      {
        id: 2,
        time: "11:00",
        squadLabel: "U15A",
        homeTeam: { name: "KCVV Elewijt U15" },
        awayTeam: { name: "FC Kampenhout U15" },
      },
    ],
  },
  {
    key: toKey(day2),
    label: toLabel(day2),
    matches: [
      {
        id: 3,
        time: "15:00",
        squadLabel: "A-Ploeg",
        homeTeam: { name: "Racing Mechelen" },
        awayTeam: { name: "KCVV Elewijt" },
      },
      {
        id: 4,
        time: "10:00",
        squadLabel: "U13B",
        homeTeam: { name: "KCVV Elewijt U13" },
        awayTeam: { name: "Diegem Sport U13" },
      },
      {
        id: 5,
        time: "14:00",
        squadLabel: "U17A",
        homeTeam: { name: "Jeugd Zemst U17" },
        awayTeam: { name: "KCVV Elewijt U17" },
      },
    ],
  },
  {
    key: toKey(day3),
    label: toLabel(day3),
    matches: [
      {
        id: 6,
        time: "15:00",
        squadLabel: "A-Ploeg",
        homeTeam: { name: "KCVV Elewijt" },
        awayTeam: { name: "FC Kampenhout" },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: "Pages/ScheurkalenderPage",
  component: ScheurkalenderPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Print-friendly upcoming-matches calendar for /scheurkalender. Matches are grouped by date. The green header and back link are hidden on print; a minimal print header with the current date is shown instead.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ScheurkalenderPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Upcoming matches across three match days.
 */
export const Default: Story = {
  args: { days: mockDays },
};

/**
 * Single match day.
 */
export const SingleDay: Story = {
  args: { days: mockDays.slice(0, 1) },
};

/**
 * No matches — empty state.
 */
export const NoMatches: Story = {
  args: { days: [] },
};

/**
 * Mobile viewport.
 */
export const MobileViewport: Story = {
  args: { days: mockDays },
  globals: { viewport: { value: "kcvvMobile" } },
};

export const RouteSkeleton: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: {} as any,
  render: () => <ScheurkalenderLoading />,
  parameters: { layout: "fullscreen" },
};
