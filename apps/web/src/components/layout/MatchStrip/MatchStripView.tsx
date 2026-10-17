import Link from "next/link";
import { MatchTravelLink } from "@/components/match/MatchTravelLink";
import { LinkPendingDots } from "@/components/design-system/LinkPendingDots";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { getButtonClasses } from "@/components/design-system/Button";
import { House, Bus } from "@/lib/icons.redesign";
import {
  HOME_AWAY_A11Y_NAME,
  isResultPending,
  isSettledMatch,
  MATCH_DAY_WORD,
  MATCH_KIND_WORD,
  OUTCOME_UNDERLINE,
  OUTCOME_WORD,
  OUTCOME_WORD_FULL,
  reservationRowLabel,
  reservationView,
  RESULT_PENDING_GLYPH,
  RESULT_PENDING_WORD,
  type MatchRowKind,
} from "@/lib/utils/match-display";
import { KCVV_CLUB_ID } from "@/lib/constants";
import type { MatchStripData } from "@/lib/server/match-data";
import { MatchStripSlider, type MatchStripSlide } from "./MatchStripSlider";
import type { StripDates } from "./strip-dates";
import type {
  ScheduleMatch,
  ScheduleReducedMatch,
  ScheduleReservation,
  ScheduleRow,
  ScheduleTeam,
} from "@/components/match/types";

const KCVV_LOGO_URL = "/images/logos/kcvv-logo.png";

export interface MatchStripViewProps {
  data: MatchStripData;
  /**
   * Whether the next fixture falls on today's calendar day (#2616) — computed
   * once, server-side, by `<MatchStrip>` and passed down as a plain boolean
   * rather than recomputed here. The view's one client leaf
   * (`<MatchStripSlider>`) hydrates in the visitor's own browser; had the
   * strip called `isMatchDay()`/`clubToday()` itself, the server and browser
   * passes could disagree across a midnight boundary the same way `dates.ts`
   * documents for an unpinned date parse. Baking the boolean into the prop
   * sidesteps that entirely — see `<MatchStrip>`'s own docblock.
   *
   * Only ever `true` for a genuine `ScheduleMatch` fixture, never a
   * pitch-reservation placeholder (#2606) — `<MatchStrip>` enforces that; this
   * component trusts the prop rather than re-deriving it (`match-data.ts`:
   * "Guarded there, not re-checked here — one owner for the rule"); only the
   * *fixture* row/slide is relabelled "Vandaag" even so, since a reservation
   * row never reaches the "today" branch below regardless
   * (`ReservationLedgerRow` / `ReservationDesktopSlide` have no such branch
   * at all).
   *
   * This is a dark-ground **variant** of both layouts, not a background swap
   * on the `<aside>` alone — every descendant that assumed a cream ground
   * (ink text, ink-muted captions, the `primary` button) gets a paired
   * dark-ground counterpart, threaded down as `dark`/`today` props rather
   * than recomputed per element.
   */
  matchDay?: boolean;
  /**
   * Every date the strip prints, already formatted (#3480) — by `<MatchStrip>`
   * on the server, through `toMatchDisplayZone`. This file imports no date
   * library, so neither it nor the browser ever loads Luxon. Both keys are
   * always present; the one for an absent row is never read.
   */
  dates: { result: StripDates; fixture: StripDates };
}

/**
 * The landing-page strip: the first team's last result and next fixture.
 *
 * Two layouts, one component (#2387):
 *
 * - **Mobile** — both matches as linked ledger rows, visible at once. The row
 *   itself is the `<Link>`, the same contract `<TeamAgendaRow>` uses, so it is
 *   one touch target with no nested interactives and the trailing chevron is a
 *   visible affordance rather than a hover-only reveal.
 * - **Desktop** — one match at a time behind a two-slide switch, defaulting to
 *   the result (or to the fixture on match day, see `<DesktopSlider>`), with
 *   the `Wedstrijddetails` CTA. Deliberately not a carousel: two slides, no
 *   auto-advance, no swipe-only path.
 *
 * Scores render in true scoreboard order (home team first). Home/away is drawn
 * only on mobile, where the row shows the opponent alone — on desktop both
 * teams appear in order, so a venue glyph would restate the layout.
 */
