import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarAgenda } from "./CalendarAgenda";
import type { CalendarMatch, CalendarEvent } from "@/app/(main)/kalender/utils";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Calendar/CalendarAgenda",
  component: CalendarAgenda,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
  decorators: [
    (Story) => (
      <div className="bg-cream max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CalendarAgenda>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Mock data ──────────────────────────────────────────────────────────────

const kcvv = {
  id: 1,
  name: "KCVV Elewijt",
  logo: fixtureImage("sponsor-logo", 0),
};

function match(
  id: number,
  date: string,
  team: string,
  opponent: string,
  opts: Partial<CalendarMatch> = {},
): CalendarMatch {
  const isHome = opts.isHome ?? true;
  return {
    id,
    date,
    time: date.slice(11, 16),
    homeTeam: isHome ? kcvv : { id: 100 + id, name: opponent },
    awayTeam: isHome ? { id: 100 + id, name: opponent } : kcvv,
    scoreDisplay: { type: "vs" },
    status: "scheduled",
    competition: "Competitie",
    team,
    isHome,
    ...opts,
  };
}

function event(
  id: string,
  dateStart: string,
  title: string,
  eventType: CalendarEvent["eventType"],
): CalendarEvent {
  return {
    id,
    dateStart,
    title,
    href: `/evenementen/${id}`,
    eventType,
    source: "event",
  };
}

const baseProps = { currentMonth: 9, currentYear: 2026 };

// A normal month: a sparse Sunday A-match + an event, where the agenda shines.
const sparseMatches: CalendarMatch[] = [
  match(1, "2026-09-13T15:00:00", "A-ploeg", "Racing Mechelen"),
  match(2, "2026-09-20T15:00:00", "A-ploeg", "Kampenhout", {
    status: "finished",
    homeScore: 1,
    awayScore: 2,
    scoreDisplay: { type: "score", home: 1, away: 2 },
  }),
];
const sparseEvents: CalendarEvent[] = [
  event("alv", "2026-09-09T20:00:00", "Algemene ledenvergadering", "Clubevent"),
];

// The dense-Saturday stress case: 10 youth matches + 1 event on one day.
const denseMatches: CalendarMatch[] = Array.from({ length: 10 }, (_, i) =>
  match(
    100 + i,
    `2026-09-12T${String(9 + i).padStart(2, "0")}:00:00`,
    `U${7 + i}`,
    "Tegenstander",
    { isHome: i % 3 !== 0 },
  ),
);
const denseEvents: CalendarEvent[] = [
  event("spaghetti", "2026-09-12T18:00:00", "Spaghetti-avond", "Clubevent"),
];

// ── Stories ────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: { ...baseProps, matches: sparseMatches, events: sparseEvents },
};

export const DenseSaturday: Story = {
  args: { ...baseProps, matches: denseMatches, events: denseEvents },
};

export const SingleEventDay: Story = {
  args: {
    ...baseProps,
    matches: [],
    events: [
      event(
        "tornooi",
        "2026-09-19T10:00:00",
        "Najaarstornooi U13",
        "Jeugdwerking",
      ),
    ],
  },
};

export const EmptyMonth: Story = {
  args: { ...baseProps, matches: [], events: [] },
};
