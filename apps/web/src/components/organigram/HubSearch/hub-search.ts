/**
 * Hub search — shared keyword ranking for the unified `/hulp` hub search.
 *
 * Ports the keyword/substring ranking that previously lived privately inside
 * `<UnifiedSearchBar>` into a pure, testable module so it can be shared by the
 * hero search and the sticky-nav search (both `<HubSearch>` instances) and,
 * later, augmented by semantic search (Phase 6, #2057). People-search stays
 * keyword/structured; only the question intent gets the semantic upgrade.
 *
 * This ranking originated inside the former
 * `components/organigram/shared/UnifiedSearchBar.tsx`; that legacy tree was
 * retired in Phase 9 cleanup (#1531), so this pure module is now its sole home.
 */

import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";

/**
 * Which fields matched (e.g. "Naam", "Functie", "Vraag"). Retained match-reason
 * metadata: the redesigned `<HubSearch>` dropdown intentionally dropped the
 * per-result match chips, so this is not rendered today — it is kept as the
 * ranking contract (asserted in unit tests) and a hook for a future "waarom dit
 * matcht" affordance / semantic-merge debugging (#2057).
 */
type MatchedFields = string[];

export interface HubMemberResult {
  type: "member";
  member: OrgChartNode;
  score: number;
  matchedFields: MatchedFields;
  /**
   * How many *other* positions the same person holds among the matches. When a
   * person primarily holds several positions, their rows are consolidated into
   * one (their best-scoring position is the representative) and this is the count
   * of the rest — driving a "+N functies" hint. 0 for a single-position person
   * or a position-only/vacant match (no primary holder to consolidate by).
   */
  extraPositions: number;
}

export interface HubResponsibilityResult {
  type: "responsibility";
  path: ResponsibilityPath;
  score: number;
  matchedFields: MatchedFields;
}

export type HubSearchResult = HubMemberResult | HubResponsibilityResult;

/**
 * Rank organigram nodes against a query across name (highest), title, roleCode,
 * email, and department. Returns the top `maxResults` by descending score.
 */
export function searchMembers(
  query: string,
  members: OrgChartNode[],
  maxResults: number,
): HubMemberResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results: HubMemberResult[] = [];

  for (const member of members) {
    let score = 0;
    const matchedFields: string[] = [];

    // Name match (highest priority — primary member only)
    if (member.members[0]?.name?.toLowerCase().includes(lowerQuery)) {
      score += 50;
      matchedFields.push("Naam");
    }

    // Title match
    if (member.title.toLowerCase().includes(lowerQuery)) {
      score += 30;
      matchedFields.push("Functie");
    }

    // Role code match
    if (member.roleCode?.toLowerCase().includes(lowerQuery)) {
      score += 20;
      matchedFields.push("Positie");
    }

    // Email match
    if (member.members[0]?.email?.toLowerCase().includes(lowerQuery)) {
      score += 15;
      matchedFields.push("Email");
    }

    // Department match
    if (member.department?.toLowerCase().includes(lowerQuery)) {
      score += 10;
      matchedFields.push("Afdeling");
    }

    if (score > 0) {
      results.push({
        type: "member",
        member,
        score,
        matchedFields,
        extraPositions: 0,
      });
    }
  }

  // Consolidate before capping: a person who primarily holds several positions
  // would otherwise return one row per position (e.g. searching a name surfaces
  // them 3×). De-duping here, not after the slice, keeps the cap honest.
  return dedupeMembersByPerson(results)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Collapse multiple position-rows for the same person into a single result,
 * keeping their highest-scoring position as the representative and counting the
 * rest into `extraPositions`. Position-only matches (vacant nodes, or title /
 * role / department hits with no primary holder) have no person to key on and
 * pass through untouched.
 */
