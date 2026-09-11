"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatMatchWidgetDate } from "@/lib/utils/dates";
import { FilterTabs, type FilterTab } from "@/components/design-system";
import { House, Bus } from "@/lib/icons.redesign";
import {
  HOME_AWAY_WORD,
  reservationRowLabel,
  reservationView,
} from "@/lib/utils/match-display";
import type {
  UpcomingReducedMatch,
  UpcomingReservation,
  UpcomingRow,
} from "@/components/match/types";
import {
  trackAgendaCollapse,
  trackAgendaExpand,
  trackAgendaFilter,
  trackAgendaRowClick,
} from "./upcoming-matches-analytics";

/** Filter value meaning "no team filter" — never a real squad label. */
const ALL_TEAMS = "all";

/** Which side of a fixture KCVV is playing. Absent when neither team is ours. */
type KcvvSide = "home" | "away";

export interface UpcomingMatchesClientProps {
  matches: UpcomingRow[];
  initialVisible: number;
  kcvvTeamId: number;
  initialExpanded?: boolean;
}

const matchTimestamp = (m: UpcomingRow): number => {
  const base =
    m.date instanceof Date ? m.date.getTime() : new Date(m.date).getTime();
  if (!m.time) return base;
  const [h, min] = m.time.split(":").map((n) => Number.parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(min)) return base;
  const d = new Date(base);
  d.setUTCHours(h ?? 0, min ?? 0, 0, 0);
  return d.getTime();
};

/**
 * The squad a fixture belongs to, resolved once. Both the chip row and the row
 * caption read it from here, so a match can never be filed under a chip whose
 * label the row then contradicts.
 */
const matchTeamLabel = (m: UpcomingRow): string | undefined =>
  m.teamLabel || m.kcvvTeamLabel || m.squadLabel;