export function MatchStripView({
  data,
  matchDay = false,
  dates,
}: MatchStripViewProps) {
  const { result, fixture } = data;

  return (
    <aside
      aria-label="Laatste uitslag en volgende wedstrijd"
      className={cn(
        "border-t border-b",
        // border-b: the same /15 hairline `<LedgerLinkRow>`/`<DesktopSlider>`
        // use internally (#2616 review) — previously /10 here, one of three
        // divergent dark-ground alphas with nothing recording whether the
        // difference was a decision. border-t keeps its own accent value:
        // the light ground's green top rule has no direct dark analogue once
        // the whole band already IS green.
        matchDay
          ? "bg-jersey-deep-dark border-t-cream/25 border-b-cream/15"
          : "bg-cream border-t-jersey-deep/35 border-b-ink/15",
      )}
    >
      <div className="lg:hidden">
        {result ? (
          <LedgerLinkRow
            match={result}
            kind="result"
            last={!fixture}
            matchDay={matchDay}
            dates={dates.result}
          />
        ) : null}
        {fixture ? (
          <LedgerLinkRow
            match={fixture}
            kind="fixture"
            last
            matchDay={matchDay}
            dates={dates.fixture}
          />
        ) : null}
      </div>
      <DesktopSlider
        result={result}
        fixture={fixture}
        matchDay={matchDay}
        dates={dates}
      />
    </aside>
  );
}

/* ── shared derivations ──────────────────────────────────────────────────── */

/**
 * Whether KCVV played at home. `is_home` is not guaranteed by the upstream, so
 * fall back to the club id rather than letting `undefined` take the falsy
 * branch and render KCVV as its own opponent.
 */
function isKcvvHome(match: ScheduleMatch): boolean {
  return match.isHome ?? match.homeTeam.id === KCVV_CLUB_ID;
}

function opponentOf(match: ScheduleMatch): ScheduleTeam {
  return isKcvvHome(match) ? match.awayTeam : match.homeTeam;
}

function outcomeOf(match: ScheduleMatch): "win" | "draw" | "loss" | null {
  const { homeScore, awayScore } = match;
  if (homeScore === undefined || awayScore === undefined) return null;
  const home = isKcvvHome(match);
  const kcvv = home ? homeScore : awayScore;
  const other = home ? awayScore : homeScore;
  if (kcvv > other) return "win";
  if (kcvv < other) return "loss";
  return "draw";
}

function scoreboardScore(match: ScheduleMatch): string | null {
  const { homeScore, awayScore } = match;
  if (homeScore === undefined || awayScore === undefined) return null;
  return `${homeScore}–${awayScore}`;
}

/**
 * Whether this row/slide is showing the match-day fixture (#2616) — the one
 * definition `<LedgerLinkRow>` and `<DesktopSlider>` both call, replacing two
 * formulas that had already drifted (each carried its own comment explaining
 * why it differed from the other — the same drift `matchRowKind`'s
 * docblock in `match-display.ts` records for a different pair of call
 * sites). `kind === "fixture"` is enough on its own: `<MatchStrip>` is the
 * single place that ever sets `matchDay` true, and it only does so when
 * `fixture.kind === "match"` (#2802 review — a boolean placeholder check
 * alone would also pass a reduced tournament fixture) — re-checking here
 * would be the same re-derivation the "one owner for the rule" convention
 * forbids.
 */
function isTodayFixture(matchDay: boolean, kind: MatchRowKind): boolean {
  return matchDay && kind === "fixture";
}

/**
 * `isResultPending` (#2587), plus the strip's own guard that a scoreline the
 * feed did send is never hidden behind the waiting glyph.
 */
function isAwaitingResult(match: ScheduleMatch, kind: MatchRowKind): boolean {
  return isResultPending(kind, match.status) && scoreboardScore(match) === null;
}

/* ── atoms ───────────────────────────────────────────────────────────────── */

