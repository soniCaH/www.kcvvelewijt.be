import type { CompetitionType } from "@kcvv/api-contract";
import type { MatchStatus } from "@/lib/effect/schemas/match.schema";
import { matchStatusWording } from "@/components/match/MatchStatusBadge";
import { KCVV_CLUB_ID } from "@/lib/constants";
import type { ScheduleRow } from "@/components/match/types";

interface HasScoreMatch {
  home_team: { score?: number };
  away_team: { score?: number };
  status: MatchStatus;
}

interface HasScoreNarrowed {
  home_team: { score: number };
  away_team: { score: number };
  status: MatchStatus;
}

/**
 * Statuses whose outcome is final: the match either ran to full time or was
 * awarded. Mirrors the BFF's own `isSettledMatchStatus`
 * (`apps/api/src/psd/transforms.ts`). Deliberately excludes `stopped` — a match
 * abandoned early may be replayed, so its partial scoreline is not a result.
 *
 * The list lives here once and everything else derives from it: the type below,
 * the predicate, `hasScore`, the homepage result slot (`first-teams.ts`), and
 * `<TeamAgendaRow>`'s outcome tint. Keeping the literal union and the runtime
 * check on one source is the point — TypeScript does not verify a hand-written
 * `x is T` body against its declared type, so two hand-maintained copies drift
 * silently.
 */
const SETTLED_STATUSES = ["finished", "forfeited"] as const;

export type SettledMatchStatus = (typeof SETTLED_STATUSES)[number];

/** Whether a match's outcome is final — see `SETTLED_STATUSES`. */
export function isSettledMatch(
  status: MatchStatus,
): status is SettledMatchStatus {
  return SETTLED_STATUSES.some((settled) => settled === status);
}

export function hasScore(
  match: HasScoreMatch,
): match is HasScoreMatch & HasScoreNarrowed {
  return (
    isSettledMatch(match.status) &&
    typeof match.home_team.score === "number" &&
    typeof match.away_team.score === "number"
  );
}

export type ScoreDisplay =
  { type: "score"; home: number; away: number } | { type: "vs" };

export function getScoreDisplay(match: HasScoreMatch): ScoreDisplay {
  if (hasScore(match)) {
    return {
      type: "score",
      home: match.home_team.score,
      away: match.away_team.score,
    };
  }
  return { type: "vs" };
}

/**
 * A settled match's result from KCVV's side. Named once here so the tint
 * (`OUTCOME_UNDERLINE`) and the word (`OUTCOME_WORD`) that decodes it are keyed
 * off the same union rather than two hand-spelled copies.
 */
export type MatchOutcome = "win" | "draw" | "loss";

export function getResultColor(
  homeScore: number,
  awayScore: number,
  isHome: boolean,
): MatchOutcome {
  if (homeScore === awayScore) return "draw";
  const homeWins = homeScore > awayScore;
  return homeWins === isHome ? "win" : "loss";
}

/**
 * Whether a match has been played (a score is meaningful). Shared by every row
 * that switches between a kickoff time and a scoreline + outcome underline
 * (`<TeamAgendaRow>`, the kalender agenda row) so the status set can't drift
 * between them.
 *
 * Wider than `isSettledMatch`: it includes `stopped`, because an abandoned
 * match's partial scoreline is still what the row should show. Which result
 * *headlines* a surface is the stricter question — use `isSettledMatch` there.
 */
export function isPlayedMatch(status: MatchStatus): boolean {
  return isSettledMatch(status) || status === "stopped";
}

/**
 * Whether a status changes what a row means and so has to be named on it.
 * `scheduled` and `finished` are the unremarkable cases the layout already
 * communicates on its own (a kickoff time / a scoreline); every other status
 * makes the row lie unless it is marked — a forfeit rendering a bare `5 – 0`,
 * an `afgelast` match rendering a kickoff nobody should turn up for (#2423).
 */
export function isExceptionalMatchStatus(status: MatchStatus): boolean {
  return status !== "scheduled" && status !== "finished";
}

/**
 * Fields `isReducedMatchRow` needs — a structural subset both `ScheduleRow`
 * members and `CalendarMatch` satisfy without a branch, mirroring
 * `ReservationSubjectInput` below.
 */
export interface ReducedRowInput {
  competitionType?: CompetitionType;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
}

