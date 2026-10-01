/**
 * Search API Route Tests
 * Tests the /api/search endpoint validation and success responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { ARTICLES_QUERY } from "@/lib/repositories/article.repository";
import { PLAYERS_QUERY } from "@/lib/repositories/player.repository";
import { TEAMS_QUERY } from "@/lib/repositories/team.repository";
import { GET, POST } from "./route";

// Mock Next.js cache - pass through the function
vi.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: <T extends (...args: any[]) => any>(fn: T) => fn,
}));

// Hoist mock so it's available inside vi.mock factory
const { mockSanityFetch } = vi.hoisted(() => ({
  mockSanityFetch: vi.fn().mockResolvedValue([]),
}));

// Mock Sanity client to avoid projectId requirement in tests
vi.mock("@/lib/sanity/client", () => ({
  sanityClient: { fetch: mockSanityFetch },
}));

// Helper to create NextRequest
function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest(new URL("/api/search", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/search", () => {
  const TEST_BFF_URL = "http://localhost:8787";
  let savedApiUrl: string | undefined;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    savedApiUrl = process.env.KCVV_API_URL;
    process.env.KCVV_API_URL = TEST_BFF_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (savedApiUrl !== undefined) {
      process.env.KCVV_API_URL = savedApiUrl;
    } else {
      delete process.env.KCVV_API_URL;
    }
  });

  it("proxies to BFF and returns results", async () => {
    const bffResponse = {
      results: [
        {
          id: "doc-1",
          slug: "kantine",
          type: "responsibility",
          score: 0.9,
          title: "Kantine",
          excerpt: "...",
        },
      ],
    };
    vi.mocked(fetch).mockResolvedValueOnce(Response.json(bffResponse));

    const requestBody = { query: "kantine", type: "responsibility", limit: 5 };
    const response = await POST(makePostRequest(requestBody));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.results).toHaveLength(1);
    expect((body.results as Array<{ slug: string }>)[0]!.slug).toBe("kantine");
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      `${TEST_BFF_URL}/search`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(requestBody),
      }),
    );
  });

  it("returns 503 when KCVV_API_URL is not set", async () => {
    delete process.env.KCVV_API_URL;
    const response = await POST(makePostRequest({ query: "test" }));
    expect(response.status).toBe(503);
  });

  it("returns 500 when BFF fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));
    const response = await POST(makePostRequest({ query: "test" }));
    expect(response.status).toBe(500);
  });

  it("wraps a non-JSON error body from the search service as { error }, keeping its status", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Bad gateway", { status: 502 }),
    );

    const response = await POST(makePostRequest({ query: "test" }));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Bad gateway" });
  });

  it("falls back to a generic message when the non-JSON error body is empty", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 504 }));

    const response = await POST(makePostRequest({ query: "test" }));

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      error: "Unknown error from search service",
    });
  });
});

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Sanity mock to return empty arrays by default
    mockSanityFetch.mockResolvedValue([]);
  });

  afterEach(() => {
    mockSanityFetch.mockResolvedValue([]);
  });

  describe("Query Validation", () => {
    it("should return 400 when query is missing", async () => {
      const request = createRequest("/api/search");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/required/i);
    });

    it("should return 400 when query is empty string", async () => {
      const request = createRequest("/api/search?q=");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/required/i);
    });

    it("should return 400 when query is only whitespace", async () => {
      const request = createRequest("/api/search?q=   ");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/required/i);
    });

    it("should return 400 when query is less than 2 characters", async () => {
      const request = createRequest("/api/search?q=a");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/at least 2 characters/i);
    });
  });

  describe("Type Validation", () => {
    it.each(["invalid", "foo", "123"])(
      "should return 400 for unrecognised type '%s'",
      async (badType) => {
        const request = createRequest(`/api/search?q=test&type=${badType}`);
        const response = await GET(request);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toMatch(/invalid type/i);
      },
    );
  });

  describe("Combined Validation", () => {
    it("should validate query first (empty query + invalid type)", async () => {
      const request = createRequest("/api/search?q=&type=invalid");
      const response = await GET(request);

      // Should fail on query validation first
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/required/i);
    });

    it("should validate query length before type (1 char + invalid type)", async () => {
      const request = createRequest("/api/search?q=a&type=invalid");
      const response = await GET(request);

      // Should fail on query length validation first
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/at least 2 characters/i);
    });

    it("should validate type when query is valid", async () => {
      const request = createRequest("/api/search?q=test&type=badtype");
      const response = await GET(request);

      // Query is valid, should fail on type validation
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/invalid type/i);
    });
  });

  describe("Successful Requests", () => {
    it("should return 200 with results for valid query", async () => {
      const request = createRequest("/api/search?q=test");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty("query", "test");
      expect(body).toHaveProperty("results");
      expect(body).toHaveProperty("count");
      expect(Array.isArray(body.results)).toBe(true);
    });

    it("should accept type=article and return 200", async () => {
      const request = createRequest("/api/search?q=test&type=article");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.query).toBe("test");
      expect(Array.isArray(body.results)).toBe(true);
      // Mock returns empty data, so expect empty results
      expect(body.results).toEqual([]);
      expect(body.count).toBe(0);
    });

    it("should accept type=player and return 200", async () => {
      const request = createRequest("/api/search?q=test&type=player");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.query).toBe("test");
      expect(Array.isArray(body.results)).toBe(true);
      // Mock returns empty data, so expect empty results
      expect(body.results).toEqual([]);
      expect(body.count).toBe(0);
    });

    it("should accept type=team and return 200", async () => {
      const request = createRequest("/api/search?q=test&type=team");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.query).toBe("test");
      expect(Array.isArray(body.results)).toBe(true);
      // Mock returns empty data, so expect empty results
      expect(body.results).toEqual([]);
      expect(body.count).toBe(0);
    });

    it("should trim and normalize query in response", async () => {
      const request = createRequest("/api/search?q=%20%20test%20%20");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.query).toBe("test"); // Trimmed
    });

    it("should accept uppercase type parameter (case-insensitive)", async () => {
      const request = createRequest("/api/search?q=test&type=ARTICLE");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.query).toBe("test");
      expect(Array.isArray(body.results)).toBe(true);
      expect(body.results).toEqual([]);
      expect(body.count).toBe(0);
    });
  });

  describe("Staff Search", () => {
    it("should return staff results matching query by name", async () => {
      // Sanity returns organigramNode data for staff, player data for players, etc.
      // The mock returns the same data for all fetch calls, so we set up
      // organigram nodes with members that match the search query.
      mockSanityFetch.mockResolvedValue([
        {
          _id: "node-1",
          title: "Voorzitter",
          roleCode: "PRES",
          department: "hoofdbestuur",
          parentId: null,
          description: null,
          members: [
            {
              id: "staff-1",
              name: "Jan Janssens",
              photoUrl: "https://cdn.sanity.io/jan.webp",
              psdImageUrl: null,
              email: null,
              phone: null,
              psdId: "123",
            },
          ],
        },
        {
          _id: "node-2",
          title: "Secretaris",
          roleCode: "SEC",
          department: "hoofdbestuur",
          parentId: null,
          description: null,
          members: [
            {
              id: "staff-2",
              name: "Piet Pieters",
              photoUrl: "https://cdn.sanity.io/piet.webp",
              psdImageUrl: null,
              email: null,
              phone: null,
              psdId: "456",
            },
          ],
        },
      ]);

      const request = createRequest("/api/search?q=jan&type=staff");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.count).toBe(1);
      expect(body.results).toEqual([
        expect.objectContaining({
          type: "staff",
          title: "Jan Janssens",
          description: "PRES",
          url: "/staf/123",
          imageUrl: "https://cdn.sanity.io/jan.webp",
        }),
      ]);
    });

    it("should exclude staff members without href (no psdId)", async () => {
      mockSanityFetch.mockResolvedValue([
        {
          _id: "node-1",
          title: "Vrijwilliger",
          roleCode: null,
          department: "algemeen",
          parentId: null,
          description: null,
          members: [
            {
              id: "staff-3",
              name: "KarelAnsen",
              photoUrl: null,
              psdImageUrl: null,
              email: null,
              phone: null,
              psdId: null,
            },
          ],
        },
      ]);

      const request = createRequest("/api/search?q=karel&type=staff");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.count).toBe(0);
      expect(body.results).toEqual([]);
    });

    it("should exclude staff members without a name", async () => {
      mockSanityFetch.mockResolvedValue([
        {
          _id: "node-1",
          title: "Vacant",
          roleCode: "TREAS",
          department: "hoofdbestuur",
          parentId: null,
          description: null,
          members: [
            {
              id: "staff-4",
              name: "  ",
              photoUrl: null,
              psdImageUrl: null,
              email: null,
              phone: null,
              psdId: "789",
            },
          ],
        },
      ]);

      const request = createRequest("/api/search?q=vacant&type=staff");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.count).toBe(0);
    });

    it("should accept type=staff and return 200", async () => {
      const request = createRequest("/api/search?q=test&type=staff");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.query).toBe("test");
      expect(Array.isArray(body.results)).toBe(true);
    });

    it("should dedupe a member appearing in multiple org-nodes into one result with combined roles", async () => {
      // Regression for #2140: a staff member referenced by N organigramNodes
      // produced N near-identical /staf/{psdId} rows (one per role). The fix
      // dedupes by member.id and combines the roleCodes into one description.
      // The third node repeats "PRES" to assert duplicate roleCodes are dropped.
      const member = {
        id: "staff-1",
        name: "Jan Janssens",
        photoUrl: "https://cdn.sanity.io/jan.webp",
        psdImageUrl: null,
        email: null,
        phone: null,
        psdId: "123",
      };
      mockSanityFetch.mockResolvedValue([
        {
          _id: "node-1",
          title: "Voorzitter",
          roleCode: "PRES",
          department: "hoofdbestuur",
          parentId: null,
          description: null,
          members: [member],
        },
        {
          _id: "node-2",
          title: "Secretaris",
          roleCode: "SEC",
          department: "hoofdbestuur",
          parentId: null,
          description: null,
          members: [member],
        },
        {
          _id: "node-3",
          title: "Voorzitter (duplicate role)",
          roleCode: "PRES",
          department: "hoofdbestuur",
          parentId: null,
          description: null,
          members: [member],
        },
      ]);

      const request = createRequest("/api/search?q=jan&type=staff");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.count).toBe(1);
      expect(body.results).toHaveLength(1);
      expect(body.results[0]).toEqual(
        expect.objectContaining({
          id: "staff-1",
          type: "staff",
          title: "Jan Janssens",
          description: "PRES · SEC",
          url: "/staf/123",
          imageUrl: "https://cdn.sanity.io/jan.webp",
        }),
      );
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when Sanity fetch throws", async () => {
      mockSanityFetch.mockRejectedValueOnce(new Error("boom"));

      const request = createRequest("/api/search?q=test");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Internal server error");
    }, 10_000);
  });

  describe("Matching and Ranking", () => {
    interface ArticleRow {
      id: string;
      title: string;
      slug: string;
      tags: string[];
      publishedAt?: string;
      coverImageUrl?: string;
    }
    interface PlayerRow {
      _id: string;
      firstName: string;
      lastName: string;
      psdId?: string | null;
    }
    interface TeamRow {
      _id: string;
      name: string;
      displayName?: string | null;
      slug: string;
    }

    /**
     * Routes each repository's GROQ query to its own rows. The repositories and
     * the route stay real; only the Sanity client (the outer boundary) answers.
     */
    function stubSanity(rows: {
      articles?: ArticleRow[];
      players?: PlayerRow[];
      teams?: TeamRow[];
    }) {
      mockSanityFetch.mockImplementation(async (query: string) => {
        if (query === ARTICLES_QUERY) return rows.articles ?? [];
        if (query === PLAYERS_QUERY) return rows.players ?? [];
        if (query === TEAMS_QUERY) return rows.teams ?? [];
        return [];
      });
    }

    async function search(url: string) {
      const response = await GET(createRequest(url));
      expect(response.status).toBe(200);
      return (await response.json()) as {
        count: number;
        results: Array<{ type: string; title: string; url: string }>;
      };
    }

    const article = (
      id: string,
      title: string,
      tags: string[] = [],
    ): ArticleRow => ({ id, title, slug: `slug-${id}`, tags });

    describe("articles", () => {
      it("matches on title, case-insensitively, and links to /nieuws/<slug>", async () => {
        stubSanity({
          articles: [
            article("1", "Winst tegen Mechelen"),
            article("2", "Training verplaatst"),
          ],
        });

        const { results } = await search("/api/search?q=MECHELEN&type=article");

        expect(results).toEqual([
          expect.objectContaining({
            type: "article",
            title: "Winst tegen Mechelen",
            url: "/nieuws/slug-1",
          }),
        ]);
      });

      it("matches on a tag even when the title does not match", async () => {
        stubSanity({
          articles: [
            article("1", "Wedstrijdverslag", ["Jeugd", "U15"]),
            article("2", "Training verplaatst", ["senioren"]),
          ],
        });

        const { results } = await search("/api/search?q=jeugd&type=article");

        expect(results.map((r) => r.title)).toEqual(["Wedstrijdverslag"]);
      });
    });

    describe("players", () => {
      it("matches on the full name and links by psdId", async () => {
        stubSanity({
          players: [
            { _id: "p1", firstName: "Marc", lastName: "Peeters", psdId: "111" },
            { _id: "p2", firstName: "Jan", lastName: "Janssens", psdId: "222" },
          ],
        });

        // "c pe" only exists across the first/last name boundary.
        const { results } = await search("/api/search?q=c%20pe&type=player");

        expect(results).toEqual([
          expect.objectContaining({
            type: "player",
            title: "Marc Peeters",
            url: "/spelers/111",
          }),
        ]);
      });

      it("drops players without an href (no psdId) even when the name matches", async () => {
        stubSanity({
          players: [
            { _id: "p1", firstName: "Marc", lastName: "Peeters", psdId: null },
            {
              _id: "p2",
              firstName: "Marcel",
              lastName: "Dubois",
              psdId: "333",
            },
          ],
        });

        const { results } = await search("/api/search?q=marc&type=player");

        expect(results.map((r) => r.title)).toEqual(["Marcel Dubois"]);
      });
    });

    describe("teams", () => {
      const teamRows: TeamRow[] = [
        {
          _id: "t1",
          name: "Eerste Elftallen A",
          displayName: "A-ploeg",
          slug: "a-ploeg",
        },
        { _id: "t2", name: "KCVVE U16", displayName: "U16", slug: "u16" },
      ];

      it("matches on displayName and titles the result with it", async () => {
        stubSanity({ teams: teamRows });

        const { results } = await search("/api/search?q=a-ploeg&type=team");

        expect(results).toEqual([
          expect.objectContaining({
            type: "team",
            title: "A-ploeg",
            url: "/ploegen/a-ploeg",
          }),
        ]);
      });

      it("matches on the federation name but still titles the result with displayName", async () => {
        stubSanity({ teams: teamRows });

        const { results } = await search("/api/search?q=elftallen&type=team");

        expect(results).toEqual([
          expect.objectContaining({
            title: "A-ploeg",
            url: "/ploegen/a-ploeg",
          }),
        ]);
      });
    });

    describe("ranking", () => {
      it("orders exact title, then prefix matches, then the rest, each alphabetically", async () => {
        // Deliberately scrambled so source order cannot explain the result.
        stubSanity({
          articles: [
            article("1", "Zondag: KCVV wint"),
            article("2", "KCVV Zege"),
            article("3", "Alles over KCVV"),
            article("4", "KCVV"),
            article("5", "KCVV Beker"),
          ],
        });

        const { results } = await search("/api/search?q=kcvv&type=article");

        expect(results.map((r) => r.title)).toEqual([
          "KCVV", // exact
          "KCVV Beker", // prefix, alphabetical
          "KCVV Zege",
          "Alles over KCVV", // contains, alphabetical
          "Zondag: KCVV wint",
        ]);
      });

      it("ranks across content types by title, not by type", async () => {
        stubSanity({
          articles: [article("1", "Over de U16")],
          teams: [
            { _id: "t1", name: "KCVVE U16", displayName: "U16", slug: "u16" },
          ],
        });

        const { results } = await search("/api/search?q=u16");

        expect(results.map((r) => r.title)).toEqual(["U16", "Over de U16"]);
      });
    });
  });
});