function Crest({
  team,
  big = false,
  dark = false,
}: {
  team: ScheduleTeam;
  big?: boolean;
  /** The match-day ground (#2616) — recolours the initial-fallback badge only; a real logo image needs no change. */
  dark?: boolean;
}) {
  const size = big ? "h-9 w-9" : "h-7 w-7";
  const sizePx = big ? 36 : 28;
  // The upstream does not always carry a logo for KCVV's own side; fall back to
  // the local asset before the initial badge, so the club crest is never an "E".
  const src =
    team.logo ?? (team.id === KCVV_CLUB_ID ? KCVV_LOGO_URL : undefined);
  if (src) {
    return (
      // `unoptimized`, matching `<Crest>` in design-system (#2006): the
      // Vercel image optimizer is metered per source image and saves
      // negligible bytes on crests this small across a full division of
      // remote PSD-hosted logos — the remote host is already covered by
      // `next.config.ts` `remotePatterns` (#2401 item 5 triage).
      <Image
        src={src}
        alt=""
        width={sizePx}
        height={sizePx}
        unoptimized
        className={cn(size, "shrink-0 object-contain")}
        loading="lazy"
      />
    );
  }
  const initial =
    team.name.trim().split(/\s+/).at(-1)?.[0]?.toUpperCase() ?? "?";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-display text-mono-sm inline-flex shrink-0 items-center justify-center border font-black italic",
        size,
        dark
          ? "border-cream/40 bg-cream/10 text-cream"
          : "border-ink/40 bg-cream-soft text-ink",
      )}
    >
      {initial}
    </span>
  );
}

/**
 * Reuses `<TeamAgendaRow>`'s venue glyph — one home/away vocabulary, not two.
 * The wording now comes from `HOME_AWAY_A11Y_NAME` rather than a copy, so that
 * claim is enforced instead of aspirational (#2398).
 */
function VenueGlyph({ home, dark = false }: { home: boolean; dark?: boolean }) {
  const Icon = home ? House : Bus;
  return (
    <Icon
      aria-label={home ? HOME_AWAY_A11Y_NAME.home : HOME_AWAY_A11Y_NAME.away}
      className={cn(
        "h-4 w-4 shrink-0",
        dark ? "text-cream-quiet" : "text-ink-muted",
      )}
    />
  );
}

/**
 * The canonical outcome marker: a highlighter sweep behind the score, one
 * tint per outcome — win, draw and loss each get their own hue (#2512/#2656
 * gave the draw its own ink-muted band; it used to render nothing at all).
 * Never a rule underneath it.
 *
 * The result side, since #2390, also carries a match that has kicked off
 * while PSD still owes the score. That row (`awaitingResult`, #2587) renders
 * `RESULT_PENDING_GLYPH` — it used to print the kickoff time, a meaningless
 * number in the slot a score would occupy, captioned `Uitslag`. Returning
 * `null` instead would leave the desktop slide, which defaults to the result,
 * with an empty gap between the two crests for the hours after every kickoff.
 * The glyph is `aria-hidden` with the phrase beside it for assistive tech: the
 * desktop slide has no `aria-label` to carry it, unlike the mobile row.
 *
 * Otherwise a missing scoreline falls back to the kickoff time — today's
 * fixture on the match-day ground (#2616), or a result row with an exceptional
 * status or a `finished` match PSD closed without a score. `vs.` is the last resort for a feed that carries neither score nor
 * time; it never stands in for the waiting state, where it would read
 * future-tense for a match already played.
 */
function Score({
  match,
  className,
  dark = false,
  awaitingResult = false,
}: {
  match: ScheduleMatch;
  className?: string;
  /** The match-day ground (#2616) — cream text, and `OUTCOME_UNDERLINE.dark`'s outcome tint. */
  dark?: boolean;
  /** See `isAwaitingResult` — the caller knows the slot, `Score` does not. */
  awaitingResult?: boolean;
}) {
  const score = scoreboardScore(match);
  const colorClass = dark ? "text-cream" : "text-ink";
  if (awaitingResult) {
    return (
      <span className={cn(colorClass, "font-mono font-bold", className)}>
        <span aria-hidden="true">{RESULT_PENDING_GLYPH}</span>
        <span className="sr-only">{RESULT_PENDING_WORD}</span>
      </span>
    );
  }
  if (score === null) {
    return (
      <span className={cn(colorClass, "font-mono font-bold", className)}>
        {match.time ?? "vs."}
      </span>
    );
  }
  const outcome = outcomeOf(match);
  const shadow = outcome
    ? OUTCOME_UNDERLINE[dark ? "dark" : "light"][outcome]
    : undefined;
  return (
    <span
      className={cn(colorClass, "font-mono font-bold", className)}
      style={shadow ? { boxShadow: shadow, padding: "0 8px" } : undefined}
    >
      {score}
    </span>
  );
}