/**
 * Whether a match row renders the reduced reservation register — one crest,
 * one mono subject, no link — instead of the full two-sided scoreboard.
 * True for a tournament fixture (#2696, `competitionType === "tournament"`
 * — never a string match on the Dutch `competition` label) that has no
 * result yet. The pitch-reservation case (#2606) is answered upstream by
 * `matchRowKind()` from the raw `is_placeholder` wire field, before this
 * function is ever called.
 *
 * Gated on there being a scoreline, not merely on `isPlayedMatch`: a
 * finished/forfeited/stopped tournament fixture whose scores are missing
 * from the feed must not fall back to the vs-framed, linked scoreboard with
 * a kickoff time and no score (#2696 review) — once a result exists, the
 * club really was the opponent, so the row reverts to the full scoreboard.
 *
 * The one place this question is asked — `<TeamAgendaRow>` and
 * `<CalendarMonth>`'s `captionLabel` gate each spelled it independently
 * once, and the two answers had already drifted apart by review.
 */
export function isReducedMatchRow(match: ReducedRowInput): boolean {
  if (match.competitionType !== "tournament") return false;
  const hasScoreline =
    isPlayedMatch(match.status) &&
    typeof match.homeScore === "number" &&
    typeof match.awayScore === "number";
  return !hasScoreline;
}

/** The raw `Match`/`MatchDetail` fields `matchRowKind()` needs — both share
 *  this shape via `BaseMatchFields` (`packages/api-contract/src/schemas/match.ts`). */
export interface MatchRowKindSource {
  is_placeholder?: boolean;
  competitionType?: CompetitionType;
  status: MatchStatus;
  home_team: { score?: number };
  away_team: { score?: number };
}

/**
 * The one place a raw `Match`/`MatchDetail` is asked "reservation, reduced,
 * or an ordinary match?" (#2802 review) — the three adapters
 * (`transformMatchToSchedule`, `mapMatchToUpcomingMatch`,
 * `transformMatchToCalendar`) and every other reader of a raw match
 * (`toHeroMatchData`, the article `SportsEvent` gate, `/wedstrijd`'s own
 * gates, `matchSlot`, the ICS feed) had each hand-copied the same six-field
 * `isReducedMatchRow({...})` literal — nine of eleven copies byte-identical,
 * four re-`||`ing the placeholder half back on outside the call even though
 * this function already returns `true` for one. A caller that forgot to wire
 * `homeScore`/`awayScore` (both optional on `ReducedRowInput`) type-checked
 * anyway and silently read "reduced" forever for a played tournament fixture
 * — the mechanism behind five of the fifteen findings the first review round
 * found. One function, one return type (`ScheduleRow["kind"]`, identical
 * across all three adapters' `kind`), makes a fifth hand-copy a one-line
 * diff instead of a six-field one.
 */
export function matchRowKind(match: MatchRowKindSource): ScheduleRow["kind"] {
  if (match.is_placeholder) return "reservation";
  return isReducedMatchRow({
    competitionType: match.competitionType,
    status: match.status,
    homeScore: match.home_team.score,
    awayScore: match.away_team.score,
  })
    ? "reduced"
    : "match";
}

/**
 * Inset underline that tints a finished match's scoreline by KCVV-perspective
 * outcome (win = jersey-deep, loss = alert, draw = ink-muted — all three mixed
 * toward the ground so the patch stays legible on both cream and jersey-deep
 * cards). Owned by `<TeamAgendaRow>` — the shared match row used on team
 * pages, `/kalender`, and the homepage `<FirstTeamsBlock>` (#2301) — so the
 * outcome colour can't drift between them.
 *
 * Nested by ground rather than forked into a second top-level export
 * (#2616 review): a `OUTCOME_UNDERLINE_DARK` sibling would restate the whole
 * geometry — the `inset 0 -9px 0`, the hue triple — as a second
 * hand-maintained literal, with nothing enforcing the two stay in step.
 * `OUTCOME_UNDERLINE[ground][outcome]` keeps the shape in one place; only the
 * colour the mix is pulled toward differs by ground.
 *
 * `light` is `<TeamAgendaRow>`'s own ground (including its `featured`
 * jersey-deep card — that treatment predates this split and isn't
 * reconsidered here). `dark` is `<MatchStripView>`'s match-day ground
 * (#2616): the light mix reads as a pastel highlighter *behind* ink text; on
 * `--color-jersey-deep-dark` the text itself turns cream, so the same
 * cream-mixed tint would wash out under it instead of setting it off — mixed
 * toward the ground instead, at a heavier stop so the patch still reads as a
 * distinct tint against a ground it is this close to in hue.
 *
 * The draw stop (`--color-ink-muted`, 34%/55%) was decided in #2512: it is
 * the one neutral that lands at the same strength as the win/loss mixes
 * either side of it (`#c6c3bc`, 1.54:1 against cream, measured against the
 * `#a2c9b0`/`#deb2a5` win/loss pair #2513 had already proved reads outdoors)
 * — a calculator is not the test for any of the three; #2513 settled that.
 *
 * `<CalendarAgenda>` used to carry a third, drifted, `light`-only copy of
 * this record (#2404 named the gap). #2656 deleted it — the agenda row now
 * reads this export directly, so the "outcome colour can't drift between
 * them" claim above is enforced, not aspirational.
 */
