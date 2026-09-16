import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { CalendarMonth } from "./CalendarMonth";
import type { CalendarMatch, CalendarEvent } from "@/app/(main)/kalender/utils";
import { fixtureImage } from "@test-fixtures/images";
import { reservationMatch, tournamentMatch } from "../calendar-mocks";

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
    kind: "match" as const,
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
    kind: "match" as const,
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
    kind: "match" as const,
  },
];

const marchEvents: CalendarEvent[] = [
  {
    id: "e1",
    title: "Paastoernooi",
    dateStart: "2026-03-20T10:00:00",
    href: "/evenementen/paastoernooi",
    eventType: "Clubevent",
    source: "event",
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
    kind: "match" as const,
  }),
);

const denseSaturdayEvents: CalendarEvent[] = [
  {
    id: "e-dense",
    title: "Spaghetti-avond",
    dateStart: "2026-03-14T18:00:00",
    href: "/evenementen/spaghetti-avond",
    eventType: "Clubevent",
    source: "event",
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

/**
 * A youth tournament placeholder (#2606) among the day's other matches — the
 * grid pip is a dashed ring (never a filled "home" red), and the day-detail
 * panel renders the reduced `<TeamAgendaRow>` treatment, not a linked
 * "KCVV Elewijt – KCVV Elewijt" scoreboard (#2688).
 */
export const SelectedDayWithReservation: Story = {
  args: {
    matches: [...marchMatches, reservationMatch()],
    events: [],
    selectedDate: "2026-03-15",
    currentMonth: 3,
    currentYear: 2026,
  },
};

/**
 * A tournament fixture (#2696/#2802, `kind: "reduced"`) alongside the
 * pitch-reservation placeholder above and the ordinary matches (#2978) — the
 * grid pip can't tell the two apart (`getMatchDotType` maps both to the same
 * dashed `"reservation"` ring), so this story's baseline is the only one
 * that proves the *other* reduced-register state — a real opponent, one
 * crest, no self-match — also reaches that pip and the day-detail panel's
 * `captionLabel={match.kind !== "match" ? match.team : undefined}` swap.
 * `tournamentMatch()` mirrors the fixture shape `CalendarWeek.stories.tsx`'s
 * `WithTournament` and `CalendarAgenda.stories.tsx`'s `WithTournament`
 * already use; its date is overridden onto the same selected day so both
 * `kind: "reservation"` and `kind: "reduced"` land in the day-detail panel
 * together.
 *
 * The VR runner clips each baseline to `document.documentElement.scrollHeight`
 * (== the viewport height for these stories), so what's actually visible
 * differs per viewport rather than being one uniform "all four rows beside
 * each other" frame: **tablet** (768×1024) is the only baseline tall enough
 * to hold all four day-detail rows — the reduced/tournament row, the
 * reservation row, and both `kind: "match"` rows — genuinely side by side.
 * **Desktop** (1440×900) is shorter than the day-detail panel needs once a
 * fourth row is added, so both `kind: "match"` rows fall below the fold;
 * that baseline still locks the two reduced-register rows and the caption
 * swap, just not beside a `kind: "match"` entry. **Mobile** (375×667) has
 * the whole day-detail panel below the fold, same as the pre-existing
 * `SelectedDayWithReservation--mobile` baseline — it only locks the fourth
 * grid pip.
 */
export const SelectedDayWithReservationAndTournament: Story = {
  args: {
    matches: [
      ...marchMatches,
      reservationMatch(),
      tournamentMatch({ date: "2026-03-15T08:00:00", time: "08:00" }),
    ],
    events: [],
    selectedDate: "2026-03-15",
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