export const UpcomingMatchesClient = ({
  matches,
  initialVisible,
  kcvvTeamId,
  initialExpanded = false,
}: UpcomingMatchesClientProps) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [selectedTeam, setSelectedTeam] = useState<string>(ALL_TEAMS);

  // The single source for every facet's count: the chip badge, the "one team
  // only" test, and the analytics `count` all read it, so a chip's badge can
  // never disagree with the number its click reports.
  //
  // Label-sorted, not chronological or count-ranked: a chip has to keep the
  // same position from week to week, or a parent re-hunts for their kid's team
  // every time a fixture drops off the front of the list.
  const counts = new Map<string, number>();
  for (const match of matches) {
    const label = matchTeamLabel(match);
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const tabs: FilterTab[] = [
    { value: ALL_TEAMS, label: "Alles", count: matches.length },
    ...[...counts]
      .sort(([a], [b]) => a.localeCompare(b, "nl"))
      .map(([label, count]) => ({ value: label, label, count })),
  ];

  // One team means nothing to choose between — the chip row would be a reset
  // button beside a single dead facet, so it drops out entirely.
  const showFilter = tabs.length > 2;

  // Sorted once over the whole set, then filtered: `Array.prototype.filter`
  // preserves order, so scoping never needs a re-sort.
  const chronological = matches
    .slice()
    .sort((a, b) => matchTimestamp(a) - matchTimestamp(b));
  const scoped =
    selectedTeam === ALL_TEAMS
      ? chronological
      : chronological.filter((m) => matchTeamLabel(m) === selectedTeam);

  const canExpand = scoped.length > initialVisible;
  // Expanding shows the whole scoped set, deliberately uncapped (#2405).
  //
  // The list cannot run away: `getNextMatches` returns exactly ONE fixture per
  // visible team — never a team's season — so its length is the club's team
  // count, not the calendar's. Today that is 21 teams past the BFF's
  // `showInNavigation != false` gate, of which the homepage routes the 3 senior
  // sides to `<FirstTeamsBlock>`, leaving at most 18 rows here. A cap would be
  // an arbitrary number sitting in front of a bound the data already enforces,
  // and virtualising 18 rows costs more than it saves.
  //
  // `apps/api/src/psd/service.test.ts` locks the one-row-per-team invariant. If
  // that test ever goes red, this line is what needs a real cap.
  const visible = expanded ? scoped : scoped.slice(0, initialVisible);

  const handleFilter = (value: string) => {
    // Dedup guard — reselecting the active chip must not re-fire state or
    // analytics (apps/web/CLAUDE.md § Analytics & Instrumentation).
    if (value === selectedTeam) return;
    setSelectedTeam(value);
    // Collapse on every facet change: an expanded list left expanded under a
    // narrower facet silently shows a "full" list that is nothing of the sort.
    setExpanded(false);
    trackAgendaFilter(
      value,
      tabs.find((tab) => tab.value === value)?.count ?? 0,
    );
  };

  const handleToggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) trackAgendaExpand(scoped.length);
    else trackAgendaCollapse(scoped.length);
  };

  return (
    <>
      {showFilter && (
        <FilterTabs
          tabs={tabs}
          activeTab={selectedTeam}
          onChange={handleFilter}
          ariaLabel="Filter wedstrijden op ploeg"
          className="mb-5"
        />
      )}

      <ul className="flex flex-col gap-3">
        {visible.map((match) => (
          <li key={match.id}>
            <MatchRow match={match} kcvvTeamId={kcvvTeamId} />
          </li>
        ))}
      </ul>

      {canExpand && (
        <button
          type="button"
          onClick={handleToggleExpand}
          className="border-ink bg-cream-soft text-ink shadow-paper-sm focus-visible:outline-ink mt-6 w-full border-2 px-4 py-3 font-mono text-sm font-bold tracking-wide uppercase transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 md:w-auto"
        >
          {expanded
            ? "Toon minder ↑"
            : `Toon alle ${scoped.length} wedstrijden ↓`}
        </button>
      )}

      {expanded && (
        <div className="mt-6">
          <Link
            href="/kalender"
            // `py-2 -my-2` — hit area only, no layout shift (#2394).
            // `hover-underline-thicken` (#2610): underline is present at
            // rest and thickens on hover, replacing the old `hover:underline`
            // jump — see globals.css.
            className="hover-underline-thicken text-ink hover:text-jersey-deep -my-2 inline-flex items-center gap-1 py-2 font-mono text-sm font-bold tracking-wide uppercase underline-offset-4"
          >
            Volledige kalender ↗
          </Link>
        </div>
      )}
    </>
  );
};

/**
 * Home/away badge — drill 2398-1 variant B, locked 2026-08-12
 * (docs/design/mockups/2398-agenda-youth-path/2398-1-homeaway-vocab-compare.html).
 *
 * One sign system with `<TeamAgendaRow>`: House means thuis, Bus means uit.
 * This surface has the width to say the word too, so the glyph rides
 * `aria-hidden` beside it — labelling both would announce the fact twice. The
 * dense mobile agenda row, which has no room for the word, keeps its labelled
 * bare glyph.
 *
 * Two existing peers were considered and neither fits:
 *
 * - `<MonoLabel variant="pill-jersey-deep">` is `inline-block` and
 *   hard-uppercase; the lock calls for inline-flex with a glyph and sentence
 *   case. The token wiring below is otherwise MonoLabel's `sm` pill verbatim —
 *   if a second surface needs this badge, add the two missing switches to
 *   MonoLabel and delete this rather than making a fourth copy.
 * - `<MatchVenueTag>` (`components/calendar/calendar-tags.tsx`) already renders
 *   these two words as a mono pill, but uppercase, glyph-less, and in
 *   `/kalender`'s `card-red` colour language.
 *
 * #2404 reconciled those two colour languages — as far as they can be. The hues
 * cannot merge: `card-red` on `/kalender` does not mean "thuis", it means
 * "Wedstrijden", the match category set against the per-type event fills, and
 * that is owner-locked (6d1/#1992, `6d-kalender-locked.md`). What the two
 * surfaces genuinely disagreed about was the *grammar*: `/kalender` says thuis
 * with a fill and uit with an outline, while this badge said it with two
 * different fills, so "uit" arrived as a solid ink block — as heavy as the home
 * state and, on a page of green, louder. Both now read filled = thuis, outlined
 * = uit, each in its own surface's hue.
 *
 * The wording itself comes from `HOME_AWAY_WORD` so no surface holds its own
 * copy of the words.
 *
 * Takes the resolved side rather than a boolean: a two-state flag has no way to
 * say "neither team is ours", and the falsy branch would silently claim `Uit`.
 * `<TeamAgendaRow>` models the same fact the same way (`boolean | undefined`).
 */
