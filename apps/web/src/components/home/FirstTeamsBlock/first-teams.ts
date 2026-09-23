/**
 * Pure view-model derivation for the homepage "Eerste ploegen" block (#2211).
 *
 * From a senior team's full season feed (`BffService.getMatches(psdId)`),
 * derive its last result + next fixture: next = earliest fixture-slot match;
 * result = most recent settled match (`isSettledMatch`, so forfeits count) that
 * is either past its kickoff or already carries a scoreline, or one that has
 * kicked off while the club waits for the score (#2390). `matchSlot` owns that
 * routing for every `MatchStatus`. Both sides are emitted as `ScheduleMatch`
 * via the shared `transformMatchToSchedule`, so the block renders them with the
 * same unified `<TeamAgendaRow>` used on team pages + `/kalender` (#2301,
 * Direction A) — no bespoke card shapes to drift. Kept free of React so it can
 * be unit-tested in isolation.
 *
 * Despite living under `components/home/`, this is not homepage-private:
 * `lib/server/match-data.ts` imports `pickLastResult` / `pickNextFixture` for
 * the landing-page `<MatchStrip>` (#2387), so both surfaces always name the
 * same match "the last one". Changing what a slot admits changes the strip too
 * — #2390's scoreless result is why `<MatchStripView>`'s `Score` and
 * `<TeamAgendaRow>` both gained a waiting state (`RESULT_PENDING_GLYPH` /
 * `RESULT_PENDING_WORD`, #2587) for it.
 *
 * NB: this no longer mirrors `TeamMatchesSection`'s split — that surface still
 * filters `status === "finished" && date < now`, so #2423 is live there too,
 * as is #2390. It is on the issue's out-of-scope sibling list; do not treat it
 * as the reference implementation.
 */
import type { Match } from "@/lib/effect/schemas";
import type { ScheduleRow } from "@/components/match/types";
import { transformMatchToSchedule } from "@/components/match/transform";
import {
  hasScore,
  isSettledMatch,
  matchRowKind,
} from "@/lib/utils/match-display";
import { RESERVEN_PSD_ID } from "@/lib/utils/group-teams";

export interface FirstTeamInput {
  /** Display label, e.g. "A-ploeg" — from `teamDisplayName`, never re-derived here. */
  label: string;
  /** Team slug, e.g. "a-ploeg" (drives the team-matches deep link). */
  slug: string;
  /** Division label, e.g. "3de Nationale". */
  division?: string;
}

export interface FirstTeamVM extends FirstTeamInput {
  /**
   * Most recent played match — rendered as a cream `<TeamAgendaRow>`. Can be
   * a pitch-reservation placeholder (#2688); `<TeamAgendaRow>` already
   * branches on `.kind` for the reduced treatment.
   */
  result?: ScheduleRow;
  /** Next scheduled fixture — rendered as the featured jersey-deep `<TeamAgendaRow>`. Can also be a placeholder — see `result`. */
  fixture?: ScheduleRow;
}

/** The fields senior-team selection reads — structural, so both call sites fit. */
export interface SeniorTeamCandidate {
  psdId: string | null;
  age: string | null;
  slug: string;
}

/**
 * First teams (A/B) that carry a `psdId`, sorted by slug so
 * `eerste-elftallen-a` precedes `-b`. Shared by the homepage's
 * `<FirstTeamsBlock>` wiring and the landing strip's first-team lookup — the
 * two used to hold identical copies of this filter and could drift apart.
 *
 * Youth teams drop out on their `U*` age; Reserven needs a test of its own
 * because its Sanity `age` is the senior code "A", so the age filter passes it
 * through. It only surfaced here once #2414 flipped its `showInNavigation` on
 * and the teams query stopped dropping it upstream. `groupTeamsForLanding`
 * keeps it out of `/ploegen`'s A/B slots the same way, on the name suffix.
 */
