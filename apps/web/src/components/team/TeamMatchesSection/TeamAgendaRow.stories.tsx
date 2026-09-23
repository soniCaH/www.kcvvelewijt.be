import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamAgendaRow } from "./TeamAgendaRow";
import type {
  ScheduleMatch,
  ScheduleReducedMatch,
  ScheduleReservation,
} from "@/components/match/types";

const KCVV = { id: 1235, name: "KCVV Elewijt" };
const OPP = { id: 42, name: "KSV Schoonbeek-Beverst A" };

const upcoming: ScheduleMatch = {
  kind: "match",
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

/** Finished — draw (ink-muted underline, #2512/#2656). */
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
 * Forfeited — the scoreline is awarded, not played, so the caption names it
 * ("FF", brick) and the win still earns its jersey-deep underline. Without
 * the marker the row is an unexplained 5–0 (#2423).
 */
export const Forfeited: Story = {
  args: {
    match: { ...win, id: 5, homeScore: 5, awayScore: 0, status: "forfeited" },
  },
};

/**
 * Forfeited in the featured slot — the marker drops to `warm` so it stays
 * legible on jersey-deep, where brick would disappear.
 */
export const ForfeitedFeatured: Story = {
  args: {
    match: { ...win, id: 6, homeScore: 5, awayScore: 0, status: "forfeited" },
    featured: true,
  },
};

/**
 * Postponed — kickoff time still shown (there is no score), but "PP" (Uitgesteld)
 * stops the row reading as a match to turn up for.
 */
export const Postponed: Story = {
  args: { match: { ...upcoming, id: 7, status: "postponed" } },
};

/** Cancelled — will not be played at all. */
export const Cancelled: Story = {
  args: { match: { ...upcoming, id: 8, status: "cancelled" } },
};

/**
 * Abandoned early. The partial scoreline still renders (it is what happened on
 * the pitch) but carries no outcome tint — nothing is settled until the replay.
 */
export const Stopped: Story = {
  args: {
    match: { ...win, id: 9, status: "stopped" },
  },
};

/**
 * `kind` on a settled result — the caption opens with the outcome word, so
 * a win is legible without reading the jersey-deep underline behind the score.
 * Used by the homepage `<FirstTeamsBlock>`, whose two columns have no headings
 * of their own (#2404).
 */
export const KindLabelledResult: Story = {
  args: { match: win, kind: "result" },
};

/** `kind` on a draw — "Gelijk", the caption-register spelling (#2656). */
export const KindLabelledDraw: Story = {
  args: { match: draw, kind: "result" },
};

/**
 * `kind` in the fixture slot, featured — the word drops to `warm`, the same
 * switch the forfeit marker makes, because ink on jersey-deep does not read.
 */
export const KindLabelledFixture: Story = {
  args: { match: upcoming, featured: true, kind: "fixture" },
};

/**
 * The case that makes `kind` a caller's answer rather than a derived one: a
 * match that has kicked off while PSD still calls it `scheduled`, sitting in
 * the *result* slot because `pickLastResult` puts it there. Deriving from
 * status would label this "Volgende" — beside the real fixture, also
 * "Volgende". The slot says "Uitslag volgt" and shows `–` in the demoted
 * mono register where a score will go, not the kickoff time (#2587).
 */
export const KindLabelledAwaitingScore: Story = {
  args: { match: { ...upcoming, id: 10 }, kind: "result" },
};

/**
 * `kind` on a postponed match — the status marker wins and no kind word is
 * added. "Volgende · PP" would argue with itself.
 */
export const KindLabelledPostponed: Story = {
  args: {
    match: { ...upcoming, id: 11, status: "postponed" },
    kind: "fixture",
  },
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

// ─── Placeholder fixture (#2606) ────────────────────────────────────────────
// A pitch-reservation the club enters when a team has something on the
// calendar but the opponent and programme aren't settled yet — both sides of
// the fixture are KCVV. One reduced tree at every viewport: one crest, the
// competition label in the caption's mono-uppercase register, and the real
// kickoff time. No opponent, no score slot, no home/away icon, and — unlike
// every other state on this page — not a link.

const placeholderTournament: ScheduleReservation = {
  kind: "reservation",
  id: 90,
  date: new Date("2026-05-09T09:30:00.000Z"),
  time: "09:30",
  team: KCVV,
  status: "scheduled",
  competition: "Tornooi",
};

/** The dominant real case (15 of 17 in the #2606 census): a youth tournament. */
export const Placeholder: Story = {
  args: { match: placeholderTournament },
};

/** Featured "Eerstvolgende" placeholder — jersey-deep bg, same reduced content. */
export const PlaceholderFeatured: Story = {
  args: { match: placeholderTournament, featured: true },
};

/**
 * The casing gotcha (#2606): PSD sends this competition name lowercase, and
 * `mapCompetitionLabel` passes it through verbatim. Rendering the subject in
 * the caption's mono-uppercase register fixes it for free — no string
 * normalisation needed.
 */
export const PlaceholderFriendlyLowercaseLabel: Story = {
  args: {
    match: {
      ...placeholderTournament,
      id: 91,
      date: new Date("2026-08-22T19:00:00.000Z"),
      time: "19:00",
      competition: "vriendschappelijk",
    },
  },
};

/**
 * A subject long enough to fill the row at a narrow width — locks the
 * `min-w-0` fix on this content box (see the comment on it in
 * `TeamAgendaRow.tsx`). Same box the tournament row below reuses.
 *
 * Only the mobile viewport can ever show the truncation this story exists to
 * lock — at tablet/desktop width a long subject fits without wrapping, same
 * as `Placeholder`/`PlaceholderFeatured` above, so a tablet/desktop capture
 * here would only duplicate what those siblings already cover. `vr.viewports`
 * scopes the capture to match (#2803).
 */
export const PlaceholderLongSubjectNarrow: Story = {
  args: {
    match: {
      ...placeholderTournament,
      id: 92,
      competition: "Beker van Vlaams-Brabant en Omstreken",
    },
  },
  parameters: {
    vr: { viewports: ["mobile"] },
  },
};

// ─── Tournament fixture (#2696) ─────────────────────────────────────────────
// A genuine fixture — not a self-match — whose structured `competitionType`
// is "tournament" (#2692). Reuses the placeholder register's shape above —
// see `TeamAgendaRow.tsx` for the full #2693/#2696 rationale (crest derived
// from the club id, "competition · club" subject, no slot word even
// featured).

// A tournament fixture with no result yet is `kind: "reduced"` (#2802) —
// the adapter (`transformMatchToSchedule`) has already resolved the crest
// to the non-KCVV side via `otherClubSide()`/club-id equality, so this
// fixture spells that resolved shape out directly rather than a `ScheduleMatch`
// the row would now render as an ordinary two-crest scoreboard (the row
// trusts `kind`, not a re-derivation of `matchRowKind` from raw fields).
const tournamentFixture: ScheduleReducedMatch = {
  kind: "reduced",
  id: 93,
  date: new Date("2026-08-30T09:30:00.000Z"),
  time: "09:30",
  team: { id: 1391, name: "FC Zemst Sportief" },
  status: "scheduled",
  competition: "Tornooi",
  competitionType: "tournament",
};

/** Plain — cream ground, one crest (the named club's, not KCVV's). */
export const Tournament: Story = {
  args: { match: tournamentFixture },
};

/** Featured "Eerstvolgende" — see `TeamAgendaRow.tsx` for why no "Volgende" prefix. */
export const TournamentFeatured: Story = {
  args: { match: tournamentFixture, featured: true },
};
