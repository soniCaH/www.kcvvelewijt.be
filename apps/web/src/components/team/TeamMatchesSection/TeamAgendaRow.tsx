"use client";

/**
 * <TeamAgendaRow> — one match row in the team matches agenda.
 *
 * Responsive (one component, one sm breakpoint ~640px):
 *   A · desktop = symmetric scoreboard: [stub][home crest+name][score/time][away name+crest]
 *   B · mobile  = KCVV-centric column:  [stub][opponent crest+name+comp][home/away icon][score/time]
 *
 * The two names always split the row evenly (`flex-1` a side), so the score sits
 * dead centre whatever the clubs are called. A name too long for its half
 * ellipsises — it never borrows from the other side, because a score that moves
 * between rows reads as a broken table (#2397).
 *
 * A third state — `match.isPlaceholder` (#2606) — replaces the row's body with
 * one crest, a subject line in the caption's mono-uppercase register (the
 * competition label by default, `kind`/`captionLabel`/an exceptional status
 * layered on via the same `buildCaption` the normal row uses), and the real
 * kickoff time (or `upcomingLabel`, honoured the same as ever). It sheds the
 * second crest, the opponent name, the home/away icon, the score slot, and
 * the row's own `<Link>` and click handler — a self-match
 * (`homeClubId === awayClubId`) is a pitch-reservation the club holds before
 * an opponent or programme is known, not a match to navigate to, so there is
 * nothing to fire a "clicked through" event for.
 *
 * A fourth state — `match.competitionType === "tournament"` (#2696, built on
 * #2692's structured type) — reuses that same reduced shape rather than a
 * third layout, because whether the named club hosts the tournament or is
 * merely another participant is not knowable from PSD: the row can state
 * that the club is *where* the tournament is, never claim it as an opponent.
 * The crest is the non-KCVV side's, derived from the club id (never
 * home/away, since a tournament fixture — unlike a placeholder — has two
 * genuinely different sides). The subject is the competition then the club
 * ("TORNOOI · FC ZEMST SPORTIEF"), and unlike a placeholder it never takes
 * the slot word, even featured — the green "Eerstvolgende" ground already
 * says the row is next, and the word would push the club name into the
 * ellipsis at narrow widths. #2693 (the design decision this ships) ruled
 * the two states sharing one layout is sufficient distinctness — different
 * crest, a club in the subject, a different detector — and that no further
 * visual separation is to be invented.
 *
 * Unlike the normal row's two genuinely different layouts, the reduced
 * states' only real difference between breakpoints is a font size and a
 * spacer that mirrors the away side purely to keep the time column centred —
 * so each is one DOM tree, sized responsively, not two.
 *
 * Design lock: docs/design/mockups/phase-6-team/detail-ia-locked.md §3
 */
import { Fragment } from "react";
import Link from "next/link";
import { Crest, PRESS_DOWN_CLASSES } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { toMatchDisplayZone } from "@/lib/utils/dates";
import {
  getResultColor,
  HOME_AWAY_A11Y_NAME,
  isPlayedMatch,
  isSettledMatch,
  MATCH_KIND_WORD,
  OUTCOME_UNDERLINE,
  OUTCOME_WORD,
  OUTCOME_WORD_FULL,
  reservationRowLabel,
  reservationView,
  type MatchOutcome,
  type MatchRowKind,
} from "@/lib/utils/match-display";
import { House, Bus } from "@/lib/icons.redesign";
import type { ScheduleMatch, ScheduleRow } from "@/components/match/types";

