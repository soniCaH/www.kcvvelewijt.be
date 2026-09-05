import type { Match, RankingEntry, RankingTable } from "@kcvv/api-contract";

/**
 * The competitive half of a team page — `#klassement` + `#wedstrijden` — as
 * one state, keyed to the data rather than to the section, the age group, or
 * history (#2540/#2636). Six reachable states plus a seventh degenerate input
 * (no fetch result at all — a team with no PSD id):
 *
 * - **`not-in-competition`** — the club has no official fixture for this team
 *   this season. Both sections stay off the page; the caller renders a single
 *   status line instead (`CompetitiveStatusLine`).
 * - **`fixtures-unavailable`** — the *fixtures* read failed *permanently* (a
 *   stale/mistyped `psdId`, or a response this deploy can no longer decode)
 *   rather than transiently. Not the same failure as #2540 state 4: a
 *   transient failure never reaches this function at all — `page.tsx` lets
 *   that promise reject so the render throws and ISR serves the last-good
 *   page. A permanent one never *has* a last-good page to fall back to
 *   (every render fails the same way), so it is caught and degrades to this
 *   state instead, rather than taking the whole page down forever (#2636
 *   finding 3). Without fixtures there is genuinely no way to tell whether
 *   the team has a league at all (`isInCompetition` reads the fixtures), so
 *   both sections stay off the page — the same collapse as
 *   `not-in-competition`, just for a different reason.
 * - **`ranking-unavailable`** — the *ranking* read failed permanently while
 *   the fixtures read fulfilled (#2795). Unlike `fixtures-unavailable`, the
 *   fixtures are in hand and prove the team IS in competition, so
 *   `#wedstrijden` still renders in full — only the klassement slot reports
 *   the failure, via `<EmptyState tier="slot" reason="unavailable">` in
 *   place of `<StandingsSection>`. Distinct from `no-table` (a *value* — the
 *   association genuinely has not published a row yet): `no-table` means
 *   `standings` resolved to `[]`, `ranking-unavailable` means the ranking
 *   read never resolved to a value at all. Conflating the two would call a
 *   broken read "not published yet," which is false.
 * - **`no-table`** — in competition, but the association has not published a
 *   row yet.
 * - **`numberless`** — in competition, and every published entry reads
 *   `played === 0 && points === 0` (before matchday 1, or a reeks PSD never
 *   scores).
 * - **`live`** — at least one published table carries real numbers. This is a
 *   *block-level* verdict for the nav chip's label only (#2605: "Klassement"
 *   only when there are points on the page at all) — it does **not** mean
 *   every table is individually live. A youth side past the winter break can
 *   have a scored autumn poule next to an unplayed spring one; `<StandingsSection>`
 *   re-derives each table's own numberless/live render straight from its
 *   `tables` prop via `isNumberlessTable` (#2636 finding 9), independent of
 *   this block-level verdict.
 *
 * None of these states carry the tables themselves — `<StandingsSection>` is
 * the one place that reads `RankingTable[]` and classifies it, from the
 * `standings` prop `page.tsx` already has in hand. Carrying a second,
 * separately-filtered copy on the state value invited exactly what it caused
 * (#2636 finding 3): two classifications of the same data computed from two
 * different inputs, agreeing only by accident.
 */
export type CompetitiveBlockState =
  | { readonly kind: "not-in-competition" }
  | { readonly kind: "fixtures-unavailable" }
  | { readonly kind: "ranking-unavailable" }
  | { readonly kind: "no-table" }
  | { readonly kind: "numberless" }
  | { readonly kind: "live" };

/**
 * What `fetchBffData` resolves to when it resolves — never the rejection.
 * `standings` is nullable: `null` means the ranking read failed
 * *permanently* (#2795) while the fixtures read fulfilled — a value this
 * function reads into `ranking-unavailable`, never `no-table`. A genuine
 * "no table published yet" is the *value* `[]`, not `null`.
 */
export interface CompetitiveFetchResult {
  readonly matches: readonly Match[];
  readonly standings: readonly RankingTable[] | null;
}

/**
 * The gate (#2636 AC 2): at least one `OFFICIAL` fixture in the current
 * provider season — never `standings.length > 0` (the ranking arrives
 * *after* the fixtures, so it reads zero rows for months on a team that is
 * plainly in competition) and never `division` (that field is the phase's
 * association code, set on 3 of 26 docs, and says nothing about whether a
 * team has a league at all).
 *
 * `Match.competitionType === "league"` **is** that OFFICIAL check, not a
 * looser league/cup/friendly grouping standing in for it. PSD's raw
 * `competitionType.type` carries `"OFFICIAL"` for league play; the BFF's
 * `resolveCompetitionType` (`apps/api/src/psd/transforms.ts`) maps exactly
 * `OFFICIAL`/`LEAGUE` → `"league"`, `CUP`/`FRIENDLY`/`TOURNAMENT` → their own
 * members, anything else → `"other"` — there is no separate "OFFICIAL" flag
 * anywhere else in the contract. #2636's own amendment confirms the same
 * boundary from the PSD side: "A fixture's OFFICIAL lives at
 * `competitionType.type`." A tournament- or friendly-only feed (the historical
 * U9 case #2540's resolution names outright) is deliberately `not-in-
 * competition` under this gate — that is the decision this ticket implements,
 * not a bug in how it is read.
 */
function isInCompetition(matches: readonly Match[]): boolean {
  return matches.some((match) => match.competitionType === "league");
}

/**
 * Every entry reads `played === 0 && points === 0` — before matchday 1, or a
 * reeks PSD never scores (#2605 decision 3). Takes `entries` directly (not a
 * `RankingTable`) so `<StandingsTable>` can call it on the exact prop it
 * already renders from, deriving its own numberless/live register instead of
 * trusting a caller-supplied `numberless` boolean that the data could
 * contradict (#2636 finding 9).
 */
