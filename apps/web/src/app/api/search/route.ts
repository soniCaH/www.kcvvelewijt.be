/**
 * Search API Route
 * Handles search queries across multiple content types
 */

import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { unstable_cache } from "next/cache";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import type { SearchResult } from "@/types/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Debug logging helper - only logs in development or when DEBUG_SEARCH is enabled
 */
const debugLog = (...args: unknown[]) => {
  if (
    process.env.DEBUG_SEARCH === "true" ||
    process.env.NODE_ENV === "development"
  ) {
    console.log(...args);
  }
};

/**
 * Search across articles by title, tags, and body
 */
const searchArticles = (query: string) =>
  Effect.gen(function* () {
    const sanity = yield* SanityService;
    const allArticles = yield* sanity.getArticles();

    debugLog(`[Search API] Total articles fetched: ${allArticles.length}`);

    const queryLower = query.toLowerCase();

    return allArticles
      .filter((article) => {
        const titleMatch = article.title.toLowerCase().includes(queryLower);
        const tagMatch = (article.tags ?? []).some((tag) =>
          tag.toLowerCase().includes(queryLower),
        );
        // Search body via JSON stringification of Portable Text
        const bodyMatch = JSON.stringify(article.body ?? "")
          .toLowerCase()
          .includes(queryLower);

        return titleMatch || tagMatch || bodyMatch;
      })
      .map(
        (article): SearchResult => ({
          id: article._id,
          type: "article",
          title: article.title,
          description: undefined,
          url: `/news/${article.slug.current}`,
          imageUrl: article.coverImageUrl ?? undefined,
          tags: article.tags ?? [],
          date: article.publishAt ?? "",
        }),
      );
  });

/**
 * Fetch all players with caching
 * Cached for 5 minutes since player data changes infrequently
 */
const getAllPlayers = unstable_cache(
  async () => {
    const players = await runPromise(
      Effect.gen(function* () {
        const sanity = yield* SanityService;
        return yield* sanity.getPlayers();
      }),
    );
    debugLog(`[Search API] Fetched ${players.length} players`);
    return players;
  },
  ["all-players"],
  {
    revalidate: 300, // 5 minutes
    tags: ["players"],
  },
);

/**
 * Search across players by name
 */
const searchPlayers = (query: string) =>
  Effect.gen(function* () {
    const allPlayers = yield* Effect.promise(() => getAllPlayers());

    const queryLower = query.toLowerCase();

    const filtered = allPlayers.filter((player) => {
      const firstName = player.firstName ?? "";
      const lastName = player.lastName ?? "";
      const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
      return fullName.includes(queryLower);
    });

    debugLog(`[Search API] Found ${filtered.length} player matches`);

    return filtered.map((player): SearchResult => {
      const firstName = player.firstName ?? "";
      const lastName = player.lastName ?? "";
      const fullName = `${firstName} ${lastName}`.trim() || player._id;
      const position = player.keeper
        ? "Keeper"
        : (player.position ?? player.positionPsd ?? undefined);

      return {
        id: player._id,
        type: "player",
        title: fullName,
        description: position,
        url: `/players/${player.psdId}`,
        imageUrl: player.transparentImageUrl ?? player.psdImageUrl ?? undefined,
      };
    });
  });

/**
 * Search across teams by name
 */
const searchTeams = (query: string) =>
  Effect.gen(function* () {
    const sanity = yield* SanityService;
    const teams = yield* sanity.getTeams();

    const queryLower = query.toLowerCase();

    return teams
      .filter((team) => team.name.toLowerCase().includes(queryLower))
      .map(
        (team): SearchResult => ({
          id: team._id,
          type: "team",
          title: team.name,
          description: team.divisionFull ?? team.division ?? undefined,
          url: `/team/${team.slug.current}`,
          imageUrl: team.teamImageUrl ?? undefined,
        }),
      );
  });