export const OUTCOME_UNDERLINE: Record<
  "light" | "dark",
  Record<MatchOutcome, string>
> = {
  light: {
    win: "inset 0 -9px 0 color-mix(in srgb, var(--color-jersey-deep) 34%, var(--color-cream))",
    draw: "inset 0 -9px 0 color-mix(in srgb, var(--color-ink-muted) 34%, var(--color-cream))",
    loss: "inset 0 -9px 0 color-mix(in srgb, var(--color-alert) 38%, var(--color-cream))",
  },
  dark: {
    win: "inset 0 -9px 0 color-mix(in srgb, var(--color-jersey-deep) 55%, var(--color-jersey-deep-dark))",
    draw: "inset 0 -9px 0 color-mix(in srgb, var(--color-ink-muted) 55%, var(--color-jersey-deep-dark))",
    loss: "inset 0 -9px 0 color-mix(in srgb, var(--color-alert) 55%, var(--color-jersey-deep-dark))",
  },
};

/**
 * The word for a settled match's outcome, KCVV-perspective, in its
 * **fixed-width caption register** — the label that names what
 * `OUTCOME_UNDERLINE` above tints, sized for a 9px mono caption in a
 * narrow column (`<MatchStripView>`'s `w-14` mobile-ledger stub;
 * `<TeamAgendaRow>`'s mobile caption, which #2512 accepted the same
 * shorter spelling for even though it isn't itself column-constrained,
 * so the shared constant doesn't fork over one consumer's width). For any
 * spot that is *not* a fixed-width caption — an `aria-label`, or any other
 * prose context — use `OUTCOME_WORD_FULL` below instead. Every surface
 * that renders the underline should be able to reach for one of the two
 * rather than inventing its own.
 *
 * Nouns, not the share card's verbs. `resolveResultMood`
 * (`components/share/shared/theme.ts`) says "Gewonnen" / "Verloren" because
 * there the word is a display headline standing on its own with no column to
 * fit — here it prefixes a 9px mono caption in a fixed-width stub (`w-14` on
 * `<MatchStripView>`'s mobile ledger). That is why `draw` reads "Gelijk"
 * here and "Gelijkspel" on the share card: the two registers were always
 * different, `Gelijkspel` was just the one word where the difference
 * happened not to show, until the mobile ledger needed the shorter spelling
 * to fit `w-14` without taking width back off the opponent name (#2656 — the
 * same trade #2388 fought and #2404 won back). Do not let the two spellings
 * re-converge; that would silently retake the width.
 *
 * The placement rule this word obeys — **the outcome word appears only
 * where nothing else in the row assigns the score** — was decided in #2512,
 * extending the mobile/desktop split `<TeamAgendaRow>` already argues (see
 * its `desktopKindWord`/`mobileKindWord` comment): two clubs printed either
 * side of a score, or a `Thuis`/`Uit` venue tag beside it, already say who
 * won, so the word there would be noise stacking into a column of one
 * repeated word down a season. It is asked for only where nothing else in
 * the row makes that claim — `<TeamAgendaRow>`'s mobile column (opponent
 * alone) and `<MatchStripView>`'s mobile ledger stub (`<StripDate>`, no
 * second club printed). `<CalendarAgenda>` is the exception that proves the
 * rule from the other direction: it prints no word at all, because its
 * `<MatchVenueTag>` already assigns the score the same way a `Thuis`/`Uit`
 * tag would.
 */
