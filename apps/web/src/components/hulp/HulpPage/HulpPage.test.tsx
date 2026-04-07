/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HulpPage } from "./HulpPage";
import { FIXTURE_PATHS } from "./__fixtures__/paths.fixture";
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

  it("renders the PageHero with the Help label and headline", () => {
    render(<HulpPage paths={FIXTURE_PATHS} />);
    expect(screen.getByText("Help")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /vind de juiste persoon/i }),
    ).toBeInTheDocument();
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

  it('shows "Zoeken..." while the debounced fetch has not settled yet', () => {
    // executedQuery still empty (no fetch has settled), but searchQuery is set
    currentResults = [];
    currentExecutedQuery = "";
    render(<HulpPage paths={FIXTURE_PATHS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "inschrijving" },
    });
    expect(screen.getByText(/zoeken\.\.\./i)).toBeInTheDocument();
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
      expect(trackSearch).toHaveBeenCalledWith("lidgeld", "all", 1);
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
      expect(trackNoResults).toHaveBeenCalledWith(4, "all");
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
});
