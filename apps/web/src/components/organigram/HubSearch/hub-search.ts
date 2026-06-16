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
 * Rank responsibility paths against a query across question (highest), summary,
 * and keywords, plus a per-word pass (words < 3 chars skipped). Returns the top
 * `maxResults` by descending score.
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

/**
 * Unified KEYWORD hub search: ranks people and answers independently, then
 * interleaves them. `maxResults` caps each category. Used as the graceful
 * fallback when the semantic endpoint is unavailable (#2057); the answer lane is
 * otherwise semantic.
 */
export function searchHub(
  query: string,
  members: OrgChartNode[],
  paths: ResponsibilityPath[],
  maxResults: number,
): HubSearchResult[] {
  return interleaveResults(
    searchMembers(query, members, maxResults),
    searchResponsibilities(query, paths, maxResults),
  );
}