/**
 * Unboxed on purpose: a bordered date stub next to the bordered crest reads as
 * two competing squares. `<TeamAgendaRow>` can afford the box because it sits
 * inside a ticket-stub card; the strip is a flat band.
 *
 * Two lines since #2404: the date, then which kind of row this is. #2388 had
 * dropped those words because inline they cost 72px — most of what squeezed the
 * opponent name — and left the two rows told apart only by their order and by
 * score-versus-time. Stacked under the date they cost 8px of width (`w-12` →
 * `w-14`, the widest word being "Volgende") and one 9px line of height, which
 * is the trade #2388's own note proposed.
 */
function StripDate({
  day,
  month,
  kind,
  today = false,
  dark = false,
  outcomeWord = null,
}: {
  /** The pre-formatted day-of-month and abbreviated month (#3480). */
  day: string;
  month: string;
  kind: MatchRowKind;
  /**
   * The match-day relabel (#2616) — replaces the day/month + kind-word stack
   * with `MATCH_DAY_WORD` outright rather than recolouring it in place.
   * Restating "Volgende" underneath "Vandaag" would argue with itself: the
   * word already says this is the next match, and the point of the whole
   * feature is that a reader no longer has to compare a date against the
   * calendar in their head. Only ever passed for the fixture row — see
   * `<MatchStripView>`'s `matchDay` docblock for why a reservation row can
   * never reach this branch.
   */
  today?: boolean;
  dark?: boolean;
  /**
   * The settled result's outcome word (#2512/#2656) — takes over the third
   * line from `MATCH_KIND_WORD[kind]` when the row's match is settled. This
   * mobile ledger row shows the opponent alone (no second club, no venue
   * tag), so per the placement rule at `OUTCOME_WORD`'s docblock it is one
   * of the two surfaces that must name the outcome rather than stay quiet.
   * `null` for the fixture row, which is never settled, and on the
   * match-day ground — #2512 didn't ask for the dark ledger to change, so
   * `dark` keeps reading the plain `MATCH_KIND_WORD[kind]` it always did.
   */
  outcomeWord?: string | null;
}) {
  // One span carrying the box classes and the ground colour, with only the
  // CHILDREN branching on `today` — `today` and `dark` are independent props,
  // and an earlier version's `today` branch hardcoded `text-cream`, ignoring
  // `dark` entirely (silently cream-on-cream had either prop disagreed,
  // #2616 review). `day`/`month` are formatted unconditionally upstream: a
  // second early return is exactly the branch that drifted once.
  return (
    <span
      className={cn(
        // Day-of-month tag (#2516 rule 4) — already mono; #2579 drops
        // `tabular-nums`, which did nothing (the kit ships no `tnum`
        // feature) and mono aligns by construction anyway.
        "text-mono-sm w-14 shrink-0 font-mono font-bold whitespace-nowrap",
        dark ? "text-cream" : "text-ink",
        today && "uppercase",
      )}
    >
      {today ? (
        MATCH_DAY_WORD
      ) : (
        <>
          {day}{" "}
          <span
            className={cn(
              "font-medium uppercase",
              dark ? "text-cream-quiet" : "text-ink-muted",
            )}
          >
            {month}
          </span>
          {/* ink, not jersey-deep (#2656): this line now carries a settled
              match's outcome word as often as it carries the plain slot word,
              and "Verlies" in the club's own green read as a celebration —
              see `<TeamAgendaRow>`'s same ink choice for its mono caption.
              On the match-day ground (#2616) this stays a cream alpha — the
              same "slide label" treatment the desktop switch's kind word
              gets, since this caption is that same word in the mobile layout. */}
          <span
            className={cn(
              "block text-[9px] leading-tight tracking-[0.06em] uppercase",
              dark ? "text-cream-quiet" : "text-ink",
            )}
          >
            {outcomeWord ?? MATCH_KIND_WORD[kind]}
          </span>
        </>
      )}
    </span>
  );
}