export const OUTCOME_WORD: Record<MatchOutcome, string> = {
  win: "Winst",
  draw: "Gelijk",
  loss: "Verlies",
};

/**
 * `OUTCOME_WORD`'s full-length register, for anywhere the shortened caption
 * spelling has no column to protect: an `aria-label` (`<TeamAgendaRow>`'s
 * `buildRowLabel`, `<MatchStripView>`'s `<LedgerLinkRow>` label), or any
 * other prose context. `win`/`loss` are identical to `OUTCOME_WORD` — only
 * `draw` differs, "Gelijkspel" rather than the caption's "Gelijk". Reading
 * `OUTCOME_WORD.draw` into an unconstrained accessible name would leak a
 * visual-only abbreviation into a register that never needed it — the same
 * class of mistake `OUTCOME_WORD`'s own docblock above warns against for the
 * share card, just one hop closer to home.
 */
export const OUTCOME_WORD_FULL: Record<MatchOutcome, string> = {
  win: "Winst",
  draw: "Gelijkspel",
  loss: "Verlies",
};

/**
 * The word for the slot a match row is filling, used when no outcome word
 * applies — see `MatchRowKind` below for why the slot is given, not derived.
 *
 * `result` is the fallback rather than the norm: a settled match uses
 * `OUTCOME_WORD` above, which says strictly more. See `<TeamAgendaRow>`'s
 * `kind` prop for the full resolution order.
 */
export const MATCH_KIND_WORD = {
  result: "Uitslag",
  fixture: "Volgende",
} as const;

/**
 * The word for a fixture that falls on today's calendar day (#2616) —
 * `<MatchStripView>`'s match-day relabel, replacing `MATCH_KIND_WORD.fixture`
 * outright rather than sitting alongside it. Named here rather than
 * hand-spelled at each render site: it had already drifted to a second,
 * lowercase copy inside a single component (the mobile row's `aria-label`)
 * before this constant existed, and a fifth copy already lives in
 * `apps/web/src/components/share/SquarePreGameTemplate/SquarePreGameTemplate.tsx`
 * (not touched here — out of scope for #2616, but reachable from this
 * constant going forward). Lowercase forms (e.g. an `aria-label`'s sentence
 * position) derive from this via `.toLowerCase()` rather than a second
 * exported literal, mirroring how `HOME_AWAY_A11Y_NAME` below is its own
 * word rather than a case transform — this one *is* a pure case transform,
 * so it doesn't need a second constant to say so.
 */
export const MATCH_DAY_WORD = "Vandaag";

/**
 * Which slot a match row is filling — the *surface's* answer, not the match's.
 *
 * These cannot be derived from `status`, and a row that tries gets it wrong:
 * `pickLastResult` (`first-teams.ts`) deliberately hands the result slot a match
 * whose kickoff has passed while PSD still says `scheduled`, so status-derivation
 * labels the homepage's result column "Volgende" — the same word as the fixture
 * card beside it (#2404). The column knows; the row has to be told.
 */
export type MatchRowKind = keyof typeof MATCH_KIND_WORD;

/**
 * The one home/away vocabulary (#2398 AC4). Four surfaces state this same fact
 * and had four hand-maintained copies of the wording: `<UpcomingMatchesClient>`'s
 * badge, `<TeamAgendaRow>`'s glyph, `<MatchStripView>`'s `<VenueGlyph>` (whose
 * comment already claimed to reuse the row's vocabulary while copying it), and
 * `<MatchVenueTag>` on `/kalender`.
 *
 * Only the *words* live here — `House`/`Bus` cannot, because `@/lib/icons.redesign`
 * is a `"use client"` module and this file is imported by server code
 * (`first-teams.ts`). Each surface keeps its own chrome and picks the register it
 * has room for; the short form is for surfaces that also show the glyph, the
 * long form for glyph-only surfaces where it is the accessible name.
 *
 * Colour is deliberately NOT unified here, and #2404 confirmed it should not be:
 * `/kalender`'s `card-red` is the locked colour of the *Wedstrijden* category
 * (6d1/#1992), not of "thuis", so moving it would break a different system than
 * the one it appears to belong to. What #2404 did unify is the grammar — filled
 * = thuis, outlined = uit on both surfaces. See `<HomeAwayBadge>` in
 * `<UpcomingMatchesClient>`.
 */