/**
 * Handle GET /api/search requests and return matching articles, players, and teams.
 *
 * Accepts query parameter `q` (required, at least 2 characters) and optional `type`
 * filter (`"article"`, `"player"`, or `"team"`). Performs searches across the
 * requested content types, ranks results by a simple relevance heuristic
 * (exact title match, then starts-with, then alphabetical), and returns a JSON
 * payload with the original query, result count, and ordered results.
 *
 * Validation responses:
 * - 400 when `q` is missing, empty, or shorter than 2 characters, or when `type`
 *   is not one of the allowed values.
 * - 500 on internal server error (generic error message returned to the client).
 *
 * @returns A JSON object `{ query: string, count: number, results: SearchResult[] }` on success;
 *          on error returns `{ error: string }` with an appropriate HTTP status.
 */
/**
 * Handle POST /api/search — proxies semantic search to the BFF.
 *
 * Forwards the request body to `KCVV_API_URL/search` and streams the response
 * back to the client. Using a server-side proxy avoids CORS and keeps the BFF
 * URL out of the client bundle.
 */
export async function POST(request: NextRequest) {
  const bffUrl = process.env.KCVV_API_URL;
  if (!bffUrl) {
    return NextResponse.json(
      { error: "Search service not configured" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as unknown;
    const res = await fetch(`${bffUrl}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    let data: unknown;
    try {
      data = (await res.json()) as unknown;
    } catch {
      const text = await res.text();
      data = { error: text || "Unknown error from search service" };
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[Search API] Semantic search proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawQuery = searchParams.get("q");
  const rawType = searchParams.get("type"); // Filter by content type

  // Normalize and validate query
  const query = rawQuery?.trim();
  if (!query || query.length === 0) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 },
    );
  }

  if (query.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters" },
      { status: 400 },
    );
  }

  // Normalize and validate type against whitelist
  const allowedTypes = ["article", "player", "team"];
  const type = rawType?.toLowerCase().trim();
  if (type && !allowedTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    debugLog(`[Search API] Query: "${query}", Type: ${type || "all"}`);

    // Search across content types based on filter
    const searchProgram = Effect.gen(function* () {
      const results: SearchResult[] = [];

      // Search articles
      if (!type || type === "article") {
        debugLog("[Search API] Searching articles...");
        const articles = yield* searchArticles(query);
        debugLog(`[Search API] Found ${articles.length} articles`);
        results.push(...articles);
      }

      // Search players
      if (!type || type === "player") {
        debugLog("[Search API] Searching players...");
        const players = yield* searchPlayers(query);
        debugLog(`[Search API] Found ${players.length} players`);
        results.push(...players);

        // TODO: Add staff search once staff detail pages are implemented
        // Staff pages don't exist yet, so we're excluding them from search
        // console.log("[Search API] Searching staff...");
        // const staff = yield* searchStaff(query);
        // console.log(`[Search API] Found ${staff.length} staff`);
        // results.push(...staff);
      }

      // Search teams
      if (!type || type === "team") {
        debugLog("[Search API] Searching teams...");
        const teams = yield* searchTeams(query);
        debugLog(`[Search API] Found ${teams.length} teams`);
        results.push(...teams);
      }

      debugLog(`[Search API] Total results: ${results.length}`);
      return results;
    });

    // Execute the program
    const results = await runPromise(searchProgram);

    // Sort by relevance (simple: prioritize title matches)
    const sorted = results.sort((a, b) => {
      const queryLower = query.toLowerCase();
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();

      // Exact match first
      if (aTitle === queryLower && bTitle !== queryLower) return -1;
      if (bTitle === queryLower && aTitle !== queryLower) return 1;

      // Starts with query
      if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower))
        return -1;
      if (bTitle.startsWith(queryLower) && !aTitle.startsWith(queryLower))
        return 1;

      // Alphabetical
      return aTitle.localeCompare(bTitle);
    });

    debugLog(`[Search API] Returning ${sorted.length} sorted results`);

    return NextResponse.json({
      query,
      count: sorted.length,
      results: sorted,
    });
  } catch (error) {
    // Log full error server-side for debugging
    console.error("[Search API] Error:", error);
    // Return only generic error message to client (no internal details)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
