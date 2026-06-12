import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HubSearch } from "./HubSearch";
import { HUB_SEARCH_MEMBERS, HUB_SEARCH_PATHS } from "./hub-search.fixture";
import type { SemanticSearchResult } from "@/hooks/useSemanticSearch";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));
import { trackEvent } from "@/lib/analytics/track-event";

// Controllable semantic answer lane.
const mockSemantic: {
  results: SemanticSearchResult[];
  answer: string | undefined;
  loading: boolean;
  error: string | null;
  executedQuery: string;
  search: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
} = {
  results: [],
  answer: undefined,
  loading: false,
  error: null,
  executedQuery: "",
  search: vi.fn(),
  clear: vi.fn(),
};
vi.mock("@/hooks/useSemanticSearch", () => ({
  useSemanticSearch: () => mockSemantic,
}));

function setSemantic(
  patch: Partial<Pick<typeof mockSemantic, "results" | "loading" | "error">> & {
    executedQuery?: string;
  },
) {
  Object.assign(mockSemantic, patch);
}

/** Build a semantic hit for one of the fixture paths (slug == path id). */
function hit(slug: string, score: number): SemanticSearchResult {
  return {
    id: slug,
    slug,
    type: "responsibility",
    score,
    title: "",
    excerpt: "",
  };
}

function renderSearch() {
  return render(
    <HubSearch
      members={HUB_SEARCH_MEMBERS}
      responsibilityPaths={HUB_SEARCH_PATHS}
    />,
  );
}

function typeQuery(text: string) {
  const input = screen.getByLabelText("Zoek een persoon of hulpvraag");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: text } });
  return input;
}

describe("HubSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "";
    setSemantic({
      results: [],
      loading: false,
      error: null,
      executedQuery: "",
    });
  });

  it("renders the search input", () => {
    renderSearch();
    expect(
      screen.getByLabelText("Zoek een persoon of hulpvraag"),
    ).toBeInTheDocument();
  });

  it("interleaves keyword people with semantic answers", async () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    renderSearch();
    typeQuery("in");
    // Person (keyword, after debounce) + answer (semantic, mapped by slug).
    expect(await screen.findByText("Inge De Wit")).toBeInTheDocument();
    expect(
      screen.getByText("Hoe schrijf ik mijn kind in?"),
    ).toBeInTheDocument();
  });

  it("renders answer-forward (summary + lees meer) when the top score ≥ 0.5", async () => {
    setSemantic({ results: [hit("blessure", 0.82)], executedQuery: "bezeerd" });
    renderSearch();
    typeQuery("bezeerd");
    expect(
      await screen.findByText(/Lees volledig antwoord/i),
    ).toBeInTheDocument();
    // The CMS summary is shown inline (not an LLM answer).
    expect(
      screen.getByText(/Verwittig de gerechtigd correspondent/i),
    ).toBeInTheDocument();
  });

  it("stays list-only (no answer-forward) when the top score < 0.5", async () => {
    setSemantic({ results: [hit("blessure", 0.41)], executedQuery: "x" });
    renderSearch();
    typeQuery("x");
    expect(
      await screen.findByText("Wat moet ik doen bij een blessure?"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Lees volledig antwoord/i),
    ).not.toBeInTheDocument();
  });

  it("shows a smart-search hint in semantic mode", async () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    renderSearch();
    typeQuery("in");
    expect(await screen.findByText(/Slim gezocht/i)).toBeInTheDocument();
  });

  it("falls back to keyword (no smart hint) when the endpoint errors", async () => {
    setSemantic({ error: "boom" });
    renderSearch();
    typeQuery("blessure");
    // Keyword fallback still finds the answer by its keyword.
    expect(
      await screen.findByText("Wat moet ik doen bij een blessure?"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Slim gezocht|Beste match/i),
    ).not.toBeInTheDocument();
  });

  it("scrolls to #structuur and tracks query_length when a person is chosen", async () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    renderSearch();
    typeQuery("in");
    fireEvent.click(await screen.findByText("Inge De Wit"));
    expect(window.location.hash).toBe("#structuur");
    expect(trackEvent).toHaveBeenCalledWith("organigram_search_used", {
      query_length: 2,
    });
  });

  it("deep-links the finder accordion by slug when an answer is chosen", async () => {
    setSemantic({
      results: [hit("blessure", 0.41)],
      executedQuery: "blessure",
    });
    renderSearch();
    typeQuery("blessure");
    fireEvent.click(
      await screen.findByText("Wat moet ik doen bij een blessure?"),
    );
    expect(window.location.hash).toBe("#blessure");
  });

  it("shows an empty state when nothing matches", async () => {
    setSemantic({ results: [], executedQuery: "zzzzz" });
    renderSearch();
    typeQuery("zzzzz");
    expect(await screen.findByText(/Geen resultaten voor/)).toBeInTheDocument();
  });

  it("clears the query with the clear button", async () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    renderSearch();
    const input = typeQuery("in") as HTMLInputElement;
    await screen.findByText("Inge De Wit");
    fireEvent.click(screen.getByLabelText("Wissen"));
    expect(input.value).toBe("");
  });
});