const HomeAwayBadge = ({ side }: { side: KcvvSide }) => {
  const isHome = side === "home";
  const Icon = isHome ? House : Bus;
  return (
    <span
      className={cn(
        // Both states carry the border now, so the padding is MonoLabel's `sm`
        // pill verbatim rather than the +2px this badge used to spend standing
        // in for one. Keeping the border on the filled state too is what stops
        // the two states changing size as a row flips thuis/uit.
        "inline-flex shrink-0 items-center gap-1.5 border px-2 py-1",
        "text-label font-mono leading-none font-medium",
        // jersey-deep, never the bright jersey — the redesign's ink-adjacent
        // green is the only one that carries white text safely. `uit` keeps the
        // same green on its edge instead of switching hue: the outline is what
        // marks it as the lesser state (see the docblock).
        isHome
          ? "border-jersey-deep bg-jersey-deep text-white"
          : "border-jersey-deep/45 text-ink bg-transparent",
      )}
    >
      <Icon size={12} aria-hidden="true" />
      {isHome ? HOME_AWAY_WORD.home : HOME_AWAY_WORD.away}
    </span>
  );
};

interface MatchRowProps {
  match: UpcomingRow;
  kcvvTeamId: number;
}

/**
 * The other-teams agenda's reduced row for a pitch-reservation placeholder
 * (#2606) or a tournament fixture with a hidden result (#2696/#2802) — no
 * opponent slot (a self-match has none, and a not-yet-played tournament
 * fixture's opponent is deliberately unnamed as one), no `<Link>` (mirrors
 * #2606 decision 5, the same rule every other reservation renderer in this
 * repo follows), the subject via `reservationView()` so the wording can't
 * drift from `<TeamAgendaRow>`/`<MatchStripView>`/`/kalender`. The squad chip
 * (`matchTeamLabel`) is kept so a reservation files under the same filter
 * chip a real fixture for that squad would.
 *
 * `<article>`, not a bare `<div>` — see the markup rule on
 * `reservationRowLabel` in `match-display.ts`.
 */
const ReservationMatchRow = ({
  match,
}: {
  match: UpcomingReservation | UpcomingReducedMatch;
}) => {
  // No `otherClub` here (#2802 review) — unlike the caption-only reduced
  // renderers, this row already prints `match.team.name` as its own bold
  // text node below. Composing "competition · club" into `subject` too
  // would print the same club twice: bold "FC Zemst Sportief" directly
  // above "U9 · Tornooi · FC Zemst Sportief".
  const { subject, statusWording } = reservationView(match);
  const dateLabel = formatMatchWidgetDate(match.date);
  const label = reservationRowLabel({
    subject,
    dateLabel,
    time: match.time,
    status: match.status,
    statusWording,
  });
  // `statusWording` rides the visible caption, not only the accessible name:
  // a cancelled reservation that looks identical to a live one tells a parent
  // to turn up for something that is off (#2688).
  const caption = [
    matchTeamLabel(match),
    subject,
    match.venue,
    statusWording?.longForm,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      aria-label={label}
      data-row-kind={match.kind}
      className={cn(
        "border-ink bg-cream relative grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-2 px-4 py-3",
        "sm:grid-cols-[auto_1fr_auto] sm:gap-x-4",
      )}
    >
      {/* `aria-hidden`: the `aria-label` above is this row's sole accessible
          content — see the same pattern on `<TeamAgendaRow>`'s placeholder
          branch and `<MatchStripView>`'s `ReservationLedgerRow`. */}
      <div aria-hidden="true" className="contents">
        <span className="text-ink/70 col-span-1 row-start-1 font-mono text-xs font-bold tracking-wide uppercase sm:col-auto sm:row-auto sm:min-w-[10rem]">
          {dateLabel}
          {match.time ? ` · ${match.time}` : ""}
        </span>

        <span className="text-ink col-span-2 row-start-2 font-sans text-base leading-tight sm:col-auto sm:row-auto">
          <span className="font-bold">{match.team.name}</span>
          {caption && (
            <span className="text-ink/60 mt-0.5 block text-xs font-medium">
              {caption}
            </span>
          )}
        </span>
      </div>
    </article>
  );
};