export interface TeamAgendaRowProps {
  match: ScheduleRow;
  /**
   * PSD team ID of the KCVV team being rendered (used to determine home/away
   * when is_home is absent). Passed down from the page.
   */
  kcvvTeamId?: number;
  /** When true, renders as the featured "Eerstvolgende" card (jersey-deep bg). */
  featured?: boolean;
  /**
   * When false, omits the leading date stub. Used where the row is already
   * grouped under a known day (the `/kalender` grid's selected-day detail) so
   * the day/month stub is redundant. Defaults to `true` — the team-detail
   * agenda (6.C) spans many dates and always shows it.
   */
  showDateStub?: boolean;
  /**
   * Fired when the row is clicked through to the match detail. Lets a host
   * surface attach navigation-time side-effects (e.g. `/kalender`'s
   * `kalender_item_click` analytics) without re-implementing the row. Never
   * fired for a placeholder row — it has no match detail to click through
   * to, so a caller must not construct a "clicked through" analytics event
   * for one in the first place (see `<FirstTeamAgendaRow>`).
   */
  onNavigate?: () => void;
  /**
   * Optional jersey-deep label prepended to the competition caption (P2), e.g.
   * the KCVV squad that played ("A-Ploeg" · 3e Prov.). Used by the
   * opponent-history (`/tegenstander`) page, where one opponent can mix
   * A-Ploeg / B-Ploeg / youth and the team must be named on the row. Distinct
   * from `team.teamLabel` (the opponent's designation chip beside its name).
   */
  captionLabel?: string;
  /**
   * Label shown in the score slot for not-yet-played matches instead of the
   * kickoff time (e.g. "Gepland" on the opponent-history page, where a precise
   * future kickoff is irrelevant). Rendered in the mono caption register. When
   * omitted, the kickoff time is shown — the team-detail default, where the
   * next fixture's start time matters.
   */
  upcomingLabel?: string;
  /**
   * Which slot this row is filling, when the surface needs the row to say so
   * (#2404).
   *
   * On the desktop scoreboard this is what decides whether the row is named at
   * all — the layout prints both clubs either side of the score, so it can
   * speak for itself and stays quiet unless asked. The mobile column shows the
   * opponent alone and always names a settled match's outcome, asked or not.
   * See `desktopKindWord` / `mobileKindWord` below.
   *
   * It is the *caller's* answer, never derived from `match.status` — see
   * `MatchRowKind`. Omitted by default, because most host surfaces already
   * answer it in their own chrome and would otherwise say it twice:
   * `<TeamMatchesSection>` heads its featured row "Eerstvolgende",
   * `/kalender` groups rows under a date where "Volgende" would be a lie for
   * any day but today's, and `/ploegen/<slug>/wedstrijden` bands its rows by
   * month in date order. The homepage `<FirstTeamsBlock>` is the surface with
   * two colour-coded columns and no words anywhere.
   */
  kind?: MatchRowKind;
  className?: string;
}

type Outcome = MatchOutcome | null;

function computeOutcome(
  match: ScheduleMatch,
  isHome: boolean | undefined,
): Outcome {
  // Settled, not merely finished: a forfeit is a real win or loss and must be
  // tinted like one. `<MatchStripView>` derives its outcome from the scores
  // alone, so gating on `=== "finished"` here made the two surfaces disagree
  // about the same match (#2423). `stopped` stays out — nothing is settled.
  if (!isSettledMatch(match.status)) return null;
  if (
    typeof match.homeScore !== "number" ||
    typeof match.awayScore !== "number" ||
    isHome === undefined
  ) {
    return null;
  }
  return getResultColor(match.homeScore, match.awayScore, isHome);
}

// `"use client"`: every date below renders twice, once on the UTC host and once
// in the visitor's browser, so an unpinned parse is a React text mismatch and
// not merely a wrong time. A BFF match date carries Belgian wall-clock in its
// UTC fields — `toMatchDisplayZone` is the parse that reads it (#2601).

function formatDay(date: Date): string {
  return toMatchDisplayZone(date).toFormat("d");
}

function formatMonth(date: Date): string {
  return toMatchDisplayZone(date)
    .toFormat("MMM")
    .replace(/\.$/, "")
    .toLowerCase();
}

function formatKickoff(match: { time?: string; date: Date }): string {
  if (match.time) return match.time;
  return toMatchDisplayZone(match.date).toFormat("HH:mm");
}