export const HOME_AWAY_WORD = {
  home: "Thuis",
  away: "Uit",
} as const;

/** Accessible name for a glyph-only home/away marker — see `HOME_AWAY_WORD`. */
export const HOME_AWAY_A11Y_NAME = {
  home: "Thuiswedstrijd",
  away: "Uitwedstrijd",
} as const;

/**
 * `reservationView()`'s subject when a pitch-reservation fixture (#2606)
 * carries no competition label at all — not observed in production (every
 * one of the census's 17 rows carries a `TOURNAMENT`/`FRIENDLY` type), but
 * the row still needs a non-empty subject for the defensive case. Not
 * exported: `reservationView()` is the one reader, so the literal only needs
 * to be named once, here.
 */
const RESERVATION_SUBJECT_FALLBACK = "Gereserveerd";

/** The fields `reservationView()` needs — deliberately narrower than the full
 * `ScheduleReservation`/`MatchDetail` shapes so both can pass through it. */
export interface ReservationSubjectInput {
  status: MatchStatus;
  competition?: string;
}

export interface ReservationView {
  /**
   * The competition label, or the reservation fallback word when absent —
   * with the `otherClub` name appended ("TORNOOI · FC ZEMST SPORTIEF") when
   * one is given (#2696).
   */
  subject: string;
  /**
   * The exceptional-status marker (FF/AFG/CANC/STOP), or `null` for
   * `scheduled`/`finished` — see `isExceptionalMatchStatus`. A reservation can
   * be called off the same way a real fixture can (#2606), so this is not
   * dropped just because the row has no opponent to report a result against.
   */
  statusWording: { abbreviation: string; longForm: string } | null;
  /**
   * The uppercase kicker word `<MatchHero>`'s reduced hero uses in place of
   * `getKicker(status)`'s VOORBESCHOUWING/MATCHVERSLAG — a reservation is
   * never a preview or a report of a match, so it gets its own fixed word,
   * derived from the same fallback the subject falls back to rather than a
   * second hand-spelled literal.
   */
  kicker: string;
}

/**
 * The one place a pitch-reservation placeholder's subject/status derivation
 * lives (#2688) — pairs with `OUTCOME_UNDERLINE`/`MATCH_KIND_WORD` above for
 * the same reason: `<TeamAgendaRow>` (#2606) worked this logic out first and
 * inlined it; every renderer built after it (`<MatchStripView>`,
 * `/wedstrijd/[matchId]`) should call this instead of re-deriving the same
 * two rules a third and fourth time.
 *
 * `otherClub` is the tournament case's addition (#2696): a placeholder's
 * subject is the competition alone, a tournament fixture's is the
 * competition THEN the named club — the club is presented as where the
 * tournament is, never as an opponent, because PSD does not say whether it
 * hosts or merely shares the bracket. `reservationView` stays the one place
 * that composes either subject, rather than the join living a third time in
 * a component.
 */
export function reservationView(
  match: ReservationSubjectInput,
  otherClub?: { name: string },
): ReservationView {
  const competition = match.competition || RESERVATION_SUBJECT_FALLBACK;
  return {
    subject: otherClub
      ? [competition, otherClub.name].filter(Boolean).join(" · ")
      : competition,
    statusWording: isExceptionalMatchStatus(match.status)
      ? matchStatusWording(match.status)
      : null,
    kicker: RESERVATION_SUBJECT_FALLBACK.toUpperCase(),
  };
}

/**
 * The club that is not KCVV — derived from the club id, never home/away
 * (#2696: `isHome` answers "which side did PSD list as home", not "is this
 * club confirmed", which is not a question a tournament fixture can answer).
 * Deliberately not unified with this codebase's other "which side is the
 * opponent" tie-breaks — `MatchStripView`'s `opponentOf` uses
 * `isHome ?? id === KCVV_CLUB_ID`, `nieuws/[slug]/utils.ts` has a third —
 * those answer a different question for their own surface, on purpose.
 *
 * Takes the two sides positionally (#2802 review) rather than a
 * `{ homeTeam, awayTeam }` object, so the same one definition serves both
 * camelCase view-models (`otherClubSide(match.homeTeam, match.awayTeam)`)
 * and the raw snake_case `Match` (`otherClubSide(match.home_team,
 * match.away_team)`) — the reshape a caller with the "wrong" casing needed
 * was one destructure, not a second hand-copied function. Four independent
 * copies of this exact three-line ternary existed before this review
 * (`transform.ts`, `match.mapper.ts`, `kalender/utils.ts`, `MatchHero.tsx`)
 * — peer-drift risk this repo's own CLAUDE.md names as its most-flagged
 * review class, since a rule change (e.g. a second club id after a merger)
 * would silently miss whichever copies nobody remembered to update.
 */