const MatchRow = ({ match, kcvvTeamId }: MatchRowProps) => {
  // Enumerated positively (#2802 review) — a negated
  // `kind !== "match"` catch-all would silently route any future fourth
  // `kind` into the reduced row too, with no compile error.
  if (match.kind === "reservation" || match.kind === "reduced") {
    return <ReservationMatchRow match={match} />;
  }

  const homeIsKcvv = match.homeTeam.id === kcvvTeamId;
  const awayIsKcvv = match.awayTeam.id === kcvvTeamId;
  // Which side the badge speaks for, derived from the two flags above so it can
  // never contradict the emphasis. `undefined` when neither id matches: the old
  // `isHome={homeIsKcvv}` collapsed that case into the falsy branch and rendered
  // "Uit", asserting an away fixture for a match it cannot place.
  //
  // Home wins a tie. KCVV-vs-KCVV is real data — pitch-reservation placeholders
  // come through the feed — and reads as a home fixture; both names still bold,
  // because each flag is an independent truth about its own team.
  const kcvvSide: KcvvSide | undefined = homeIsKcvv
    ? "home"
    : awayIsKcvv
      ? "away"
      : undefined;
  const dateLabel = formatMatchWidgetDate(match.date);
  const when = [dateLabel, match.time].filter(Boolean).join(" · ");
  // Venue last, and only when present. PSD supplies no venue field today —
  // `apps/api/src/psd/transforms.ts` hardcodes `undefined` — so in production
  // this collapses back to `team · competition` until the BFF sources one.
  const caption = [matchTeamLabel(match), match.competition, match.venue]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/wedstrijd/${match.id}`}
      onClick={() => trackAgendaRowClick(match.id)}
      className={cn(
        "border-ink bg-cream group relative grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-2 px-4 py-3",
        "shadow-paper-sm transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
        "focus-visible:outline-ink focus-visible:outline-2 focus-visible:outline-offset-2",
        "sm:grid-cols-[auto_1fr_auto] sm:gap-x-4",
      )}
    >
      <span className="text-ink/70 col-span-1 row-start-1 font-mono text-xs font-bold tracking-wide uppercase sm:col-auto sm:row-auto sm:min-w-[10rem]">
        {when}
      </span>

      <span className="text-ink col-span-2 row-start-2 font-sans text-base leading-tight sm:col-auto sm:row-auto">
        <span className={cn(homeIsKcvv && "font-bold")}>
          {match.homeTeam.name}
        </span>
        <span className="text-ink/60 mx-2">—</span>
        <span className={cn(awayIsKcvv && "font-bold")}>
          {match.awayTeam.name}
        </span>
        {caption && (
          <span className="text-ink/60 mt-0.5 block text-xs font-medium">
            {caption}
          </span>
        )}
      </span>

      <span className="col-start-2 row-start-1 sm:col-auto sm:row-auto">
        {kcvvSide && <HomeAwayBadge side={kcvvSide} />}
      </span>
    </Link>
  );
};