/* ── mobile ──────────────────────────────────────────────────────────────── */

function LedgerLinkRow({
  match,
  kind,
  last = false,
  matchDay = false,
  dates,
}: {
  match: ScheduleRow;
  kind: MatchRowKind;
  last?: boolean;
  /** The strip's match-day ground (#2616) — see `<MatchStripView>`'s own docblock. */
  matchDay?: boolean;
  dates: StripDates;
}) {
  // Enumerated positively (#2802 review) — a negated
  // `kind !== "match"` catch-all would silently route any future fourth
  // `kind` into the reduced row too, with no compile error.
  if (match.kind === "reservation" || match.kind === "reduced") {
    return (
      <ReservationLedgerRow
        match={match}
        kind={kind}
        last={last}
        dates={dates}
      />
    );
  }
  const today = isTodayFixture(matchDay, kind);
  const home = isKcvvHome(match);
  const opponent = opponentOf(match);
  const dateLabel = today ? MATCH_DAY_WORD.toLowerCase() : dates.widget;

  // The outcome word (#2512/#2656) — `null` for the fixture row
  // (`kind === "fixture"` is never settled) and on the match-day ground:
  // #2512 asked for the light-ground ledger to name a settled result, not
  // for the dark match-day ledger to change, so that ground keeps the
  // plain slot word it already had.
  //
  // Two spellings, the same split `<TeamAgendaRow>` makes (#2656 review):
  // `OUTCOME_WORD` ("Gelijk") is the fixed-width caption register, read
  // into `<StripDate>`'s `w-14` stub below; `OUTCOME_WORD_FULL`
  // ("Gelijkspel") has no column to protect and feeds the `aria-label`
  // instead. `win`/`loss` are identical between the two, so `leadWord*`
  // only actually diverges on a draw.
  const outcome = isSettledMatch(match.status) ? outcomeOf(match) : null;
  const outcomeWordVisual = !matchDay && outcome ? OUTCOME_WORD[outcome] : null;
  const outcomeWordA11y =
    !matchDay && outcome ? OUTCOME_WORD_FULL[outcome] : null;
  // `leadWordA11y` (below) and `<StripDate>`'s own `outcomeWord ??
  // MATCH_KIND_WORD[kind]` fallback (eight lines below) are the two single
  // sources — one per register — this label and the visible stub each read,
  // so neither can drift into an independently-gated copy the way #2404
  // already had to fix once for the plain slot word.
  // A result still owed (#2587) says so in the accessible name; the visible
  // stub stays on `Uitslag` — its `w-14` is sized to "Volgende", and widening
  // it comes straight off the opponent name (#2397).
  const awaitingResult = isAwaitingResult(match, kind);
  const leadWordA11y =
    outcomeWordA11y ??
    (awaitingResult ? RESULT_PENDING_WORD : MATCH_KIND_WORD[kind]);

  // The match-day ground's decided tokens (#2616 review) — one named pair per
  // concern, mirroring `<TeamAgendaRow>`'s `monoClass`/`stubBorder` for its
  // own light/dark (`featured`) split, hoisted once rather than re-typed at
  // each of this row's elements. `muted`'s alpha (`/70`) and `hairline`'s
  // (`/15`) are picked to match the light ground's single, un-forked values
  // (`text-ink-muted`, `border-ink/15`) numerically — previously three
  // different alphas across the file with nothing recording whether the
  // difference was a decision or a typo.
  const text = matchDay ? "text-cream" : "text-ink";
  const muted = matchDay ? "text-cream-quiet" : "text-ink-muted";
  const hairline = matchDay ? "border-cream/15" : "border-ink/15";

  // The `aria-label` replaces the row's contents as its accessible name, so the
  // score has to be spelled out here or a screen-reader user never hears it.
  // Stated KCVV-first and side-by-side with each name, since "3-1" alone does
  // not say whose goals are whose when KCVV played away.
  const { homeScore, awayScore } = match;
  const scored =
    homeScore !== undefined && awayScore !== undefined
      ? home
        ? `${homeScore} - ${opponent.name} ${awayScore}`
        : `${awayScore} - ${opponent.name} ${homeScore}`
      : null;
  // `leadWordA11y` — see its declaration above for why this reads the full
  // register rather than `leadWordVisual`.
  const label =
    kind === "result"
      ? scored
        ? `${leadWordA11y} ${dateLabel}: KCVV Elewijt ${scored}`
        : `${leadWordA11y} ${dateLabel}: KCVV Elewijt tegen ${opponent.name}`
      : `${leadWordA11y} wedstrijd ${dateLabel}${match.time ? ` om ${match.time}` : ""}: KCVV Elewijt tegen ${opponent.name}`;

  return (
    <MatchTravelLink
      matchId={match.id}
      aria-label={label}
      className={cn(
        "relative flex min-w-0 items-center gap-2.5 px-4 py-2.5 no-underline",
        // The inset ring takes its colour from the ground (globals.css):
        // warm on the match-day jersey-deep-dark strip, jersey-deep on cream.
        "focus-ring-inset",
        matchDay ? "hover:bg-cream/10" : "hover:bg-cream-soft",
        !last && "border-b",
        !last && hairline,
      )}
    >
      <StripDate
        day={dates.day}
        month={dates.month}
        kind={kind}
        today={today}
        dark={matchDay}
        outcomeWord={outcomeWordVisual}
      />
      <Crest team={opponent} dark={matchDay} />
      <span
        className={cn(
          "font-display min-w-0 flex-1 truncate leading-none font-bold italic",
          text,
        )}
      >
        {opponent.name}
      </span>
      <VenueGlyph home={home} dark={matchDay} />
      <span className="shrink-0">
        {kind === "result" ? (
          <Score
            match={match}
            className="text-mono-md"
            dark={matchDay}
            awaitingResult={awaitingResult}
          />
        ) : match.time ? (
          <span
            className={cn(
              "text-mono-sm font-mono font-semibold whitespace-nowrap",
              text,
            )}
          >
            {match.time}
          </span>
        ) : null}
      </span>
      <span aria-hidden="true" className={cn("shrink-0 font-mono", muted)}>
        →
      </span>
      <LinkPendingDots
        tone={matchDay ? "light" : "default"}
        placement="corner"
        className="top-1 right-1"
      />
    </MatchTravelLink>
  );
}

