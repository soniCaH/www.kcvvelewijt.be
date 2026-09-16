/**
 * Pure view-model derivation for `/tegenstander/[clubId]` (#2463).
 *
 * Reduces each flagship senior squad's own, unreduced `OpponentHistory` read
 * into the page's per-squad section shape. Kept free of Effect/React so it
 * can be unit-tested in isolation — same rationale as `first-teams.ts`
 * (`src/components/home/FirstTeamsBlock/first-teams.ts`), which this module
 * mirrors: the page's `fetchOpponentData` stays thin Effect plumbing (fan
 * out to the BFF, one read per squad from `selectSeniorTeams`) and hands the
 * raw per-squad reads here to turn into sections.
 *
 * The five `reduce` calls this ticket removes (wins/draws/losses/goalsFor/
 * goalsAgainst summed across squads) have no replacement here — each
 * section renders its own squad's BFF-computed `summary` straight through,
 * per the Effect & Server Component rule in `apps/web/CLAUDE.md`: "The BFF
 * owns all aggregated and derived values ... never re-derive them in a
 * Server Component."
 */
import type { Match, OpponentHistory } from "@kcvv/api-contract";

/**
 * The team fields needed to identify a squad and label its section.
 * `psdId` is required (a `string`, never `null`) because every caller has
 * already passed the team through `selectSeniorTeams`, which only admits
 * teams carrying one. `squadLabel` is the canonical display name
 * (`teamDisplayName`, e.g. "A-ploeg" / "B-ploeg") — already resolved by
 * `TeamRepository.findAll()`'s `toTeamNavVM` at the repository boundary, so
 * it is taken as-is here rather than re-derived a second time.
 */
export interface OpponentSquadTeam {
  psdId: string;
  squadLabel: string;
}

/** One squad's raw BFF read. `history` is `null` on a 404 — this squad has
 *  never met the opponent, which is not the same as an empty section. */
export interface SquadHistoryResult {
  team: OpponentSquadTeam;
  history: OpponentHistory | null;
}

/**
 * One flagship senior squad's own, unreduced head-to-head record — one
 * section, one heading, one summary card, one season-grouped list. No field
 * here is ever computed across more than one squad.
 */
export interface SquadOpponentSection {
  /** PSD team id — a stable per-squad React key, never rendered. */
  teamPsdId: number;
  /** Canonical display name (`teamDisplayName`), e.g. "A-ploeg" / "B-ploeg". */
  squadLabel: string;
  /** This squad's own BFF-computed summary — never summed with another's. */
  summary: OpponentHistory["summary"];
  /** This squad's own matches against the opponent, sorted newest-first. */
  matches: Match[];
}

export interface OpponentPageData {
  opponentName: string;
  opponentLogo?: string;
  /** A-ploeg first, then B-ploeg — the order `selectSeniorTeams` already
   *  guarantees by sorting its input on slug before this module ever sees it. */
  sections: SquadOpponentSection[];
}

function sortMatchesDescending(matches: readonly Match[]): Match[] {
  return [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/**
 * Reduce every senior squad's raw BFF read into the page's per-squad section
 * shape, or `null` when no squad has any history against this opponent —
 * the route's `notFound()` case, unchanged from before this ticket. A squad
 * whose read 404'd (`history: null`) or came back with zero matches
 * contributes no section at all, never an empty one (#2463 rule).
 */
export function buildOpponentPageData(
  clubId: number,
  results: readonly SquadHistoryResult[],
): OpponentPageData | null {
  const sections: SquadOpponentSection[] = results
    .filter(
      (r): r is SquadHistoryResult & { history: OpponentHistory } =>
        r.history != null && r.history.matches.length > 0,
    )
    .map((r) => ({
      teamPsdId: parseInt(r.team.psdId, 10),
      squadLabel: r.team.squadLabel,
      summary: r.history.summary,
      matches: sortMatchesDescending(r.history.matches),
    }));

  if (sections.length === 0) return null;

  // Opponent identity (name/logo) is shared by the hero across every squad
  // section — derived from the single most recent match of ANY squad, same
  // "newest logo/name wins" rule the single-card version used.
  const newestMatch = sortMatchesDescending(
    sections.flatMap((s) => s.matches),
  )[0];
  const opponentTeam = newestMatch
    ? newestMatch.home_team.id === clubId
      ? newestMatch.home_team
      : newestMatch.away_team
    : null;
  const fallback = results.find((r) => r.history != null)!.history!;

  return {
    opponentName: opponentTeam?.name ?? fallback.opponent.name,
    opponentLogo: opponentTeam?.logo ?? fallback.opponent.logo,
    sections,
  };
}

/** `"N wedstrijden"`, singular at one — per squad, never a page-wide total. */
export function matchCountLabel(matchCount: number): string {
  return `${matchCount} ${matchCount === 1 ? "wedstrijd" : "wedstrijden"}`;
}