export function isNumberlessTable(entries: readonly RankingEntry[]): boolean {
  return entries.every((entry) => entry.played === 0 && entry.points === 0);
}

/**
 * Classifies `#klassement`'s tables as a whole, independent of the fixture
 * gate above. Shared between `deriveCompetitiveBlockState` (the page-level
 * gate, for the nav chip's label) and `<StandingsSection>` (which renders
 * whenever the gate is open, and needs the same three-way read of its own
 * `tables` prop to decide whether it has any table to show at all) so that
 * predicate has exactly one owner.
 */
export function classifyStandingsTables(
  tables: readonly RankingTable[],
): "no-table" | "numberless" | "live" {
  const tablesWithRows = tables.filter((table) => table.entries.length > 0);
  if (tablesWithRows.length === 0) return "no-table";
  if (tablesWithRows.every((table) => isNumberlessTable(table.entries))) {
    return "numberless";
  }
  return "live";
}

/**
 * The pure exported function #2636 AC 1 asks for: takes the (successful)
 * fetch result and returns the competitive block's state, reachable without
 * rendering anything. Replaces the `showStandings` / `showMatches` flags that
 * used to be derived inline in `page.tsx`.
 *
 * `fetchResult` is `null` when the team carries no usable PSD id — not a
 * fetch failure, a deliberate skip, so it fails closed to
 * `not-in-competition` rather than throwing. It is the string `"unavailable"`
 * when `fetchBffData` caught a *permanent* failure on the **fixtures** read
 * (see the `fixtures-unavailable` member of `CompetitiveBlockState` above) —
 * a transient failure is never passed here at all, because `page.tsx` lets
 * that one reject the render. A permanent failure on the **ranking** read
 * alone does not use this sentinel: `fetchBffData` still resolves with the
 * fixtures it has plus `standings: null` (#2795), which this function reads
 * into `ranking-unavailable` below — never conflated with `no-table`, whose
 * `standings` is the fulfilled value `[]`.
 */
export function deriveCompetitiveBlockState(
  fetchResult: CompetitiveFetchResult | null | "unavailable",
): CompetitiveBlockState {
  if (fetchResult === "unavailable") return { kind: "fixtures-unavailable" };
  if (fetchResult === null) return { kind: "not-in-competition" };
  if (!isInCompetition(fetchResult.matches)) {
    return { kind: "not-in-competition" };
  }
  if (fetchResult.standings === null) return { kind: "ranking-unavailable" };
  return { kind: classifyStandingsTables(fetchResult.standings) };
}

/**
 * `#klassement`'s heading follows the data (#2605 decision): `"Klassement"`
 * only when the table carries real points, `"De reeks"` when it is in
 * competition but has none yet, and no label (`null`) at all when the block
 * doesn't render a `#klassement` nav entry in the first place — which now
 * includes `ranking-unavailable` (#2795): the failure notice that replaces
 * `<StandingsSection>` there is not a section, so it earns no nav chip
 * either, the same rule `fixtures-unavailable`/`not-in-competition` already
 * followed. Used for both the sticky nav's chip label today and the
 * section's own `<h2>` once #2637 adds one — one word, one owner, so the nav
 * chip and the heading can never read differently for the same page.
 *
 * Takes the full `CompetitiveBlockState` (not a narrowed `Exclude<>`) and
 * switches on every member so a state added later fails to compile here
 * instead of compiling silently against a hand-written exclusion that no
 * longer matches the union.
 */
export function competitiveBlockHeadingLabel(
  state: CompetitiveBlockState,
): string | null {
  switch (state.kind) {
    case "not-in-competition":
    case "fixtures-unavailable":
    case "ranking-unavailable":
      return null;
    case "live":
      return "Klassement";
    case "no-table":
    case "numberless":
      return "De reeks";
    default: {
      const _exhaustive: never = state;
      throw new Error(
        `competitiveBlockHeadingLabel: unhandled state ${JSON.stringify(_exhaustive)}`,
      );
    }
  }
}

/**
 * Whether the competitive block is "open" at all — i.e. whether `#wedstrijden`
 * (and, separately, `#klassement` when `competitiveBlockHeadingLabel` returns
 * non-null) should render, as opposed to the single-line collapse
 * (`<CompetitiveStatusLine>`) that replaces both sections.
 *
 * This is **not** `competitiveBlockHeadingLabel(state) !== null` (#2795):
 * `ranking-unavailable` returns `null` from that function — the klassement
 * slot earns no heading/nav-chip — but the fixtures still fulfilled, so
 * `#wedstrijden` must still render in full. Deriving `inCompetition` from
 * the label would silently re-collapse the fixtures every time the ranking
 * read fails, which is the exact bug #2795 fixes. A page must call this
 * function for that gate rather than hand-writing the exclusion at the call
 * site — #2636 finding 5 rejected that shape, and a state added later would
 * silently fall out of sync with a hand-written list the same way.
 *
 * Switches on every member, mirroring `competitiveBlockHeadingLabel`, so a
 * state added later fails to compile here instead of defaulting silently.
 */
export function isCompetitiveBlockOpen(state: CompetitiveBlockState): boolean {
  switch (state.kind) {
    case "not-in-competition":
    case "fixtures-unavailable":
      return false;
    case "ranking-unavailable":
    case "no-table":
    case "numberless":
    case "live":
      return true;
    default: {
      const _exhaustive: never = state;
      throw new Error(
        `isCompetitiveBlockOpen: unhandled state ${JSON.stringify(_exhaustive)}`,
      );
    }
  }
}