/**
 * The mobile ledger's reduced row for a pitch-reservation placeholder
 * (#2606) or a tournament fixture with a hidden result (#2696/#2802).
 * Mirrors `<TeamAgendaRow>`'s prior-art treatment — one crest (the club's
 * own for a reservation, the other club for a tournament fixture — never a
 * second, opposing crest), the competition subject via `reservationView()`,
 * and the real kickoff time — but no `<Link>`: #2606 decision 5 ruled a
 * reservation out as a navigation target, and that holds here even though
 * `/wedstrijd/[matchId]` now renders a reduced page for one (#2688) — there
 * is still nothing worth clicking through to from a widget that has no room
 * to explain what a reservation is.
 */
function ReservationLedgerRow({
  match,
  kind,
  last = false,
  dates,
}: {
  match: ScheduleReservation | ScheduleReducedMatch;
  kind: MatchRowKind;
  last?: boolean;
  dates: StripDates;
}) {
  const otherClub = match.kind === "reduced" ? match.team : undefined;
  const { subject, statusWording } = reservationView(match, otherClub);
  const label = reservationRowLabel({
    kind,
    subject,
    dateLabel: dates.widget,
    time: match.time,
    status: match.status,
    statusWording,
  });

  return (
    // `<article>`, not a `<div>` — see the markup rule on
    // `reservationRowLabel` in `match-display.ts`.
    <article
      aria-label={label}
      data-row-kind={match.kind}
      className={cn(
        "flex min-w-0 items-center gap-2.5 px-4 py-2.5",
        last ? "" : "border-ink/15 border-b",
      )}
    >
      {/* `aria-hidden`: the wrapper's `aria-label` above is this row's sole
          accessible content — see the same pattern and rationale on
          `<TeamAgendaRow>`'s placeholder branch. */}
      <div aria-hidden="true" className="contents">
        <StripDate day={dates.day} month={dates.month} kind={kind} />
        <Crest team={match.team} />
        <span className="text-ink-muted min-w-0 flex-1 truncate font-mono text-[11px] font-semibold tracking-wide uppercase">
          {subject}
        </span>
        {match.time ? (
          <span className="text-ink text-mono-sm shrink-0 font-mono font-semibold">
            {match.time}
          </span>
        ) : null}
      </div>
    </article>
  );
}

