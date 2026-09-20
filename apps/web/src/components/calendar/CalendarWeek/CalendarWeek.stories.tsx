import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarWeek } from "./CalendarWeek";
import type { CalendarMatch, CalendarEvent } from "@/app/(main)/kalender/utils";
import { fixtureImage } from "@test-fixtures/images";
import { reservationMatch, tournamentMatch } from "../calendar-mocks";

const meta = {
  title: "Features/Calendar/CalendarWeek",
  component: CalendarWeek,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof CalendarWeek>;

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
    isHome: true,
    kind: "match",
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
    isHome: true,
    kind: "match",
  },
];

const weekEvents: CalendarEvent[] = [
  {
    id: "e1",
    title: "Jeugdtraining extra",
    dateStart: "2026-03-25T18:00:00",
    href: "/evenementen/jeugdtraining",
    eventType: "Jeugdwerking",
    source: "event",
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

/** A pitch-reservation placeholder among the week's other matches (#2606, #2688). */
export const WithReservation: Story = {
  args: {
    matches: [
      ...weekMatches,
      reservationMatch({ date: "2026-03-26T09:30:00" }),
    ],
    events: weekEvents,
    weekStart: "2026-03-23",
  },
};

/**
 * A tournament fixture (#2696/#2715) among the week's other matches — one
 * crest (the named club's, not KCVV's), no opponent link. Distinct from
 * `WithReservation` above: the subject names a real opponent (`TORNOOI · FC
 * ZEMST SPORTIEF`), where a placeholder's subject is the competition alone.
 */
export const WithTournament: Story = {
  args: {
    matches: [...weekMatches, tournamentMatch({ date: "2026-03-26T09:30:00" })],
    events: weekEvents,
    weekStart: "2026-03-23",
  },
};

/**
 * A finished match with a score, among the week's scheduled ones (#2610,
 * now mono per #2579's subject/tag rule) — `weekMatches` above only
 * exercises `scoreDisplay: { type: "vs" }`, so no story previously rendered
 * the `{ type: "score" }` branch this row's mono treatment touches.
 */
export const WithPlayedMatch: Story = {
  args: {
    matches: [
      ...weekMatches,
      {
        id: 3,
        date: "2026-03-25T20:00:00",
        time: "20:00",
        homeTeam: kcvv,
        awayTeam: { id: 4, name: "SK Londerzeel" },
        scoreDisplay: { type: "score", home: 3, away: 1 },
        status: "finished",
        competition: "Beker van Vlaanderen",
        team: "A-ploeg",
        isHome: true,
        kind: "match",
      },
    ],
    events: weekEvents,
    weekStart: "2026-03-23",
  },
};