/**
 * Team name with an optional designation suffix ("A" / "B" / "U23").
 *
 * Name and suffix share ONE truncating box, so the ellipsis eats the suffix
 * before it touches the club name (#2405). The suffix used to be a `shrink-0`
 * sibling pinned outside the truncation, which inverted the priority: "Yellow
 * Red KV Mechelen U23" clipped to "Yellow Red KV Mech… U23", keeping the three
 * characters a reader can infer and dropping the ones they cannot. A reader
 * scanning for the opponent needs the club; the squad is the detail that gives
 * way first.
 *
 * `block` is load-bearing: the mobile layout hands this a plain `<div>` parent,
 * and `overflow: hidden` does nothing on an inline box. In the desktop flex row
 * the flex container blockifies it anyway, so one class serves both.
 */
function TeamName({
  team,
  featured,
  bold = false,
  align = "left",
}: {
  team: ScheduleMatch["homeTeam"];
  featured: boolean;
  bold?: boolean;
  align?: "left" | "right";
}) {
  return (
    <span
      className={cn(
        "block min-w-0 flex-1 truncate text-sm",
        align === "right" && "text-right",
        featured ? "text-white" : "text-ink",
        bold && "font-semibold",
      )}
    >
      {team.name}
      {team.teamLabel ? (
        <>
          {/* A real space, not a margin — the suffix now sits inside the name's
              text run, so the gap has to survive into the text content or the
              row reads as "MechelenU23" to a screen reader. */}{" "}
          <span
            className={cn(
              "font-mono text-[10px] font-semibold tracking-wide",
              // White on jersey-deep / ink-muted on cream — matches the
              // competition caption's contrast-safe tones.
              featured ? "text-white" : "text-ink-muted",
            )}
          >
            {team.teamLabel}
          </span>
        </>
      ) : null}
    </span>
  );
}