export function dedupeMembersByPerson(
  results: HubMemberResult[],
): HubMemberResult[] {
  const byPerson = new Map<string, HubMemberResult>();
  const passthrough: HubMemberResult[] = [];

  for (const result of results) {
    const personId = result.member.members[0]?.id;
    if (personId === undefined) {
      passthrough.push(result);
      continue;
    }

    const existing = byPerson.get(personId);
    if (existing === undefined) {
      byPerson.set(personId, result);
      continue;
    }

    // Keep the higher-scoring position as the representative; either way the
    // person now has one more position folded in.
    const representative = result.score > existing.score ? result : existing;
    byPerson.set(personId, {
      ...representative,
      extraPositions: existing.extraPositions + 1,
    });
  }

  return [...byPerson.values(), ...passthrough];
}

/**
 * Rank responsibility paths against a query across question (highest), title,
 * summary and keywords, plus a per-word pass (words < 3 chars skipped). Returns
 * the top `maxResults` by descending score.
 */
export function searchResponsibilities(
  query: string,
  paths: ResponsibilityPath[],
  maxResults: number,
): HubResponsibilityResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length > 0);
  const results: HubResponsibilityResult[] = [];

  for (const path of paths) {
    let score = 0;
    const matchedFields: string[] = [];

    // Question match (highest priority)
    if (path.question.toLowerCase().includes(lowerQuery)) {
      score += 50;
      matchedFields.push("Vraag");
    }

    // Title match — the editor's short name for the path (#3092)
    if (path.title.toLowerCase().includes(lowerQuery)) {
      score += 40;
      matchedFields.push("Titel");
    }

    // Summary match
    if (path.summary.toLowerCase().includes(lowerQuery)) {
      score += 30;
      matchedFields.push("Samenvatting");
    }

    // Keyword match
    const matchedKeywords = path.keywords.filter((keyword) =>
      keyword.toLowerCase().includes(lowerQuery),
    );
    if (matchedKeywords.length > 0) {
      score += matchedKeywords.length * 20;
      matchedFields.push("Trefwoorden");
    }

    // Word-by-word matching (skip short stop-words)
    for (const word of queryWords) {
      if (word.length < 3) continue;
      if (path.question.toLowerCase().includes(word)) score += 5;
      if (path.summary.toLowerCase().includes(word)) score += 3;
    }

    if (score > 0) {
      results.push({ type: "responsibility", path, score, matchedFields });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/** A literal hit at or above this score is a STRONG one (see below). */
const STRONG_LITERAL_MIN = 10;
const MIN_LITERAL_LENGTH = 3;

/** NFC + lowercase, so a pasted decomposed "ë" still matches a typed one. */
function fold(text: string): string {
  return text.normalize("NFC").toLowerCase();
}

/**
 * `fold`ed, every run of non-letters collapsed to one space, padded with a
 * space either side — so `includes(" ziek ")` matches whole words only. (`\b`
 * is ASCII-only in JS and would split "allergieën".)
 */
function asWords(text: string): string {
  return ` ${fold(text)
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim()} `;
}

/**
 * Answers the query names LITERALLY (#3092). The semantic lane ranks by
 * meaning, and one keyword among a dozen weighs little in a document's
 * embedding — so a word an editor wrote into a path could miss it entirely
 * ("verhinderd", "niet komen" on the afmelden path, measured 2026-09-21).
 *
 * - **Strong** — the whole query sits inside the path's title (30) or one of
 *   its keywords (20). These lead the answer lane.
 * - **Weak** (score 1) — one of the path's keywords sits in the query as a
 *   whole word: "ziek" in "mijn zoon is ziek". Always listed; the semantic
 *   rank decides where (see `mergeAnswers`).
 *
 * Only the title and the keywords are an editor's search terms. The question
 * and the summary are sentences: "hoe", "wil" or "mijn kind" sit in nearly
 * every one of them, and matching there would flood the lane.
 */
export function findLiteralAnswers(
  query: string,
  paths: ResponsibilityPath[],
  maxResults: number,
): HubResponsibilityResult[] {
  const needle = fold(query.trim());
  if (needle.length < MIN_LITERAL_LENGTH) return [];
  const queryWords = asWords(needle);

  const results: HubResponsibilityResult[] = [];
  for (const path of paths) {
    const keywords = path.keywords.map(fold);
    if (fold(path.title).includes(needle)) {
      results.push({
        type: "responsibility",
        path,
        score: 30,
        matchedFields: ["Titel"],
      });
    } else if (keywords.some((k) => k.includes(needle))) {
      results.push({
        type: "responsibility",
        path,
        score: 20,
        matchedFields: ["Trefwoorden"],
      });
    } else if (
      keywords.some(
        (k) =>
          k.length >= MIN_LITERAL_LENGTH && queryWords.includes(asWords(k)),
      )
    ) {
      results.push({
        type: "responsibility",
        path,
        score: 1,
        matchedFields: ["Trefwoorden"],
      });
    }
  }
  // `sort` is stable, so equal scores keep the paths' own order.
  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/**
 * One answer lane from the literal and the semantic hits (#3092):
 *
 * 1. Strong literal hits first. Several of them are ordered by their semantic
 *    score, so "blessure" keeps the accident path above the afmelden path when
 *    both carry that keyword. A path the semantic lane did not return sorts
 *    below one it did.
 * 2. Then the semantic hits, in semantic order.
 * 3. Then weak literal hits the semantic lane left out.
 *
 * Each path appears once, as its literal hit when it has one. At the cap, the
 * last plain semantic hits give way, so a literal hit is never cut.
 */
export function mergeAnswers(
  literal: HubResponsibilityResult[],
  semantic: HubResponsibilityResult[],
  maxResults: number,
): HubResponsibilityResult[] {
  const semanticScore = new Map(semantic.map((r) => [r.path.id, r.score]));
  const literalById = new Map(literal.map((r) => [r.path.id, r]));

  const strong = literal
    .filter((r) => r.score >= STRONG_LITERAL_MIN)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (semanticScore.get(b.path.id) ?? -1) -
          (semanticScore.get(a.path.id) ?? -1),
    );
  const placed = new Set(strong.map((r) => r.path.id));
  const middle = semantic
    .filter((r) => !placed.has(r.path.id))
    .map((r) => literalById.get(r.path.id) ?? r);
  middle.forEach((r) => placed.add(r.path.id));
  const tail = literal.filter((r) => !placed.has(r.path.id));

  const lane = [...strong, ...middle, ...tail];
  for (let i = lane.length - 1; lane.length > maxResults && i >= 0; i--) {
    if (!literalById.has(lane[i].path.id)) lane.splice(i, 1);
  }
  return lane.slice(0, maxResults);
}

/**
 * Map semantic-search hits (slug + cosine score) back to full
 * `ResponsibilityPath`s for the answer lane (#2057). Matches by slug first
 * (the responsibility index keys vectors by slug) then id, dropping hits whose
 * path isn't in the supplied set. Score is the cosine similarity (0–1) — unlike
 * the additive keyword scores — so callers must not compare the two scales.
 */
export function mapSemanticResults(
  results: ReadonlyArray<{ id: string; slug: string; score: number }>,
  pathById: Map<string, ResponsibilityPath>,
): HubResponsibilityResult[] {
  const out: HubResponsibilityResult[] = [];
  for (const result of results) {
    const path = pathById.get(result.slug) ?? pathById.get(result.id);
    if (path) {
      out.push({
        type: "responsibility",
        path,
        score: result.score,
        matchedFields: [],
      });
    }
  }
  return out;
}

/**
 * Interleave people and answers (person, answer, person, answer …) so both
 * intents surface together in a single dropdown.
 */
export function interleaveResults(
  memberResults: HubMemberResult[],
  responsibilityResults: HubResponsibilityResult[],
): HubSearchResult[] {
  const combined: HubSearchResult[] = [];
  const maxLength = Math.max(
    memberResults.length,
    responsibilityResults.length,
  );

  for (let i = 0; i < maxLength; i++) {
    if (i < memberResults.length) combined.push(memberResults[i]);
    if (i < responsibilityResults.length) {
      combined.push(responsibilityResults[i]);
    }
  }

  return combined;
}
