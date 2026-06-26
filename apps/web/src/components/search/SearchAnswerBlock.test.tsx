/**
 * SearchAnswerBlock Component Tests
 *
 * Focus: the score gate (prose ≥ 0.5 · related 0.35–0.5 · nothing < 0.35),
 * the silent-failure / in-flight guards, and the type → URL derivation.
 */

import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchAnswerBlock, semanticResultUrl } from "./SearchAnswerBlock";
import {
  useSemanticSearch,
  type SemanticSearchResult,
  type UseSemanticSearchReturn,
} from "@/hooks/useSemanticSearch";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

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

beforeEach(() => {
  mockHook.mockReset();
});

describe("SearchAnswerBlock", () => {
  it("renders the prose card when top score ≥ 0.5 and an answer exists", () => {
    setHook({
      answer: "Iedereen is welkom.",
      results: [result({ score: 0.72, type: "page", slug: "jeugd" })],
    });

    render(<SearchAnswerBlock query="voetbal" />);

    expect(screen.getByText("Iedereen is welkom.")).toBeInTheDocument();
    expect(screen.getByText("Slim antwoord")).toBeInTheDocument();
    // Source link derives its URL from the result type.
    expect(screen.getByRole("link", { name: "Titel" })).toHaveAttribute(
      "href",
      "/club/jeugd",
    );
  });

  it("renders 'Gerelateerd' rows (no prose) for a mid-confidence score", () => {
    setHook({
      answer: undefined,
      results: [
        result({
          score: 0.42,
          type: "article",
          slug: "jeugddag",
          title: "Jeugddag",
        }),
      ],
    });

    render(<SearchAnswerBlock query="voetbal" />);

    expect(screen.getByText("Gerelateerd")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /jeugddag/i })).toHaveAttribute(
      "href",
      "/nieuws/jeugddag",
    );
    expect(screen.queryByText("Slim antwoord")).not.toBeInTheDocument();
  });

  it("falls back to 'Gerelateerd' when score is high but no answer arrived", () => {
    setHook({
      answer: undefined,
      results: [result({ score: 0.8 })],
    });

    render(<SearchAnswerBlock query="voetbal" />);

    expect(screen.getByText("Gerelateerd")).toBeInTheDocument();
    expect(screen.queryByText("Slim antwoord")).not.toBeInTheDocument();
  });

  it("renders nothing when the top score is below 0.35", () => {
    setHook({ results: [result({ score: 0.2 })] });

    const { container } = render(<SearchAnswerBlock query="voetbal" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing (silent failure) when there are no results", () => {
    setHook({ results: [], error: "Search failed: 503" });

    const { container } = render(<SearchAnswerBlock query="voetbal" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while a fetch is in flight (executedQuery mismatch)", () => {
    setHook({
      executedQuery: "",
      answer: "stale",
      results: [result({ score: 0.9 })],
    });

    const { container } = render(<SearchAnswerBlock query="voetbal" />);

    expect(container).toBeEmptyDOMElement();
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