export function TeamAgendaRow({
  match,
  kcvvTeamId,
  featured = false,
  showDateStub = true,
  onNavigate,
  captionLabel,
  upcomingLabel,
  kind,
  className,
}: TeamAgendaRowProps) {
  // The adapter (`transformMatchToSchedule`) has already asked
  // `isReducedMatchRow()` once and baked the answer into `kind` — this reads
  // that discriminant rather than re-deriving the same question a second
  // time from raw match fields. Enumerated positively (#2802 review)
  // rather than `kind !== "match"`: a negated catch-all treats
  // any *future* fourth `kind` as reduced too, silently, with no compile
  // error; this way a new member falls through to the `match`-only branch
  // below instead, where it fails loudly on the fields it doesn't carry.
  // One definition, reused at every site below that used to re-spell
  // `kind !== "match"` on its own.
  const isReducedRow = match.kind === "reservation" || match.kind === "reduced";

  // Prefer match.is_home (provided by BFF); fall back to comparing kcvvTeamId
  // against the home team's id when the BFF field is absent. Meaningless for
  // a reservation or a hidden-result tournament fixture (neither carries a
  // `homeTeam` to compare — see `ScheduleReservation`/`ScheduleReducedMatch`),
  // so this narrows on `isReducedRow` rather than reading `homeTeam` off a
  // shape that doesn't carry one.
  const isHome: boolean | undefined = isReducedRow
    ? undefined
    : (match.isHome ??
      (kcvvTeamId !== undefined
        ? kcvvTeamId === match.homeTeam.id
        : undefined));

  // Hoisted ahead of their other uses further down (`showUpcomingLabel`,
  // the normal row's `scoreOrTime`) — `isPlayed` and `hasScoreline` are
  // needed standalone here, not just as inputs to `isReducedRow` above.
  const isPlayed = isPlayedMatch(match.status);
  const hasScoreline =
    !isReducedRow &&
    isPlayed &&
    typeof match.homeScore === "number" &&
    typeof match.awayScore === "number";

  // White on jersey-deep, inherited from the pre-#2395 green when cream missed
  // AA there. Both clear it now (white 5.29:1, cream 4.69:1) — see DESIGN.md
  // "Chips / Labels" for the open reconcile-to-cream question.
  const monoClass = featured ? "text-white" : "text-ink-muted";

  const cardBase = cn(
    "flex items-stretch gap-0",
    "border-2",
    // A placeholder/tournament row carries no link and no navigate handler,
    // so it does not get the paper press-down hover affordance either — there is
    // nothing underneath it to press down onto.
    !isReducedRow && PRESS_DOWN_CLASSES,
    featured
      ? // Soft ink-muted offset (the design-system dark-card shadow, cf.
        // `--shadow-paper-sm-soft`) — a cream shadow vanished against the cream
        // page, and a dark-green one would blend into the jersey-deep body.
        "bg-jersey-deep border-jersey-deep text-white shadow-[2px_2px_0_0_var(--color-ink-muted)]"
      : "bg-cream border-ink text-ink shadow-[2px_2px_0_0_var(--color-ink)]",
    className,
  );

  const stubBorder = featured
    ? "border-r-2 border-dashed border-cream/40"
    : "border-r-2 border-dashed border-ink/30";

  const day = formatDay(match.date);
  const month = formatMonth(match.date);

  const dateStub = showDateStub ? (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center gap-0 px-3 py-3",
        stubBorder,
        featured ? "bg-jersey-deep" : "bg-cream-soft/30",
      )}
      aria-label={`${day} ${month}`}
    >
      <span
        className={cn(
          "font-display-big text-[18px] leading-none",
          featured ? "text-white" : "text-ink",
        )}
      >
        {day}
      </span>
      <span
        className={cn(
          "font-mono text-[11px] tracking-widest uppercase",
          monoClass,
        )}
      >
        {month}
      </span>
    </div>
  ) : null;

  // Never settled: a reservation or hidden-result tournament fixture carries
  // no score, so there is nothing for `computeOutcome` to read
  // (`ScheduleReservation`/`ScheduleReducedMatch` have no `homeScore`/
  // `awayScore`/`isHome` to pass it).
  const outcome = isReducedRow ? null : computeOutcome(match, isHome);

  // Show the upcoming label ("Gepland") only for not-yet-played matches when one
  // was supplied. Gating on status (not merely the absence of a scoreline) keeps
  // a finished match with missing scores on the kickoff time rather than wrongly
  // reading "Gepland".
  const showUpcomingLabel = !isPlayed && upcomingLabel != null;
  // The kickoff, or the surface's override — shared by the normal row's score
  // slot (below `scoreOrTime`) and the placeholder's time slot alike, so both
  // resolve `upcomingLabel` identically instead of two independent copies.
  const kickoff = formatKickoff(match);
  const timeOrLabel = showUpcomingLabel ? upcomingLabel : kickoff;
  const scoreOrTime =
    match.kind === "match" && hasScoreline
      ? `${match.homeScore} – ${match.awayScore}`
      : timeOrLabel;

  // Scorelines and kickoff times use the big display face; the "Gepland" label
  // drops to the mono caption register (cf. the mockup `.score.sched`).
  const scoreToneClass = showUpcomingLabel
    ? monoClass
    : featured
      ? "text-white"
      : "text-ink";

  // TeamAgendaRow predates the light/dark ground split OUTCOME_UNDERLINE now
  // carries (#2616) and has never reconsidered this tint for its own
  // `featured` (jersey-deep) card — `.light` here preserves that exact,
  // pre-existing value unchanged, on both grounds.
  const outlineShadow = outcome ? OUTCOME_UNDERLINE.light[outcome] : undefined;

  // A status the layout can't speak for on its own — a forfeit otherwise reads
  // as a bare scoreline, an `afgelast` match as a kickoff to turn up for. The
  // wording comes from `<MatchStatusBadge>`'s table so "Forfait" is spelled the
  // same here as on the match hero; only the chrome differs, because the badge's
  // bordered block would not survive this 9px caption line (#2423). Applies to
  // a placeholder row too: the club can call off a reserved slot the same way
  // it cancels a real fixture, and a bare "9 MEI · TORNOOI · 09:30" would tell
  // a parent to turn up for something that is off. `reservationView()` derives
  // this from the same two rules (`isExceptionalMatchStatus` +
  // `matchStatusWording`) — reused here rather than re-inlined, even though
  // this is the normal row's own statusWording, not a reservation's.
  const statusWording = reservationView(match).statusWording;

  // The word the caption opens with, resolved most-informative-first. A
  // settled match names its outcome; a status the layout can't speak for is
  // left to `statusWording` ("Volgende · AFG" would argue with itself); a
  // surface that asked for its rows to be named gets the slot word.
  //
  // Two spellings of the outcome word: `OUTCOME_WORD` is the fixed-width
  // caption register ("Gelijk", #2512/#2656) — used below for the VISIBLE
  // desktop/mobile captions, which is where the column exists to protect.
  // `OUTCOME_WORD_FULL` ("Gelijkspel") is for `buildRowLabel`'s accessible
  // name further down, which has no column at all — reading the shortened
  // spelling into it would leak a visual-only abbreviation into a register
  // that never needed it.
  const outcomeWord = outcome ? OUTCOME_WORD[outcome] : null;
  const outcomeWordA11y = outcome ? OUTCOME_WORD_FULL[outcome] : null;
  const slotWord = statusWording ? null : kind ? MATCH_KIND_WORD[kind] : null;

  // The two layouts do not need the same amount of help, so they do not get
  // the same caption.
  //
  // The desktop scoreboard prints both clubs either side of the score, in
  // home–away order, with KCVV among them — "K Lyra-Lierse 4 – 0 KCVV Elewijt"
  // already says who lost. Adding "VERLIES" there restates the row, and down a
  // season of results it stacks into a column of the same word. So desktop
  // names a row only when the host surface asked it to, via `kind`.
  //
  // The mobile column shows the opponent alone. The same scoreline arrives as
  // "4 – 0" beside "K Lyra-Lierse" and a bus glyph, and reading KCVV's 0 out of
  // it means knowing the score is home–away *and* decoding the glyph first.
  // That is where the word does real work, so it is not gated there.
  //
  // The placeholder row below reuses `mobileKindWord`: it never prints two
  // clubs either side of a score, so desktop's "stay quiet unless asked"
  // reasoning never applied to it in the first place.
  const desktopKindWord = kind ? (outcomeWord ?? slotWord) : null;
  const mobileKindWord = outcomeWord ?? slotWord;
  // The accessible-name twin of `mobileKindWord` above — same resolution
  // order, but reads `outcomeWordA11y` so a drawn row's aria-label says
  // "Gelijkspel", never the caption's width-driven "Gelijk" (#2656 review).
  const mobileKindWordA11y = outcomeWordA11y ?? slotWord;

  // On jersey-deep every emphasised caption segment collapses to `warm`; only
  // the cream side gives each one its own tone.
  const emphasis = (creamTone: string) =>
    cn("font-semibold", featured ? "text-warm" : creamTone);

  // Caption (P2): the optional kind word, an optional status marker, then an
  // optional jersey-deep squad label (e.g. "A-Ploeg"), then a competition
  // slot. `competitionText` defaults to `match.competition` for the normal
  // row's two calls below; the placeholder row overrides it with its
  // resolved subject (competition, or the "Gereserveerd" fallback), so that
  // fallback participates in the same visible caption instead of living in
  // a parallel string only the accessible label could reach.
  //
  // Built as a list and interleaved once rather than as a ladder of `a && (b ||
  // c || d) ? " · "` separators — each of those has to name every later segment,
  // so a fourth entry (#2404's kind word) meant a third separator and a re-read
  // of the two before it. A missed tail-check shows up as a stray or swallowed
  // separator, which nothing here would fail on.
  const buildCaption = (
    leadWord: string | null,
    // `||` not `??` — an empty-string competition must drop out, not render a
    // trailing separator.
    competitionText: string | null = match.competition || null,
  ) => {
    const parts = [
      leadWord ? (
        <span className={emphasis("text-ink")}>{leadWord}</span>
      ) : null,
      statusWording ? (
        // Abbreviation, not the long form: this caption shares a fixed-width
        // centre column with the scoreline, so every extra character is taken
        // straight off the team names either side — "FORFAIT · BEKER VAN
        // VLAAMS-BRABANT" truncated them to "SK No…" / "KCV…". `FF` / `AFG`
        // are the same short forms `<MatchStatusBadge>` renders, and `<abbr>`
        // carries the long form for hover and assistive tech.
        <abbr
          title={statusWording.longForm}
          className={cn(emphasis("text-alert"), "no-underline")}
        >
          {statusWording.abbreviation}
        </abbr>
      ) : null,
      captionLabel ? (
        <span className={emphasis("text-jersey-deep")}>{captionLabel}</span>
      ) : null,
      competitionText,
    ].filter(Boolean);

    return parts.length ? (
      <>
        {parts.map((part, i) => (
          // `<Fragment>` adds no DOM node, so the caption's text content and its
          // pixels are unchanged by the interleave.
          <Fragment key={i}>
            {i > 0 ? " · " : null}
            {part}
          </Fragment>
        ))}
      </>
    ) : null;
  };

  // One row-label builder shared by the placeholder row below and the normal
  // row's `matchLabel` further down — the placeholder path supplies its own
  // subject (squad label + competition/fallback) where the normal path
  // supplies the two team names.
  const buildRowLabel = (labelSubject: string) =>
    [
      // The more informative of the two — an accessible name has no layout to
      // restate, so the desktop scoreboard's argument for staying quiet does
      // not apply to it. `mobileKindWordA11y`, not `mobileKindWord`: this
      // string has no column to protect, so a drawn row reads "Gelijkspel"
      // here even though the caption beside it reads "Gelijk" (#2656 review).
      mobileKindWordA11y ? `${mobileKindWordA11y}: ` : "",
      labelSubject,
      `, ${day} ${month}`,
      // `scheduled`, not merely `!isPlayed`: a postponed or cancelled match is
      // also not played, and announcing its kickoff would tell a screen-reader
      // user to turn up for a match that is off — the same failure the visible
      // `statusWording` marker exists to prevent (#2423). A `upcomingLabel`
      // surface ("Gepland") has deliberately dropped the precise time.
      match.status === "scheduled" && !showUpcomingLabel
        ? ` om ${kickoff}`
        : "",
      // And the status itself has to reach the name, not just the caption: the
      // label replaces the row's contents, so a forfeit otherwise announces as a
      // plain win. Long form here — there is no width to save in a string.
      statusWording ? ` — ${statusWording.longForm}` : "",
    ].join("");

  // One score/time-slot recipe, reused by the normal row's desktop span, its
  // mobile span, and the placeholder's single span — each supplies its own
  // size/padding, but the size always lives INSIDE the `showUpcomingLabel`
  // ternary's non-mono branch, never appended after via a second `cn()`
  // call. `cn` is `twMerge`: appending a size class after the fact once
  // silently overrode the 11px mono register with the display face's size
  // whenever `upcomingLabel` was set, making "GEPLAND" render at 18px on
  // `/tegenstander`.
  const scoreSlotClass = (paddingClass: string, sizeClass: string) =>
    cn(
      "shrink-0 leading-none",
      paddingClass,
      showUpcomingLabel
        ? "font-mono text-[11px] font-semibold tracking-wider uppercase"
        : cn("font-display-big tabular-nums", sizeClass),
      scoreToneClass,
    );

  // One caption-register recipe, reused by the normal row's two captions and
  // the placeholder's subject — none of them carry `font-semibold` at this
  // level (individual segments inside `buildCaption` apply their own via
  // `emphasis`), so identical caption content renders the same weight on
  // both a placeholder row and a normal one.
  const captionClass = (extra?: string) =>
    cn("font-mono text-[9px] tracking-wider uppercase", monoClass, extra);

  if (isReducedRow) {
    // `match.team` is already the row's crest — precomputed by the adapter
    // (`transformMatchToSchedule`) for both members: the club's own for a
    // reservation, the other club (via club-id equality, never home/away —
    // #2696) for a tournament fixture with a hidden result. TypeScript still
    // needs `match.kind` to narrow which of the two this is, for the
    // lead-word/label-kind values the two states disagree on.
    const isReservation = match.kind === "reservation";
    const otherClub = isReservation ? undefined : match.team;
    // No slot word, ever, on the reduced (non-reservation) side, unlike the
    // placeholder case: the featured green ground already says the row is
    // next, and at narrow widths the word pushed the club name — the one
    // part this row exists to carry — into the ellipsis (#2693 decision,
    // round 3). Same rule reaches the accessible name via `reducedKind`.
    const reducedLeadWord = isReservation ? mobileKindWord : null;
    const reducedKind = isReservation ? kind : undefined;
    const rowTeam = match.team;

    // The competition label is the default subject ("Tornooi" /
    // "Vriendschappelijk"), rendered in the row's existing mono-uppercase
    // caption register rather than as bold body text — the one deliberate
    // departure from the prototype. It also sidesteps PSD sending one
    // competition name lowercase: the caption's CSS uppercase transform
    // handles it, so the string is never re-cased here. `reservationView()`
    // is the shared derivation (#2688/#2696) — `<MatchStripView>` and
    // `/wedstrijd/[matchId]` call the same helper so the subject can't drift
    // between surfaces; `otherClub` composes a tournament's "competition ·
    // club" subject there, `undefined` for a placeholder.
    const subject = reservationView(match, otherClub).subject;
    const subjectContent = buildCaption(reducedLeadWord, subject);

    // No reason line — "Tegenstander nog niet bekend" was prototyped and cut.
    // The label states only what the row itself states: the subject, the
    // date, the time — never why an opponent is missing or unconfirmed.
    // `labelSubject` folds `captionLabel` in too (unlike the normal row's
    // `scoreboardLabel`, which doesn't need to — two real team names already
    // distinguish one reservation from another; two reservations on the same
    // `/tegenstander`/`/kalender` page, both KCVV vs KCVV, do not).
    const labelSubject = [captionLabel, subject].filter(Boolean).join(" · ");
    const placeholderLabel = reservationRowLabel({
      kind: reducedKind,
      subject: labelSubject,
      dateLabel: `${day} ${month}`,
      time: showUpcomingLabel ? undefined : kickoff,
      status: match.status,
      statusWording,
    });

    const subjectClass = captionClass("min-w-0 flex-1 truncate");
    const timeClass = scoreSlotClass(
      "px-1.5 sm:px-2",
      "text-[16px] sm:text-[18px]",
    );

    // Inside this branch `match.kind` is only ever "reservation" or
    // "reduced" (`isReducedRow`), so "the other one" is exactly
    // `kind === "reduced"` — no separate tournament detector needed.
    return (
      <article
        data-testid="team-agenda-row"
        data-featured={featured}
        data-row-kind={match.kind}
        aria-label={placeholderLabel}
        className={cardBase}
      >
        {/* `aria-hidden`: unlike the normal row's `<Link aria-label>`, which
            replaces the accessible-name computation for an atomic
            interactive element, an `<article>` does not suppress its own
            text content — its children stay separately walkable to a screen
            reader in linear/browse mode. Hiding them keeps the article's
            `aria-label` above as the row's sole spoken content, rather than
            announcing the same date/subject/time twice. `contents` keeps
            this purely-for-ARIA wrapper out of the flex layout so `dateStub`
            and the content row still stretch as direct children of
            `cardBase`. */}
        <div aria-hidden="true" className="contents">
          {dateStub}
          {/* `min-w-0`: a flex item's automatic minimum width is its content
              size, not 0 — without it this box refuses to shrink below the
              subject's natural width, overflows past the date stub, and the
              subject's `truncate` never gets a chance to engage, clipping
              the time off the right edge at narrow widths (#2696). */}
          <div className="flex w-full min-w-0 items-center gap-2 px-3 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Crest name={rowTeam.name} logo={rowTeam.logo} />
              <span className={subjectClass}>{subjectContent}</span>
            </div>
            <span className={timeClass}>{timeOrLabel}</span>
            {/* Mirrors the normal row's [flex-1][shrink-0][flex-1] triple so
                the time column stays in the SAME centred slot an ordinary
                row uses (#2397), instead of drifting to the trailing edge —
                but only at sm+, where the away side it stands in for would
                also show; the mobile column has no second flanking side to
                centre against. */}
            <div className="hidden flex-1 sm:block" />
          </div>
        </div>
      </article>
    );
  }

  // The `aria-label` replaces the row's contents as its accessible name, so
  // anything not spelled out here is unreachable by a screen reader tabbing the
  // links — and until #2404 that included the scoreline itself. Stated
  // side-by-side with each name, the way `<MatchStripView>`'s ledger rows do it,
  // since "3 – 1" alone does not say whose goals are whose.
  const scoreboardLabel = hasScoreline
    ? `${match.homeTeam.name} ${match.homeScore} – ${match.awayTeam.name} ${match.awayScore}`
    : `${match.homeTeam.name} – ${match.awayTeam.name}`;
  const matchLabel = buildRowLabel(scoreboardLabel);

  const desktopCaption = buildCaption(desktopKindWord);
  const mobileCaption = buildCaption(mobileKindWord);

  return (
    <Link
      href={`/wedstrijd/${match.id}`}
      aria-label={matchLabel}
      onClick={onNavigate}
      className="focus-visible:outline-ink block no-underline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <article
        data-testid="team-agenda-row"
        data-featured={featured}
        className={cardBase}
      >
        {/* Date stub */}
        {dateStub}

        {/* Desktop layout (sm+): symmetric scoreboard */}
        {/*
          The caption sits on its own full-width line rather than inside the
          centre column. A flex column is as wide as its widest child, and that
          column is `shrink-0` — so a caption wider than the scoreline used to
          set the column's width and never give it back, and the two `flex-1
          min-w-0` sides absorbed the whole cost by truncating the club names
          ("BEKER VAN BRABANT" → "SK Noss…" / "KCVV Ele…"). Being visually below
          the score never mattered; they shared a box.
        */}
        <div
          data-layout="desktop"
          className="hidden w-full flex-col justify-center px-3 py-2 sm:flex"
        >
          <div className="flex w-full items-center gap-2">
            {/* Home side */}
            <div
              className="flex min-w-0 flex-1 items-center gap-2"
              title={match.homeTeam.name}
            >
              <Crest name={match.homeTeam.name} logo={match.homeTeam.logo} />
              <TeamName
                team={match.homeTeam}
                featured={featured}
                bold={isHome === true}
              />
            </div>

            {/* Score / time */}
            <span
              className={scoreSlotClass("px-2", "text-[18px]")}
              style={outlineShadow ? { boxShadow: outlineShadow } : undefined}
            >
              {scoreOrTime}
            </span>

            {/* Away side */}
            <div
              className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2"
              title={match.awayTeam.name}
            >
              <Crest name={match.awayTeam.name} logo={match.awayTeam.logo} />
              <TeamName
                team={match.awayTeam}
                featured={featured}
                bold={isHome === false}
                align="right"
              />
            </div>
          </div>

          {desktopCaption ? (
            <span className={captionClass("mt-0.5 text-center")}>
              {desktopCaption}
            </span>
          ) : null}
        </div>

        {/* Mobile layout: KCVV-centric column */}
        <div
          data-layout="mobile"
          className="flex w-full items-center gap-2 px-3 py-2 sm:hidden"
        >
          {/* Opponent crest + name + competition */}
          {(() => {
            const opponent = isHome ? match.awayTeam : match.homeTeam;
            const VenueIcon = isHome ? House : Bus;
            return (
              <>
                <Crest name={opponent.name} logo={opponent.logo} />
                <div className="min-w-0 flex-1" title={opponent.name}>
                  <TeamName team={opponent} featured={featured} bold />
                  {mobileCaption ? (
                    <span className={captionClass()}>{mobileCaption}</span>
                  ) : null}
                </div>
                <VenueIcon
                  size={14}
                  aria-label={
                    isHome ? HOME_AWAY_A11Y_NAME.home : HOME_AWAY_A11Y_NAME.away
                  }
                  className={cn(
                    "shrink-0",
                    featured ? "text-white" : "text-ink-muted",
                  )}
                />
                <span
                  className={scoreSlotClass("px-1.5", "text-[16px]")}
                  style={
                    outlineShadow ? { boxShadow: outlineShadow } : undefined
                  }
                >
                  {scoreOrTime}
                </span>
              </>
            );
          })()}
        </div>
      </article>
    </Link>
  );
}
