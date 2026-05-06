/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HulpPage } from "./HulpPage";
import { FIXTURE_PATHS } from "./__fixtures__/paths.fixture";
import { sanitizeQuery } from "@/lib/analytics/sanitize-query";
import type { SemanticSearchResult } from "@/hooks/useSemanticSearch";

// next/navigation hooks used by HulpPage
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => "/hulp",
  useSearchParams: () => mockSearchParams,
}));

// Stub useSemanticSearch — return whatever the test sets in `currentResults`
let currentResults: SemanticSearchResult[] = [];
let currentLoading = false;
let currentError: string | null = null;
let currentExecutedQuery = "";
const mockSearch = vi.fn();
const mockClear = vi.fn();
vi.mock("@/hooks/useSemanticSearch", () => ({
  useSemanticSearch: () => ({
    results: currentResults,
    answer: undefined,
    loading: currentLoading,
    error: currentError,
    executedQuery: currentExecutedQuery,
    search: mockSearch,
    clear: mockClear,
  }),
}));

// Stub the analytics hook so we can assert tracking calls
const trackSearch = vi.fn();
const trackNoResults = vi.fn();
const trackSuggestionClicked = vi.fn();
const trackContactClicked = vi.fn();
const trackStepLinkClicked = vi.fn();
vi.mock("@/hooks/useResponsibilityAnalytics", () => ({
  useResponsibilityAnalytics: () => ({
    trackRoleSelected: vi.fn(),
    trackSearch,
    trackNoResults,
    trackSuggestionClicked,
    trackContactClicked,
    trackOrganigramLink: vi.fn(),
    trackStepLinkClicked,
    startDwell: vi.fn(),
    stopDwell: vi.fn(),
    resetSession: vi.fn(),
  }),
}));

function resetMocks() {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockSearch.mockClear();
  mockClear.mockClear();
  trackSearch.mockClear();
  trackNoResults.mockClear();
  trackSuggestionClicked.mockClear();
  trackContactClicked.mockClear();
  trackStepLinkClicked.mockClear();
  mockSearchParams = new URLSearchParams();
  currentResults = [];
  currentLoading = false;
  currentError = null;
  currentExecutedQuery = "";
}