/* ── desktop ─────────────────────────────────────────────────────────────── */

/**
 * Builds both desktop slides on the server and hands them to the one client
 * leaf, `<MatchStripSlider>`, which only owns the result/fixture switch
 * (#3480).
 */
function DesktopSlider({
  result,
  fixture,
  matchDay = false,
  dates,
}: {
  result: ScheduleRow | null;
  fixture: ScheduleRow | null;
  /** The strip's match-day ground (#2616) — see `<MatchStripView>`'s own docblock. */
  matchDay?: boolean;
  dates: { result: StripDates; fixture: StripDates };
}) {
  return (
    <MatchStripSlider
      result={
        result ? buildSlide(result, "result", matchDay, dates.result) : null
      }
      fixture={
        fixture ? buildSlide(fixture, "fixture", matchDay, dates.fixture) : null
      }
      matchDay={matchDay}
    />
  );
}

function buildSlide(
  showing: ScheduleRow,
  kind: MatchRowKind,
  matchDay: boolean,
  dates: StripDates,
): MatchStripSlide {
  const isResultSlide = kind === "result";
  const today = isTodayFixture(matchDay, kind);

  // The match-day ground's decided tokens (#2616 review) — see
  // `<LedgerLinkRow>`'s identical hoist for the alpha choices' rationale.
  // `<DesktopTeamName>`/`<Crest>`/`<Score>` each own their own light/dark
  // text colour internally (their own `dark` prop), so this function only
  // needs the one token nothing else already owns.
  const metaTone = matchDay ? "text-warm" : "text-ink";

  // `<MonoLabel>` sets its own text colour from `tone` on its own inner span
  // — a colour class on a *wrapper* around it never applies, on either
  // ground (#2616 review). The light ground was therefore silently
  // rendering `text-ink` (MonoLabel's own default), not the `text-ink-muted`
  // the old wrapper claimed; `tone="ink"` here makes that the same rendered
  // pixel, but truthfully. The `opacity-70` wrapper on the dark ground is
  // the escape hatch `MonoLabel.tsx` itself documents for a softer label on
  // a dark surface — kept as the one place cream is a fraction of itself.
  const slideLabelWord = today ? MATCH_DAY_WORD : MATCH_KIND_WORD[kind];
  const label = matchDay ? (
    <span className="opacity-70">
      <MonoLabel size="sm" tone="cream">
        {slideLabelWord}
      </MonoLabel>
    </span>
  ) : (
    <MonoLabel size="sm" tone="ink">
      {slideLabelWord}
    </MonoLabel>
  );

  if (showing.kind === "reservation" || showing.kind === "reduced") {
    // No CTA for a reservation or a hidden-result tournament fixture —
    // mirrors the mobile ledger row: #2606 decision 5 ruled a reservation
    // out as a navigation target, and every other reduced renderer in
    // this repo extends that to a tournament fixture with a hidden
    // result too (#2696/#2802) rather than inventing a second rule.
    return {
      label,
      rowKind: showing.kind,
      content: (
        <ReservationDesktopSlide match={showing} dateLabel={dates.widget} />
      ),
      cta: null,
    };
  }

  return {
    label,
    content: (
      <>
        <div className="flex min-w-0 items-center justify-center gap-3 px-6">
          <Crest team={showing.homeTeam} big dark={matchDay} />
          <DesktopTeamName team={showing.homeTeam} dark={matchDay} />
          {isResultSlide || today ? (
            // `<Score>` already owns the ground colour and the
            // has-a-score/no-score fallback (`match.time ?? "vs."`) — on
            // match day the fixture has no score yet, so this renders
            // exactly the kickoff the "names … the kickoff" half of
            // #2616's AC asks for, in the same slot the result's score
            // sits in (#2616 review, replacing a hand-built middle arm
            // that duplicated `<Score>` byte for byte).
            <Score
              match={showing}
              className="text-mono-md shrink-0"
              dark={matchDay}
              awaitingResult={isAwaitingResult(showing, kind)}
            />
          ) : (
            // Reachable only for a future, non-today fixture — which
            // means `matchDay` is always false here (a fixture slide is
            // only ever "today" when `matchDay` is true), so this never
            // needs a dark counterpart.
            // `ink/50` computes to 3.63:1 on cream — below AA. `ink-muted` is
            // the palette's answer for de-emphasised text and clears at ~4.9:1.
            <span className="font-display text-ink-muted text-mono-md shrink-0 leading-none italic">
              vs.
            </span>
          )}
          <DesktopTeamName team={showing.awayTeam} dark={matchDay} />
          <Crest team={showing.awayTeam} big dark={matchDay} />
        </div>
        {/* No venue glyph: both teams render in scoreboard order here, so the
            layout already says who was at home.
            MATCH_DAY_WORD lives on the slide label to the left, not here
            too — the mobile row's own rationale ("restating 'Volgende'
            under 'Vandaag' would argue with itself") applies just as
            much to stacking the word twice on one desktop slide. This
            line keeps doing what it does on any other day: naming the
            competition, just without the now-redundant date/kickoff
            (#2616 review). */}
        <div
          className={cn(
            "text-mono-sm mt-1.5 text-center font-mono font-semibold",
            metaTone,
          )}
        >
          {today
            ? (showing.competition ?? "")
            : `${dates.widget}${
                !isResultSlide && showing.time ? ` · ${showing.time}` : ""
              }${showing.competition ? ` · ${showing.competition}` : ""}`}
        </div>
      </>
    ),
    cta: (
      <Link
        href={`/wedstrijd/${showing.id}`}
        className={getButtonClasses({
          // The primary variant's fill is 2.3:1 on the match-day ground
          // and its ink border/shadow 1.6:1 — both effectively invisible
          // (#2616 decision sheet §8, D7c). `inverted` needs no new
          // variant: it is already cream-ground with the soft offset
          // shadow this ground calls for.
          variant: matchDay ? "inverted" : "primary",
          size: "sm",
          className: "no-underline",
        })}
      >
        Wedstrijddetails
        <span aria-hidden="true">→</span>
        <LinkPendingDots spaced={false} tone={matchDay ? "default" : "light"} />
      </Link>
    ),
  };
}

