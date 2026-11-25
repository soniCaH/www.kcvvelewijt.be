/**
 * Shared Test Utilities for Search Feature
 * Factory functions and mock data for search tests
 */

import type {
  SearchResult,
  SearchResponse,
} from "@/components/search/SearchInterface";

/**
 * Mock search results for testing
 */
export const mockSearchResults: SearchResult[] = [
  // Article results
  {
    type: "article",
    id: "article-1",
    title: "KCVV wint belangrijke match",
    description: "De eerste ploeg behaalde een knappe overwinning",
    url: "/news/kcvv-wint-belangrijke-match",
    imageUrl: "/images/match-win.jpg",
    date: "2024-03-15",
    tags: ["Eerste Ploeg", "Overwinning", "Competitie"],
  },
  {
    type: "article",
    id: "article-2",
    title: "Jeugdtoernooi groot succes",
    description: "Meer dan 200 jonge voetballers namen deel",
    url: "/news/jeugdtoernooi-succes",
    imageUrl: "/images/youth-tournament.jpg",
    date: "2024-03-10",
    tags: ["Jeugd", "Toernooi", "Event"],
  },
  {
    type: "article",
    id: "article-3",
    title: "Nieuwe sponsor verwelkomd",
    description: "KCVV verwelkomt een nieuwe hoofdsponsor",
    url: "/news/nieuwe-sponsor",
    date: "2024-03-05",
    // No imageUrl - test conditional rendering
    // No tags - test empty state
  },

  // Player results
  {
    type: "player",
    id: "player-1",
    title: "Jan Janssens",
    description: "Aanvaller - Eerste Ploeg",
    url: "/players/jan-janssens",
    imageUrl: "/images/jan-janssens.jpg",
  },
  {
    type: "player",
    id: "player-2",
    title: "Maria De Vos",
    description: "Verdediger - Dames A",
    url: "/players/maria-de-vos",
    // No imageUrl - test conditional rendering
  },

  // Team results
  {
    type: "team",
    id: "team-1",
    title: "Eerste Ploeg",
    description: "Onze senioren ploeg in eerste provinciale",
    url: "/teams/eerste-ploeg",
    imageUrl: "/images/eerste-ploeg.jpg",
  },
  {
    type: "team",
    id: "team-2",
    title: "U15 A",
    description: "Jeugdploeg voor spelers onder 15 jaar",
    url: "/teams/u15-a",
  },
];

/**
 * Create a mock SearchResponse
 */
export function createMockSearchResponse(
  query: string,
  results: SearchResult[] = mockSearchResults,
): SearchResponse {
  return {
    query,
    results,
    count: results.length,
  };
}

/**
 * Per-type counters for generating deterministic IDs in tests
 * Ensures test failures are reproducible and snapshots are stable
 */
const idCounters = { article: 0, player: 0, team: 0 };

/**
 * Reset all ID counters to 0
 * Call this in beforeEach if tests assert on specific ID values
 */
export function resetIdCounter() {
  idCounters.article = 0;
  idCounters.player = 0;
  idCounters.team = 0;
}

/**
 * Factory function to create mock article results
 */
export function createMockArticle(
  overrides: Partial<SearchResult> = {},
): SearchResult {
  return {
    type: "article",
    id: `article-${++idCounters.article}`,
    title: "Test Article",
    description: "Test article description",
    url: "/news/test-article",
    imageUrl: "/images/test.jpg",
    date: "2024-03-15",
    tags: ["Test", "Article"],
    ...overrides,
  };
}

/**
 * Factory function to create mock player results
 */
export function createMockPlayer(
  overrides: Partial<SearchResult> = {},
): SearchResult {
  return {
    type: "player",
    id: `player-${++idCounters.player}`,
    title: "Test Player",
    description: "Middenvelder - Test Team",
    url: "/players/test-player",
    imageUrl: "/images/player.jpg",
    ...overrides,
  };
}

/**
 * Factory function to create mock team results
 */
export function createMockTeam(
  overrides: Partial<SearchResult> = {},
): SearchResult {
  return {
    type: "team",
    id: `team-${++idCounters.team}`,
    title: "Test Team",
    description: "Test team description",
    url: "/teams/test-team",
    imageUrl: "/images/team.jpg",
    ...overrides,
  };
}
