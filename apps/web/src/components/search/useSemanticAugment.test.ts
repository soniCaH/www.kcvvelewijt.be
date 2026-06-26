/**
 * useSemanticAugment Tests
 *
 * Focus: the score gate (answer ≥ 0.5 · related 0.35–0.5 · none < 0.35), the
 * de-dup against lexical URLs, the silent-failure / in-flight guards, and the
 * type → URL derivation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useSemanticAugment,
  semanticResultUrl,
  type SemanticAugment,
} from "./useSemanticAugment";
import {
  useSemanticSearch,
  type SemanticSearchResult,
  type UseSemanticSearchReturn,
} from "@/hooks/useSemanticSearch";

vi.mock("@/hooks/useSemanticSearch", () => ({
  useSemanticSearch: vi.fn(),
}));

const mockHook = vi.mocked(useSemanticSearch);

function result(
  over: Partial<SemanticSearchResult> & { score: number },
): SemanticSearchResult {
  return {
    id: "id-1",
    slug: "slug-1",
    type: "article",
    title: "Titel",
    excerpt: "Een fragment.",
    ...over,
  };
}

function setHook(partial: Partial<UseSemanticSearchReturn>) {
  mockHook.mockReturnValue({
    results: [],
    answer: undefined,
    loading: false,
    error: null,
    executedQuery: "voetbal",
    search: vi.fn(),
    clear: vi.fn(),
    ...partial,
  });
}

function run(query = "voetbal", exclude: string[] = []): SemanticAugment {
  return renderHook(() => useSemanticAugment(query, new Set(exclude))).result
    .current;
}

beforeEach(() => {
  mockHook.mockReset();
});

describe("useSemanticAugment", () => {
  it("returns an 'answer' state for top score ≥ 0.5 with an answer", () => {
    setHook({
      answer: "Iedereen is welkom.",
      results: [result({ score: 0.72, type: "page", slug: "jeugd" })],
    });

    const augment = run();

    expect(augment.kind).toBe("answer");
    if (augment.kind !== "answer") throw new Error("expected answer");
    expect(augment.answer).toBe("Iedereen is welkom.");
    expect(augment.sources).toEqual([{ title: "Titel", href: "/club/jeugd" }]);
  });

  it("returns a 'related' state for a mid-confidence score (no prose)", () => {
    setHook({
      results: [
        result({
          score: 0.42,
          type: "article",
          slug: "jeugddag",
          title: "Jeugddag",
        }),
      ],
    });

    const augment = run();

    expect(augment.kind).toBe("related");
    if (augment.kind !== "related") throw new Error("expected related");
    expect(augment.items[0]).toMatchObject({
      type: "article",
      title: "Jeugddag",
      href: "/nieuws/jeugddag",
    });
  });

  it("falls back to 'related' when the score is high but no answer arrived", () => {
    setHook({ answer: undefined, results: [result({ score: 0.8 })] });

    expect(run().kind).toBe("related");
  });

  it("returns 'none' below 0.35, and for a missing/NaN score", () => {
    setHook({ results: [result({ score: 0.2 })] });
    expect(run().kind).toBe("none");

    setHook({ results: [result({ score: Number.NaN })] });
    expect(run().kind).toBe("none");
  });

  it("returns 'none' (silent failure) when there are no results", () => {
    setHook({ results: [], error: "Search failed: 503" });
    expect(run().kind).toBe("none");
  });

  it("returns 'none' while a fetch is in flight (executedQuery mismatch)", () => {
    setHook({
      executedQuery: "",
      answer: "stale",
      results: [result({ score: 0.9 })],
    });
    expect(run().kind).toBe("none");
  });

  it("de-dups results whose URL already appears in the lexical results", () => {
    setHook({
      results: [
        result({
          score: 0.4,
          type: "article",
          slug: "shared",
          title: "Gedeeld",
        }),
        result({
          id: "id-2",
          score: 0.38,
          type: "article",
          slug: "uniek",
          title: "Uniek",
        }),
      ],
    });

    const augment = run("voetbal", ["/nieuws/shared"]);

    expect(augment.kind).toBe("related");
    if (augment.kind !== "related") throw new Error("expected related");
    expect(augment.items).toHaveLength(1);
    expect(augment.items[0].href).toBe("/nieuws/uniek");
  });

  it("returns 'none' when de-dup empties a related list", () => {
    setHook({
      results: [result({ score: 0.4, type: "article", slug: "shared" })],
    });

    expect(run("voetbal", ["/nieuws/shared"]).kind).toBe("none");
  });
});

describe("semanticResultUrl", () => {
  it("derives a URL per content type", () => {
    expect(
      semanticResultUrl(result({ score: 1, type: "article", slug: "a" })),
    ).toBe("/nieuws/a");
    expect(
      semanticResultUrl(result({ score: 1, type: "page", slug: "b" })),
    ).toBe("/club/b");
    expect(
      semanticResultUrl(
        result({ score: 1, type: "responsibility", slug: "c" }),
      ),
    ).toBe("/hulp#c");
  });
});
