/**
 * Search API Route Tests
 * Tests the /api/search endpoint validation and success responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
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
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("proxies to BFF and returns results", async () => {
    const bffResponse = {
      results: [
        {
          id: "doc-1",
          slug: "kantine",
          type: "responsibilityPath",
          score: 0.9,
          title: "Kantine",
          excerpt: "...",
        },
      ],
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => bffResponse,
    } as Response);

    const response = await POST(
      makePostRequest({ query: "kantine", type: "responsibility", limit: 5 }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.results).toHaveLength(1);
    expect((body.results as Array<{ slug: string }>)[0]!.slug).toBe("kantine");
  });

  it("returns 503 when KCVV_API_URL is not set", async () => {
    const saved = process.env.KCVV_API_URL;
    delete process.env.KCVV_API_URL;
    try {
      const response = await POST(makePostRequest({ query: "test" }));
      expect(response.status).toBe(503);
    } finally {
      if (saved !== undefined) process.env.KCVV_API_URL = saved;
    }
  });

  it("returns 500 when BFF fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));
    const response = await POST(makePostRequest({ query: "test" }));
    expect(response.status).toBe(500);
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
});