describe("HulpPage", () => {
  beforeEach(resetMocks);

  it("does not render InteriorPageHero — hero is owned by the server layer", () => {
    render(<HulpPage paths={FIXTURE_PATHS} />);
    // InteriorPageHero renders a heading with the headline text. After extracting
    // the hero to page.tsx (server), HulpPage should NOT render it.
    expect(
      screen.queryByRole("heading", { name: /vind de juiste persoon/i }),
    ).not.toBeInTheDocument();
  });

  it("renders BrowseContent with all categories when no question is selected", () => {
    render(<HulpPage paths={FIXTURE_PATHS} />);
    // Each category that has paths should appear
    expect(screen.getByText("Administratief")).toBeInTheDocument();
    expect(screen.getByText("Medisch")).toBeInTheDocument();
    expect(screen.getByText("Sportief")).toBeInTheDocument();
    // Each fixture path should be rendered as a question card
    for (const path of FIXTURE_PATHS) {
      expect(screen.getByText(path.question)).toBeInTheDocument();
    }
  });

  it("calls useSemanticSearch when the user types in the search input", () => {
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "inschrijving" },
    });
    expect(mockSearch).toHaveBeenCalledWith("inschrijving");
  });

  it("renders search results when results map back to known paths", () => {
    currentResults = [
      {
        id: "lidgeld-inschrijving",
        slug: "lidgeld-inschrijving",
        type: "responsibility",
        score: 0.9,
        title: "Ik wil mij of mijn kind inschrijven",
        excerpt: "...",
      },
    ];
    currentExecutedQuery = "inschrijving";
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "inschrijving" },
    });
    expect(
      screen.getAllByText("Ik wil mij of mijn kind inschrijven").length,
    ).toBeGreaterThan(0);
  });

  it("falls back to BrowseContent with a no-results message when search has no matches", async () => {
    currentResults = [];
    currentExecutedQuery = "xyzz";
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "xyzz" },
    });
    await waitFor(() => {
      expect(
        screen.getByText(/Geen resultaten voor "xyzz"/),
      ).toBeInTheDocument();
    });
  });

  it("shows the skeleton grid while the debounced fetch has not settled yet", () => {
    // executedQuery still empty (no fetch has settled), but searchQuery is set
    currentResults = [];
    currentExecutedQuery = "";
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "inschrijving" },
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Zoeken naar resultaten...")).toBeInTheDocument();
    // Importantly, "Geen resultaten" must NOT flash during this window
    expect(screen.queryByText(/geen resultaten voor/i)).not.toBeInTheDocument();
  });

  it("renders the AnswerCard when ?id= matches a known path", () => {
    mockSearchParams = new URLSearchParams("id=lidgeld-inschrijving");
    render(<HulpPage paths={FIXTURE_PATHS} />);
    expect(
      screen.getByRole("heading", {
        name: /ik wil mij of mijn kind inschrijven/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /terug naar overzicht/i }),
    ).toBeInTheDocument();
  });

  it("falls back to browse when ?id= references an unknown path", () => {
    mockSearchParams = new URLSearchParams("id=does-not-exist");
    render(<HulpPage paths={FIXTURE_PATHS} />);
    // Browse should be visible — back button (only in answer view) absent
    expect(
      screen.queryByRole("button", { name: /terug naar overzicht/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Administratief")).toBeInTheDocument();
  });

  it("pushes ?id=… and tracks suggestion click when a question card is clicked", () => {
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: /ik wil mij of mijn kind inschrijven/i,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/hulp?id=lidgeld-inschrijving",
      expect.objectContaining({ scroll: false }),
    );
    expect(trackSuggestionClicked).toHaveBeenCalledWith(
      "lidgeld-inschrijving",
      "administratief",
      expect.any(Number),
    );
  });

  it("tracks search results when results settle", async () => {
    currentResults = [
      {
        id: "lidgeld-inschrijving",
        slug: "lidgeld-inschrijving",
        type: "responsibility",
        score: 0.9,
        title: "...",
        excerpt: "...",
      },
    ];
    currentExecutedQuery = "lidgeld";
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "lidgeld" },
    });
    await waitFor(() => {
      // Query is sanitized (lowercased + truncated to 50) before being
      // forwarded to analytics. For "lidgeld" the sanitized value is
      // identical, but the assertion encodes the privacy convention.
      expect(trackSearch).toHaveBeenCalledWith(
        sanitizeQuery("lidgeld"),
        "all",
        1,
      );
    });
  });

  it("tracks no_results event when search returns nothing", async () => {
    currentResults = [];
    currentExecutedQuery = "xyzz";
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "xyzz" },
    });
    await waitFor(() => {
      // trackNoResults is called with the sanitized length, not the raw
      // input length, per the project's analytics privacy convention.
      expect(trackNoResults).toHaveBeenCalledWith(
        sanitizeQuery("xyzz").length,
        "all",
      );
    });
  });

  it("does not fire analytics while search is loading", () => {
    currentLoading = true;
    currentExecutedQuery = "loading-test";
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "loading-test" },
    });
    expect(trackSearch).not.toHaveBeenCalled();
    expect(trackNoResults).not.toHaveBeenCalled();
  });

  it("does not fire analytics during the debounce window before results settle", () => {
    // Loading is false but no fetch has settled yet (executedQuery is "")
    currentResults = [];
    currentLoading = false;
    currentExecutedQuery = "";
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "inschrijving" },
    });
    expect(trackSearch).not.toHaveBeenCalled();
    expect(trackNoResults).not.toHaveBeenCalled();
  });

  it("renders the error message AND the browse content as a fallback", () => {
    currentError = "fetch failed";
    currentExecutedQuery = "inschrijving";
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "inschrijving" },
    });
    expect(
      screen.getByText(/er ging iets mis bij het zoeken/i),
    ).toBeInTheDocument();
    // The message tells the user to browse below — categories must be visible
    expect(screen.getByText("Administratief")).toBeInTheDocument();
    expect(screen.getByText("Medisch")).toBeInTheDocument();
  });

  it("does not push or track when clicking a question card whose id matches selectedIdParam", () => {
    // Race-window scenario: the URL still has `?id=lidgeld-inschrijving`
    // (router.replace hasn't propagated yet) but the user has typed
    // something into the search box, so search results render and the
    // matching question card is visible. Clicking it must be a no-op
    // because that path is already the "selected" one in the URL.
    mockSearchParams = new URLSearchParams("id=lidgeld-inschrijving");
    currentResults = [
      {
        id: "lidgeld-inschrijving",
        slug: "lidgeld-inschrijving",
        type: "responsibility",
        score: 0.9,
        title: "Ik wil mij of mijn kind inschrijven",
        excerpt: "...",
      },
    ];
    currentExecutedQuery = "inschrijving";
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "inschrijving" },
    });
    // Search results now render the matching question card. Clear the
    // mocks so we only assert what happens on the clicking step.
    mockPush.mockClear();
    trackSuggestionClicked.mockClear();
    fireEvent.click(
      screen.getByRole("button", {
        name: /ik wil mij of mijn kind inschrijven/i,
      }),
    );
    // Dedup guard in handlePathClick: id === selectedIdParam → return.
    expect(mockPush).not.toHaveBeenCalled();
    expect(trackSuggestionClicked).not.toHaveBeenCalled();
  });

  it("clears ?id= and shows search results when the user starts typing in answer view", () => {
    mockSearchParams = new URLSearchParams("id=lidgeld-inschrijving");
    render(<HulpPage paths={FIXTURE_PATHS} />);
    // Initially the answer view is shown
    expect(
      screen.getByRole("button", { name: /terug naar overzicht/i }),
    ).toBeInTheDocument();
    // Typing into the search input must dismiss the answer view AND
    // trigger router.replace to drop the ?id= query param
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "transfer" },
    });
    expect(
      screen.queryByRole("button", { name: /terug naar overzicht/i }),
    ).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/hulp", expect.anything());
  });

  it("renders the empty-data fallback when paths is an empty array", () => {
    render(<HulpPage paths={[]} />);
    expect(
      screen.getByRole("heading", { name: /nog geen vragen beschikbaar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /contact opnemen/i }),
    ).toHaveAttribute("href", "mailto:info@kcvvelewijt.be");
    // Browse content should NOT render in the empty-data state
    expect(screen.queryByText("Administratief")).not.toBeInTheDocument();
  });

  it("removes the ?id= param when the back button is clicked", () => {
    mockSearchParams = new URLSearchParams("id=lidgeld-inschrijving");
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.click(
      screen.getByRole("button", { name: /terug naar overzicht/i }),
    );
    expect(mockPush).toHaveBeenCalledWith("/hulp", expect.anything());
  });

  describe("clicking a result while a search is active", () => {
    it("clears search state and does not re-fire /search", () => {
      currentResults = [
        {
          id: "lidgeld-inschrijving",
          slug: "lidgeld-inschrijving",
          type: "responsibility",
          score: 0.9,
          title: "Ik wil mij of mijn kind inschrijven",
          excerpt: "...",
        },
      ];
      currentExecutedQuery = "inschrijving";
      currentLoading = false;

      render(<HulpPage paths={FIXTURE_PATHS} />);

      fireEvent.change(screen.getByRole("searchbox"), {
        target: { value: "inschrijving" },
      });

      const card = screen.getByRole("button", {
        name: /ik wil mij of mijn kind inschrijven/i,
      });

      mockSearch.mockClear();
      mockClear.mockClear();
      mockPush.mockClear();

      fireEvent.click(card);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("id=lidgeld-inschrijving"),
        { scroll: false },
      );

      expect(mockClear).toHaveBeenCalled();

      // The bug: search was re-fired with the old query after clicking
      expect(mockSearch).not.toHaveBeenCalledWith("inschrijving");
    });
  });

  it("shows a min-length hint when the query is exactly 1 character", () => {
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "U" },
    });
    expect(screen.getByText(/typ minstens 2 letters/i)).toBeInTheDocument();
  });

  it("does not call search when the query is only 1 character", () => {
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "U" },
    });
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("renders the empty results state with role=status and aria-live=polite", async () => {
    currentResults = [];
    currentExecutedQuery = "xyzz";
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "xyzz" },
    });
    await waitFor(() => {
      const statusEl = screen
        .getByText(/geen resultaten voor/i)
        .closest("[role='status']");
      expect(statusEl).toBeInTheDocument();
      expect(statusEl).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("loading skeleton", () => {
    it("shows the skeleton grid on the first search", () => {
      currentLoading = true;
      currentExecutedQuery = "";
      render(<HulpPage paths={FIXTURE_PATHS} />);

      fireEvent.change(screen.getByRole("searchbox"), {
        target: { value: "trainer" },
      });

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("Zoeken naar resultaten...")).toBeInTheDocument();
    });

    it("keeps stale results visible with reduced opacity on consecutive searches", () => {
      currentResults = [
        {
          id: "lidgeld-inschrijving",
          slug: "lidgeld-inschrijving",
          type: "responsibility",
          score: 0.9,
          title: "Ik wil mij of mijn kind inschrijven",
          excerpt: "...",
        },
      ];
      currentExecutedQuery = "inschrijving";
      currentLoading = true;

      render(<HulpPage paths={FIXTURE_PATHS} />);
      fireEvent.change(screen.getByRole("searchbox"), {
        target: { value: "inschrijving" },
      });

      // Stale results remain visible (no skeleton replaces them)
      expect(
        screen.getAllByText("Ik wil mij of mijn kind inschrijven").length,
      ).toBeGreaterThan(0);
      // The container has reduced opacity to signal staleness
      const resultsContainer = screen
        .getAllByText("Ik wil mij of mijn kind inschrijven")[0]
        .closest(".space-y-12");
      expect(resultsContainer?.className).toContain("opacity-50");
    });

    it("does not show the skeleton when search query is empty", () => {
      render(<HulpPage paths={FIXTURE_PATHS} />);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
