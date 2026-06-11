/**
 * Hub search — shared keyword ranking for the unified `/hulp` hub search.
 *
 * Ports the keyword/substring ranking that previously lived privately inside
 * `<UnifiedSearchBar>` into a pure, testable module so it can be shared by the
 * hero search and the sticky-nav search (both `<HubSearch>` instances) and,
 * later, augmented by semantic search (Phase 6, #2057). People-search stays
 * keyword/structured; only the question intent gets the semantic upgrade.
 *
 * FUTURE: this is a deliberate copy of the still-live private ranking in
 * `components/organigram/shared/UnifiedSearchBar.tsx` (kept while its legacy
 * consumers exist). When that tree is retired (#2056 / #2058), delete the
 * original — this module is the surviving home.
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
      results.push({ type: "member", member, score, matchedFields });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
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
 * Unified hub search: ranks people and answers independently, then interleaves
 * them (person, answer, person, answer …) so both intents surface together in a
 * single dropdown. `maxResults` caps each category before interleaving.
 */
export function searchHub(
  query: string,
  members: OrgChartNode[],
  paths: ResponsibilityPath[],
  maxResults: number,
): HubSearchResult[] {
  const memberResults = searchMembers(query, members, maxResults);
  const responsibilityResults = searchResponsibilities(
    query,
    paths,
    maxResults,
  );

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