/**
 * The desktop slide's reduced content for a pitch-reservation placeholder or
 * a tournament fixture with a hidden result (#2696/#2802) — one crest, the
 * subject/kickoff, no opponent slot. See `ReservationLedgerRow` for the
 * mobile equivalent and the shared rationale.
 *
 * No `otherClub` passed to `reservationView()` here (#2802 review) — unlike
 * `ReservationLedgerRow` above (crest only, no name text), this slide also
 * prints `match.team.name` as its own text node directly below the crest.
 * Folding the club into "competition · club" too would print it twice.
 */
function ReservationDesktopSlide({
  match,
  dateLabel,
}: {
  match: ScheduleReservation | ScheduleReducedMatch;
  dateLabel: string;
}) {
  const { subject, statusWording } = reservationView(match);
  return (
    <>
      <div className="flex min-w-0 items-center justify-center gap-3 px-6">
        <Crest team={match.team} big />
        <span className="font-display text-ink text-mono-md min-w-0 truncate leading-none font-bold italic">
          {match.team.name}
        </span>
      </div>
      <div className="text-ink text-mono-sm mt-1.5 text-center font-mono font-semibold">
        {subject}
        {" · "}
        {dateLabel}
        {match.time ? ` · ${match.time}` : ""}
        {statusWording ? ` · ${statusWording.longForm}` : ""}
      </div>
    </>
  );
}

function DesktopTeamName({
  team,
  dark = false,
}: {
  team: ScheduleTeam;
  /** The match-day ground (#2616). */
  dark?: boolean;
}) {
  return (
    <span
      className={cn(
        "font-display text-mono-md max-w-[40%] min-w-0 truncate leading-none font-bold italic",
        dark ? "text-cream" : "text-ink",
      )}
    >
      {team.id === KCVV_CLUB_ID ? "KCVV" : team.name}
    </span>
  );
}