export function selectSeniorTeams<T extends SeniorTeamCandidate>(
  teams: readonly T[],
): T[] {
  return teams
    .filter(
      (t) =>
        t.psdId &&
        t.psdId !== RESERVEN_PSD_ID &&
        !(t.age ?? "").toUpperCase().startsWith("U"),
    )
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * How far ahead of kickoff a settled match may be dated and still headline as
 * the last result. A forfeit is awarded in the days before a tie, so it has to
 * be reachable before kickoff; but Belgian amateur football also stamps a
 * `forfait général` on *every* remaining fixture at once when a club withdraws,
 * and a 5-0 awarded five months out is not "the last result" — it is a future
 * fixture that happens to carry a score. Beyond this window the genuinely most
 * recent result keeps the slot.
 */
export const SETTLED_LOOKAHEAD_MS = 72 * 60 * 60 * 1000;

/**
 * Which of the block's two slots a match may occupy — `null` for one that
 * belongs in neither. The single place that decides, so a match cannot land in
 * both slots or fall out of both; every caller reads the answer, none re-derives
 * it.
 *
 * Takes the whole match rather than its status because `scheduled` alone does
 * not settle the question. Past its kickoff, a still-`scheduled` match has been
 * played and is waiting on PSD to publish the score, which is a result — see
 * that branch. The other statuses are decided on status alone.
 *
 * Exhaustive over `MatchStatus`: a new member is a compile error here rather
 * than a match that silently disappears from both slots, which is exactly how
 * `forfeited` / `postponed` / `cancelled` went missing (#2423). The settled set
 * is not re-listed — it comes from the shared `isSettledMatch`, the same
 * predicate `hasScore` and `<TeamAgendaRow>`'s outcome tint derive from.
 *
 * `postponed`, `cancelled` and `stopped` are deliberately in neither slot. Both
 * slots answer "what happened" and "where do I go next"; a match that will not
 * be played as scheduled answers neither, and a rescheduled one returns to the
 * feed as `scheduled` at its new date. `stopped` is here for that same reason —
 * an abandoned match's partial scoreline is not a result, and publishing it
 * would headline a score that never counted. The team agenda
 * (`/ploegen/<slug>/wedstrijden`) remains the place that lists every match.
 *
 * Returns `null` — rather than throwing — on the impossible branch: this runs
 * inside a `filter` on the homepage's render path, outside any error boundary
 * (`app/(landing)/(home)/page.tsx` only wraps the *fetch* in `catchAll`). Dropping one
 * match from a chrome block is a better failure than a 500 on the homepage.
 * The `never` assignment keeps the compile-time guarantee either way.
 */
function matchSlot(match: Match, now: Date): "result" | "fixture" | null {
  // A reservation carries no result vocabulary at all (#2606) — it must
  // never headline the result slot, on any status or any date. Without this
  // guard a past-dated (but still `scheduled`) reservation fell through to
  // the `date < now` check below and headlined the homepage's "Laatste
  // uitslag" column reading "UITSLAG · TORNOOI · 09:30". `postponed` /
  // `cancelled` / `stopped` join the "answers neither what-happened nor
  // where-do-I-go-next" rule the switch below already applies to a real
  // match in the same statuses.
  //
  // Widened to the shared `matchRowKind` discriminant, not merely
  // `is_placeholder` (#2802 review): a tournament fixture with no scoreline
  // yet (`kind === "reduced"`) is reduced too, and the same contradiction it
  // exists to prevent — "UITSLAG" over a row with no result — reappears for
  // it if this stays placeholder-only. `reservationRowLabel` already refuses
  // that exact pairing in the accessible name; this is the sighted half of
  // the same rule.
  if (matchRowKind(match) !== "match") {
    return match.status === "scheduled" ? "fixture" : null;
  }
  if (isSettledMatch(match.status)) return "result";
  switch (match.status) {
    case "scheduled":
      // Kicked off, score not yet published: PSD leaves a match `scheduled`
      // until staff enter the result, so between kickoff and publication it is
      // a played match wearing an upcoming status (#2390). It headlines the
      // result slot scoreless — `<TeamAgendaRow>` says "Uitslag volgt" (#2587)
      // — rather than staying in the fixture slot, where it would read as
      // future-tense hours after kickoff and hide the genuinely next match.
      //
      // The BFF sees the same window from the other side: `teamMatchesTtl`
      // (`apps/api/src/handlers/matches.ts`) drops the team-matches cache to
      // the matchday TTL while a match is in it, which is what makes this slot
      // heal quickly once the score lands. Deliberately mirrored in prose, not
      // shared: separate deployables, and `@kcvv/api-contract` carries schemas,
      // not status predicates — the same split `isSettledMatch` documents. They
      // differ on purpose too, in that the BFF stops widening at 48 h to bound
      // a polling cost while nothing here expires: a played match keeps the
      // slot until a newer one displaces it, which beats falling back to a
      // fortnight-old result as though last Saturday never happened.
      return match.date.getTime() < now.getTime() ? "result" : "fixture";
    case "postponed":
    case "cancelled":
    case "stopped":
      return null;
    default: {
      const _exhaustive: never = match.status;
      void _exhaustive;
      return null;
    }
  }
}

/**
 * Most recent result. A settled match qualifies once its kickoff has passed, or
 * as soon as it carries a scoreline — a forfeit is awarded in advance, so
 * `date < now` alone would hide it right up to a kickoff that never happens
 * (#2423). Two bounds keep that from swallowing the slot: without a scoreline a
 * future-dated match stays out (nothing is settled to headline yet), and beyond
 * `SETTLED_LOOKAHEAD_MS` it stays out too.
 *
 * A kicked-off match awaiting its score arrives here already routed by
 * `matchSlot`, past-dated, so the first bound admits it; the shared date sort
 * then decides between them, and a result published since kickoff outranks it
 * as soon as it lands.
 */
export function pickLastResult(
  matches: readonly Match[],
  now: Date,
): Match | undefined {
  return matches
    .filter((m) => {
      if (matchSlot(m, now) !== "result") return false;
      const untilKickoff = m.date.getTime() - now.getTime();
      if (untilKickoff < 0) return true;
      return untilKickoff <= SETTLED_LOOKAHEAD_MS && hasScore(m);
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
}

/**
 * Earliest upcoming fixture. No date test of its own: `matchSlot` only returns
 * `"fixture"` for a match whose kickoff is still ahead, so re-checking here
 * would be a second, drift-prone copy of that rule.
 */
export function pickNextFixture(
  matches: readonly Match[],
  now: Date,
): Match | undefined {
  return matches
    .filter((m) => matchSlot(m, now) === "fixture")
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
}

/**
 * Build the view-model for one senior team. Always returns the team identity;
 * `result` / `fixture` are present only when a match exists for that side.
 */
export function deriveFirstTeamVM(
  team: FirstTeamInput,
  matches: readonly Match[],
  now: Date,
): FirstTeamVM {
  const result = pickLastResult(matches, now);
  const fixture = pickNextFixture(matches, now);
  return {
    ...team,
    ...(result ? { result: transformMatchToSchedule(result) } : {}),
    ...(fixture ? { fixture: transformMatchToSchedule(fixture) } : {}),
  };
}

/** How far ahead a fixture may sit and still be called "this weekend". */
const WEEKEND_LOOKAHEAD_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Heading above the "Eerste ploegen" block. "Dit weekend." is a claim about the
 * *day*, so it needs both tests: the soonest fixture must fall inside the coming
 * week (otherwise pre-season, with the next match weeks out, reads oddly) *and*
 * land on a Saturday or Sunday. Gating on the window alone announced a Wednesday
 * cup tie as a weekend fixture (#2392).
 *
 * The weekday is read off UTC, deliberately un-zoned. The BFF encodes the
 * Belgian kickoff wall-clock straight into the Date's UTC fields
 * (`parseDateString`, `apps/api/src/psd/transforms.ts`), so re-zoning to
 * Europe/Brussels would add a phantom offset and roll a ≥22:00 Sunday kickoff
 * into Monday. `/scheurkalender` reads the calendar day the same way.
 */
export function firstTeamsHeading(
  teams: readonly FirstTeamVM[],
  now: Date,
): string {
  const soonest = Math.min(
    ...teams.map((t) => t.fixture?.date.getTime() ?? Number.POSITIVE_INFINITY),
  );
  // No fixture ⇒ Infinity ⇒ fails this test, so no separate empty guard.
  if (soonest - now.getTime() > WEEKEND_LOOKAHEAD_MS)
    return "Volgende wedstrijd.";

  const weekday = new Date(soonest).getUTCDay(); // 0 = Sunday, 6 = Saturday
  return weekday === 0 || weekday === 6
    ? "Dit weekend."
    : "Volgende wedstrijd.";
}