export function otherClubSide<Team extends { id: number }>(
  home: Team,
  away: Team,
): Team {
  return home.id === KCVV_CLUB_ID ? away : home;
}

/** The fields `reservationTitle()` needs, on top of `matchRowKind()`'s own. */
export interface ReservationTitleInput extends MatchRowKindSource {
  competition?: string;
  home_team: MatchRowKindSource["home_team"] & { id: number; name: string };
  away_team: MatchRowKindSource["away_team"] & { id: number; name: string };
}

/**
 * A pitch-reservation placeholder's or a hidden-result tournament fixture's
 * title/summary: `reservationView()`'s subject plus the KCVV side's own
 * name, the shape both `formatMatchTitle()` (`/wedstrijd/[matchId]/utils.ts`,
 * the match detail page's SEO title) and `buildSummary()` (`lib/utils/ical.ts`,
 * the ICS feed) need. Shared here rather than hand-spelled twice so the
 * separator between the two halves can't diverge silently between the two
 * surfaces (#2698), and widened to the reduced branch (#2696/#2802 review)
 * so that promise holds for a tournament fixture too — both surfaces used to
 * hand-copy an identical three-line "otherClubSide → subject → join" branch
 * for it.
 *
 * A genuine reservation passes no `otherClub` to `reservationView()` (both
 * sides are the same club, so there is no other club to name); a reduced
 * tournament fixture does, naming the real opponent.
 */
export function reservationTitle(match: ReservationTitleInput): string {
  const kind = matchRowKind(match);
  const otherClub =
    kind === "reduced"
      ? otherClubSide(match.home_team, match.away_team)
      : undefined;
  const kcvvTeam =
    otherClub && otherClub === match.home_team
      ? match.away_team
      : match.home_team;
  return `${reservationView(match, otherClub).subject} — ${kcvvTeam.name}`;
}

/**
 * The accessible-name sentence for a reservation row — the one grammar three
 * renderers (`<MatchStripView>`, `<UpcomingMatchesClient>`, `<TeamAgendaRow>`)
 * each hand-built independently, each with its own copy of the "only
 * announce the time when the match is still `scheduled`" rule. `subject` is
 * whatever the caller composed (e.g. `reservationView(match).subject` alone,
 * or a squad label folded in ahead of it) — this function only owns the
 * sentence shape, not the vocabulary inside it. `kind`'s word is dropped
 * when `statusWording` is present, so the sentence never argues with itself
 * ("Volgende · AFG").
 *
 * The markup rule that pairs with this sentence: every reservation row is an
 * `<article aria-label={label}>`, never a `<div>` — a `<div>`'s implicit
 * `role=generic` does not support an accessible name from `aria-label` at
 * all (it is prohibited and silently ignored), so a `<div>` here renders
 * with no accessible content whatsoever.
 */
export function reservationRowLabel({
  kind,
  subject,
  dateLabel,
  time,
  status,
  statusWording,
}: {
  kind?: MatchRowKind;
  subject: string;
  dateLabel: string;
  time?: string;
  status: MatchStatus;
  statusWording: { abbreviation: string; longForm: string } | null;
}): string {
  // Only the fixture word. A reservation is a booking with no score, so it
  // never carries result vocabulary — "Uitslag: Tornooi" is a contradiction,
  // and this label is the row's sole accessible content (#2688).
  const kindWord =
    !statusWording && kind === "fixture" ? MATCH_KIND_WORD.fixture : null;
  return [
    kindWord ? `${kindWord}: ` : "",
    subject,
    `, ${dateLabel}`,
    status === "scheduled" && time ? ` om ${time}` : "",
    statusWording ? ` — ${statusWording.longForm}` : "",
  ].join("");
}
