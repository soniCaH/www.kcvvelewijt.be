/**
 * SearchInterface Component Tests
 * Most complex component - handles state, URL sync, fetch, and coordination
 */

import { StrictMode, useSyncExternalStore, type ReactNode } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInterface } from "./SearchInterface";
import { createMockSearchResponse } from "@/../tests/helpers/search.helpers";
import { trackEvent } from "@/lib/analytics/track-event";
import { useSemanticAugment } from "./useSemanticAugment";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));
const mockTrackEvent = vi.mocked(trackEvent);

// Mock Next.js navigation hooks — reactive: `push` feeds back into what
// `useSearchParams()` returns and notifies every mounted consumer, the way a
// real client-side navigation does. Mirrors the store `HulpFinder.test.tsx`
// uses. Before #2784 this mock was a bare `vi.fn()` that never touched
// `useSearchParams()`'s return value, which is exactly why the double-fetch
// this file now guards against went untested: the `currentUrlQueryValue`
// effect that `router.push` retriggers in real Next.js never actually fired
// here.
const searchParamsStore = vi.hoisted(() => {
  let current = new URLSearchParams();
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: (next: URLSearchParams) => {
      current = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});

function setMockSearchParams(params: Record<string, string>) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => next.set(key, value));
  searchParamsStore.set(next);
}

const mockPush = vi.fn((url: string) => {
  searchParamsStore.set(new URLSearchParams(url.split("?")[1] ?? ""));
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () =>
    useSyncExternalStore(searchParamsStore.subscribe, searchParamsStore.get),
}));

// Mock child components' dependencies
// Note: Kept in file due to Vitest hoisting requirements
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

// The semantic augment lane has its own fetch (POST /api/search) and tests
// (useSemanticAugment.test.ts). Stub it to "none" by default here so its
// request doesn't disturb the lexical fetch-count assertions in this file.
// A `vi.fn()`, not a fixed arrow, so the #2824 suppression/`search_failed`
// tests below can override the returned `kind` per test via
// `mockUseSemanticAugment.mockReturnValue(...)`.
vi.mock("./useSemanticAugment", () => ({
  useSemanticAugment: vi.fn(() => ({ kind: "none" })),
}));
const mockUseSemanticAugment = vi.mocked(useSemanticAugment);

describe("SearchInterface", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset the URL store to prevent cross-test leakage
    searchParamsStore.set(new URLSearchParams());

    // Setup fetch mock using vi.stubGlobal for proper cleanup
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    // `vi.clearAllMocks()` below (afterEach) clears calls but not a
    // `mockReturnValue` implementation set by an earlier test — re-assert
    // the file-wide default explicitly so #2824's per-test overrides never
    // leak into an unrelated test.
    mockUseSemanticAugment.mockReturnValue({ kind: "none" });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Initial Rendering", () => {
    it("should render search form", () => {
      render(<SearchInterface />);

      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^zoeken$/i }),
      ).toBeInTheDocument();
    });

    it("should display help text initially when no query", () => {
      render(<SearchInterface />);

      expect(screen.getByText(/niet zeker waar te/i)).toBeInTheDocument();
      // A type-hint chip, unique to the pre-search card.
      expect(screen.getByText("Een spelersnaam")).toBeInTheDocument();
    });

    it("should not display filters initially", () => {
      render(<SearchInterface />);

      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });

    it("should not display results initially", () => {
      render(<SearchInterface />);

      expect(screen.queryByText(/resultaten voor/i)).not.toBeInTheDocument();
    });
  });

  describe("Initial Props", () => {
    it("should ignore initialQuery prop when no URL params are present", async () => {
      // URL state takes precedence - initialQuery is intentionally not applied
      render(<SearchInterface initialQuery="initial search" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
    });

    it("should initialize with initialType prop", async () => {
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      setMockSearchParams({ q: "test", type: "article" });

      render(<SearchInterface initialType="article" />);

      // Wait for filters to appear
      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      // Article tab should be active
      const articleTab = screen.getByRole("button", { name: /nieuws/i });
      expect(articleTab).toHaveAttribute("aria-pressed", "true");
    });

    it("should respect URL params over initial props", async () => {
      setMockSearchParams({ q: "url query", type: "player" });

      const mockResponse = createMockSearchResponse("url query");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(
        <SearchInterface initialQuery="prop query" initialType="article" />,
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("url query");

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      const playerTab = screen.getByRole("button", { name: /spelers/i });
      expect(playerTab).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Search Submission", () => {
    it("should perform search when form is submitted", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("/api/search?q=test"),
          expect.any(Object),
        );
      });
    });

    it("should update URL when search is submitted", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/zoeken?q=test");
      });
    });

    it("should include type in URL when filter is active", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      setMockSearchParams({ q: "test" });

      render(<SearchInterface />);

      // Wait for search to complete and filters to appear
      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      // Click article filter
      const articleTab = screen.getByRole("button", { name: /nieuws/i });
      await user.click(articleTab);

      expect(mockPush).toHaveBeenCalledWith("/zoeken?q=test&type=article");
    });

    it("should trim whitespace from query", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("trimmed");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "  trimmed  ");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("q=trimmed"),
          expect.any(Object),
        );
      });
    });
  });

  describe("Fetch Behavior", () => {
    it("should display loading state during fetch", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockReturnValueOnce(promise);

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      // Should show loading spinner
      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      // Resolve promise
      resolvePromise!({
        ok: true,
        json: async () => createMockSearchResponse("test"),
      });

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });

    it("should display error when fetch fails", async () => {
      const user = userEvent.setup();
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/er ging iets mis/i)).toBeInTheDocument();
      });
    });

    it("should display error when response is not ok", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/er ging iets mis/i)).toBeInTheDocument();
      });
    });

    it("should display results after successful fetch", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/resultaten voor/i)).toBeInTheDocument();
      });
    });

    it("should not fetch when query is less than 2 characters", async () => {
      const user = userEvent.setup();

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      // Submit button should be disabled
      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      expect(submitButton).toBeDisabled();

      // Attempt submission via Enter key (should be prevented by validation)
      await user.keyboard("{Enter}");

      // Fetch should not have been called due to 2-char minimum validation
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("should clear results when query becomes empty", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/resultaten voor/i)).toBeInTheDocument();
      });

      // Clear search
      const clearButton = screen.getByRole("button", {
        name: /wis zoekopdracht/i,
      });
      await user.click(clearButton);

      // Results should be hidden, help text shown
      await waitFor(() => {
        expect(screen.queryByText(/resultaten voor/i)).not.toBeInTheDocument();
        expect(screen.getByText(/niet zeker waar te/i)).toBeInTheDocument();
      });
    });
  });

  describe("Request Cancellation", () => {
    it("should use AbortController for fetch requests", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            signal: expect.any(AbortSignal),
          }),
        );
      });
    });

    it("should abort previous request when new search is submitted", async () => {
      const user = userEvent.setup();
      let firstRequestAborted = false;

      // First request that never resolves (manually controlled)
      const firstRequestPromise = new Promise(() => {
        // Never resolves - will be aborted
      });

      fetchMock.mockImplementationOnce((_url, options) => {
        options?.signal?.addEventListener("abort", () => {
          firstRequestAborted = true;
        });
        return firstRequestPromise;
      });

      // Second request returns immediately
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSearchResponse("second"),
      });

      render(<SearchInterface />);

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });

      // First search - type directly (input is empty initially)
      const input = screen.getByRole("textbox");
      await user.type(input, "first");
      await user.click(submitButton);

      // Wait for the submit button to disable (loading started) — the input
      // itself stays enabled now (ZOEK-2 typeahead).
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Clear via clear button and type second query
      const clearButton = screen.getByRole("button", {
        name: /wis zoekopdracht/i,
      });
      await user.click(clearButton);

      await user.type(input, "second");
      await user.click(submitButton);

      // First request should be aborted when second request starts
      await waitFor(() => {
        expect(firstRequestAborted).toBe(true);
      });
    });

    it("should not update state when request is aborted", async () => {
      const user = userEvent.setup();

      // Mock that throws AbortError
      fetchMock.mockImplementationOnce(() => {
        const error = new Error("Aborted");
        error.name = "AbortError";
        throw error;
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      // Should not display error for aborted request
      await waitFor(
        () => {
          expect(
            screen.queryByText(/er ging iets mis/i),
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it("should abort in-flight request on unmount", async () => {
      const user = userEvent.setup();
      let capturedSignal: AbortSignal | undefined;

      fetchMock.mockImplementationOnce(
        (_url: string, options?: RequestInit) => {
          capturedSignal = options?.signal as AbortSignal;
          return new Promise(() => {}); // never resolves
        },
      );

      const { unmount } = render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(capturedSignal).toBeDefined();
      });

      unmount();

      expect(capturedSignal!.aborted).toBe(true);
    });
  });

  describe("Filter Changes", () => {
    it("should update URL when filter is changed", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      setMockSearchParams({ q: "test" });

      render(<SearchInterface />);

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      const articleTab = screen.getByRole("button", { name: /nieuws/i });
      await user.click(articleTab);

      expect(mockPush).toHaveBeenCalledWith("/zoeken?q=test&type=article");
    });

    it("should not refetch when filter is changed", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      setMockSearchParams({ q: "test" });

      render(<SearchInterface />);

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      const articleTab = screen.getByRole("button", { name: /nieuws/i });
      await user.click(articleTab);

      // Should still only have 1 fetch call (no refetch)
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("should remove type from URL when 'all' filter is selected", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      setMockSearchParams({ q: "test", type: "article" });

      render(<SearchInterface />);

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      const allTab = screen.getByRole("button", { name: /alles/i });
      await user.click(allTab);

      expect(mockPush).toHaveBeenCalledWith("/zoeken?q=test");
    });

    it("does not fire search_filter_changed or push the URL when the active chip is re-pressed (dedup guard, #2449)", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      setMockSearchParams({ q: "test" });

      render(<SearchInterface />);

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      // "Alles" is already active (no ?type= param) → re-pressing it is a
      // no-op: no analytics event, no URL push.
      const allTab = screen.getByRole("button", { name: /alles/i });
      await user.click(allTab);

      expect(
        mockTrackEvent.mock.calls.some(
          ([eventName]) => eventName === "search_filter_changed",
        ),
      ).toBe(false);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("still fires exactly one search_filter_changed carrying the new type when a different type is selected (#2449)", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      setMockSearchParams({ q: "test" });

      render(<SearchInterface />);

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      const articleTab = screen.getByRole("button", { name: /nieuws/i });
      await user.click(articleTab);

      const filterChangedCalls = mockTrackEvent.mock.calls.filter(
        ([eventName]) => eventName === "search_filter_changed",
      );
      expect(filterChangedCalls).toEqual([
        ["search_filter_changed", { filter_type: "article" }],
      ]);
      expect(mockPush).toHaveBeenCalledWith("/zoeken?q=test&type=article");
    });
  });

  describe("URL Synchronization", () => {
    it("should initialize state from URL params on mount", async () => {
      setMockSearchParams({ q: "initial", type: "article" });

      const mockResponse = createMockSearchResponse("initial");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      // Should initialize input with URL query
      await waitFor(
        () => {
          expect(screen.getByRole("textbox")).toHaveValue("initial");
        },
        { timeout: 3000 },
      );

      // Should perform search with URL query
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("q=initial"),
        expect.any(Object),
      );

      // Should initialize filter with URL type
      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      const articleTab = screen.getByRole("button", { name: /nieuws/i });
      expect(articleTab).toHaveAttribute("aria-pressed", "true");
    });

    it("should validate type param from URL", async () => {
      setMockSearchParams({ q: "test", type: "invalid" });

      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      // Should default to 'all' for invalid type
      const allTab = screen.getByRole("button", { name: /alles/i });
      expect(allTab).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Loading States", () => {
    it("disables the submit button during loading; the input stays enabled (ZOEK-2)", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockReturnValueOnce(promise);

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      // Submit disables during the fetch, but the input must stay enabled so a
      // debounced typeahead doesn't blur the field mid-type.
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
      expect(input).not.toBeDisabled();

      resolvePromise!({
        ok: true,
        json: async () => createMockSearchResponse("test"),
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("keeps the search field focused while a debounced auto-search loads (ZOEK-2)", async () => {
      const user = userEvent.setup();
      // Every fetch hangs so isLoading stays true through the typing window.
      const pending = new Promise(() => {});
      fetchMock.mockReturnValue(pending);

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      // Typing focuses the field; the SearchForm debounce (350ms) then fires the
      // auto-search, flipping isLoading WHILE the field is focused — and crucially
      // without a click that would hand focus off to a button.
      await user.type(input, "test");
      expect(input).toHaveFocus();

      // The debounced auto-search fires a request.
      await waitFor(() => expect(fetchMock).toHaveBeenCalled());

      // Regression guard (ZOEK-2): during loading the field must stay enabled AND
      // keep focus — disabling it (the old behaviour) blurred the typeahead
      // mid-type. This fails if focus is lost during the isLoading transition.
      expect(input).not.toBeDisabled();
      expect(input).toHaveFocus();

      // …and the user can keep typing without interruption.
      await user.type(input, "x");
      expect(input).toHaveValue("testx");
      expect(input).toHaveFocus();
    });

    it("should show spinner during loading", async () => {
      const user = userEvent.setup();
      // Promise intentionally left unresolved - AbortController cleanup
      // on test teardown prevents post-test state update warnings
      const promise = new Promise(() => {});

      fetchMock.mockReturnValueOnce(promise);

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });
    });

    it("should hide spinner after loading completes", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should clear error when new search is started", async () => {
      const user = userEvent.setup();

      // First search fails
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/er ging iets mis/i)).toBeInTheDocument();
      });

      // Second search succeeds
      const mockResponse = createMockSearchResponse("test2");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await user.clear(input);
      await user.type(input, "test2");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/er ging iets mis/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Failed search — semantic-answer suppression & search_failed (#2824)", () => {
    const failedSearchCalls = () =>
      mockTrackEvent.mock.calls.filter(
        ([eventName]) => eventName === "search_failed",
      );

    it("suppresses the failure notice when the semantic lane returns a high-confidence answer, and still counts the failure", async () => {
      const user = userEvent.setup();
      mockUseSemanticAugment.mockReturnValue({
        kind: "answer",
        answer: "Het eerste elftal speelt zaterdag om 15u.",
        sources: [],
      });
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      await user.click(screen.getByRole("button", { name: /^zoeken$/i }));

      // The answer card carries the visitor — it and the filters render
      // unchanged (AC bullet 1).
      await waitFor(() => {
        expect(screen.getByText("Slim antwoord")).toBeInTheDocument();
      });
      expect(screen.getByRole("group")).toBeInTheDocument();

      // The failure notice does not render at all.
      expect(screen.queryByText(/er ging iets mis/i)).not.toBeInTheDocument();

      // The failure is still counted, with answer_shown: true.
      await waitFor(() => {
        expect(failedSearchCalls()).toHaveLength(1);
      });
      expect(failedSearchCalls()).toEqual([
        [
          "search_failed",
          { query_text: "test", query_length: 4, answer_shown: true },
        ],
      ]);
    });

    it("keeps rendering the failure notice exactly as today when the semantic lane has no high-confidence answer", async () => {
      const user = userEvent.setup();
      // Default mock — the semantic lane resolved but scored below the
      // "answer" threshold (`useSemanticAugment`'s `related`/`none` split).
      mockUseSemanticAugment.mockReturnValue({ kind: "none" });
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      await user.click(screen.getByRole("button", { name: /^zoeken$/i }));

      await waitFor(() => {
        expect(screen.getByText(/er ging iets mis/i)).toBeInTheDocument();
      });
      expect(screen.queryByText("Slim antwoord")).not.toBeInTheDocument();

      await waitFor(() => {
        expect(failedSearchCalls()).toHaveLength(1);
      });
      expect(failedSearchCalls()).toEqual([
        [
          "search_failed",
          { query_text: "test", query_length: 4, answer_shown: false },
        ],
      ]);
    });

    it("keeps rendering the failure notice when both the lexical and semantic lanes are down", async () => {
      const user = userEvent.setup();
      // The semantic lane's own fetch failing settles to `{ kind: "none" }`
      // too (`useSemanticAugment`'s documented "POST error / 503 → none"
      // fallback) — same branch as the no-answer case above, exercised here
      // under its own name because the AC lists it as a distinct scenario.
      mockUseSemanticAugment.mockReturnValue({ kind: "none" });
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      await user.click(screen.getByRole("button", { name: /^zoeken$/i }));

      await waitFor(() => {
        expect(screen.getByText(/er ging iets mis/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(failedSearchCalls()).toHaveLength(1);
      });
      expect(failedSearchCalls()).toEqual([
        [
          "search_failed",
          { query_text: "test", query_length: 4, answer_shown: false },
        ],
      ]);
    });

    it("never suppresses the notice for the low-confidence 'Gerelateerd' lane", async () => {
      const user = userEvent.setup();
      mockUseSemanticAugment.mockReturnValue({
        kind: "related",
        items: [],
      });
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      await user.click(screen.getByRole("button", { name: /^zoeken$/i }));

      await waitFor(() => {
        expect(screen.getByText(/er ging iets mis/i)).toBeInTheDocument();
      });
    });

    it("fires search_failed exactly once per failed search, and does not re-fire when the semantic lane settles after the notice has already fired", async () => {
      mockUseSemanticAugment.mockReturnValue({ kind: "none" });
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      setMockSearchParams({ q: "test" });
      render(<SearchInterface />);

      await waitFor(() => {
        expect(screen.getByText(/er ging iets mis/i)).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(failedSearchCalls()).toHaveLength(1);
      });
      expect(failedSearchCalls()[0]).toEqual([
        "search_failed",
        { query_text: "test", query_length: 4, answer_shown: false },
      ]);

      // The semantic lane's own (independent) fetch settles to a
      // high-confidence answer AFTER the lexical failure already fired
      // search_failed. Force a re-render without touching
      // `error`/`isLoading`/`query` — re-asserting the same URL query is a
      // legitimate no-op trigger (e.g. a benign history replace) — and
      // confirm the fire-once guard holds even though `augment.kind` (an
      // effect dependency) changed.
      mockUseSemanticAugment.mockReturnValue({
        kind: "answer",
        answer: "Antwoord",
        sources: [],
      });
      act(() => {
        setMockSearchParams({ q: "test" });
      });

      await waitFor(() => {
        expect(screen.getByText("Slim antwoord")).toBeInTheDocument();
      });

      expect(failedSearchCalls()).toHaveLength(1);
    });
  });

  describe("Results Display", () => {
    it("should show filters when results are loaded", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });
    });

    it("should pass correct counts to filters", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      // Mock response has specific counts from mockSearchResults
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      // Verify total count is displayed on the "Alles" tab
      const tablist = screen.getByRole("group");
      const allesTab = within(tablist).getByRole("button", { name: /alles/i });
      expect(
        within(allesTab).getByText(mockResponse.count.toString()),
      ).toBeInTheDocument();
    });
  });

  describe("Conditional Rendering", () => {
    it("should show help text when query is empty", () => {
      render(<SearchInterface />);

      expect(screen.getByText(/niet zeker waar te/i)).toBeInTheDocument();
    });

    it("should show help text when query is 1 character", async () => {
      const user = userEvent.setup();

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      expect(screen.getByText(/niet zeker waar te/i)).toBeInTheDocument();
    });

    it("should hide help text when query is 2+ characters", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("ab");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "ab");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/niet zeker waar te/i),
        ).not.toBeInTheDocument();
      });
    });

    it("should not show results during loading", async () => {
      const user = userEvent.setup();
      // Promise intentionally left unresolved - AbortController cleanup
      // on test teardown prevents post-test state update warnings
      const promise = new Promise(() => {});

      fetchMock.mockReturnValueOnce(promise);

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      expect(screen.queryByText(/resultaten voor/i)).not.toBeInTheDocument();
    });

    it("should not show results when error occurs", async () => {
      const user = userEvent.setup();
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/er ging iets mis/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/resultaten voor/i)).not.toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("should complete full search flow", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("football");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      // 1. Type query
      const input = screen.getByRole("textbox");
      await user.type(input, "football");

      // 2. Submit search
      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      // 3. Wait for results
      await waitFor(() => {
        expect(screen.getByText(/resultaten voor/i)).toBeInTheDocument();
      });

      // 4. Verify URL was updated
      expect(mockPush).toHaveBeenCalledWith("/zoeken?q=football");

      // 5. Verify fetch was called
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("q=football"),
        expect.any(Object),
      );

      // 6. Verify filters are shown
      expect(screen.getByRole("group")).toBeInTheDocument();
    });

    it("should handle search, filter, then new search", async () => {
      const user = userEvent.setup();

      // First search
      const mockResponse1 = createMockSearchResponse("first");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse1,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "first");

      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      // Change filter
      const articleTab = screen.getByRole("button", { name: /nieuws/i });
      await user.click(articleTab);

      expect(mockPush).toHaveBeenCalledWith("/zoeken?q=first&type=article");

      // Second search
      const mockResponse2 = createMockSearchResponse("second");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse2,
      });

      await user.clear(input);
      await user.type(input, "second");
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });

      // Article filter should still be active
      expect(mockPush).toHaveBeenLastCalledWith(
        "/zoeken?q=second&type=article",
      );
    });
  });

  describe("Filter/query race regressions (PR #2783 review, finding 1)", () => {
    afterEach(() => {
      window.location.search = "";
    });

    it("does not silently drop a filter click made before the previous push's useSearchParams() catches up (1a)", async () => {
      const user = userEvent.setup();
      setMockSearchParams({ q: "test" });

      render(<SearchInterface />);

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      // First click: "all" -> "article". The mock's `push` now reactively
      // updates `useSearchParams()` (#2784), but the dedup guard in
      // `handleFilterChange` compares against the component's own
      // `activeType` state, never a value re-derived from the URL — so this
      // still exercises the thing the test is actually about.
      await user.click(screen.getByRole("button", { name: /nieuws/i }));
      expect(mockPush).toHaveBeenCalledTimes(1);

      // Second click, before the first "commits": "article" -> "all" again.
      // A dedup guard comparing against the hook's still-stale internal
      // value must not mistake this for a no-op.
      await user.click(screen.getByRole("button", { name: /alles/i }));

      expect(mockPush).toHaveBeenCalledTimes(2);
      expect(mockPush).toHaveBeenLastCalledWith(
        expect.not.stringContaining("type="),
      );
    });

    it("does not let a stale address bar clobber the query just submitted, when a filter click follows it (1b)", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("nieuw");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "nieuw");
      await user.click(screen.getByRole("button", { name: /^zoeken$/i }));

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      // Simulate a real router.push whose address-bar update hasn't landed
      // yet: the component has already moved on to "nieuw" (query state),
      // but window.location.search still reports the previous query.
      window.location.search = "q=oud";

      await user.click(screen.getByRole("button", { name: /nieuws/i }));

      const [lastUrl] = mockPush.mock.calls.at(-1)!;
      expect(new URLSearchParams(String(lastUrl).split("?")[1]).get("q")).toBe(
        "nieuw",
      );
    });
  });

  describe("Double-fetch guard on submit and typeahead (#2784)", () => {
    // Bug: `handleSearch`'s direct `performSearch(searchQuery)` call and the
    // `router.push` it also triggers both end up requesting the same query —
    // the push reactively changes what `useSearchParams()` returns, which
    // retriggers the component's own URL-watching effect. Went untested
    // because the old `next/navigation` mock never fed `push` back into
    // `useSearchParams()` (see the mock block at the top of this file).

    it("issues exactly one fetch when a search is submitted", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      await user.click(screen.getByRole("button", { name: /^zoeken$/i }));

      await waitFor(() => {
        expect(screen.getByText(/resultaten voor/i)).toBeInTheDocument();
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("issues exactly one fetch for a 350ms typeahead pause", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("typeah");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      // No Enter / submit click — SearchForm's own 350ms debounce fires
      // `onSearch` once typing stops (ZOEK-2).
      await user.type(input, "typeah");

      await waitFor(
        () => {
          expect(fetchMock).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      // Give a redundant, effect-driven second fetch a chance to land before
      // asserting the final count.
      await waitFor(() => {
        expect(screen.getByText(/resultaten voor/i)).toBeInTheDocument();
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("retries with a fresh fetch when the identical query is resubmitted after a failed search", async () => {
      const user = userEvent.setup();
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/er ging iets mis/i)).toBeInTheDocument();
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // The only retry a visitor has: no retry button on the error state, so
      // pressing "Zoeken" again with the identical query is it. This is
      // exactly the regression that ruled out having `handleSearch` stop
      // calling `performSearch` directly — in REAL Next.js, `router.push` to
      // an unchanged URL is a `replaceState` (no history entry, no
      // `useSearchParams()` change), so the URL-watching effect would never
      // re-fire and this retry would silently do nothing. This mock doesn't
      // literally implement that replaceState no-op (`mockPush` always hands
      // the store a fresh `URLSearchParams`) — this test instead passes
      // because `currentUrlQueryValue` is a derived *string*, and React's
      // effect-dependency comparison is by value, so an unchanged "q" never
      // looks like a change to the effect either way.
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });
      await waitFor(() => {
        expect(screen.queryByText(/er ging iets mis/i)).not.toBeInTheDocument();
      });
    });

    it("searches again for each query across browser back/forward between two different queries", async () => {
      setMockSearchParams({ q: "first" });
      const firstResponse = createMockSearchResponse("first");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => firstResponse,
      });

      render(<SearchInterface />);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("q=first"),
          expect.any(Object),
        );
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      // Let the fetch's promise chain (and the results-tracking effect it
      // feeds) fully settle before moving on — otherwise a floating
      // microtask from this stage can land its `setResults`/tracking call
      // during a LATER test instead of this one.
      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });

      // Simulate browser "back" to a different query — a URL change that
      // happens WITHOUT the component ever calling `router.push` itself.
      const secondResponse = createMockSearchResponse("second");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => secondResponse,
      });
      act(() => {
        setMockSearchParams({ q: "second" });
      });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("q=second"),
          expect.any(Object),
        );
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });

      // Simulate browser "forward" back to the first query.
      const thirdResponse = createMockSearchResponse("first");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => thirdResponse,
      });
      act(() => {
        setMockSearchParams({ q: "first" });
      });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(3);
      });
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("q=first"),
        expect.any(Object),
      );
      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });

    it("recovers under React StrictMode's dev-only mount→cleanup→remount cycle instead of spinning forever (#2784 review)", async () => {
      // StrictMode preserves refs across its synthetic
      // mount→cleanup→remount: pass 1's mount effect starts a fetch and sets
      // `lastRequestedQueryRef`; the cleanup effect then aborts that
      // in-flight request; pass 2's mount effect re-runs the URL-watching
      // effect. Without resetting the ref on that abort, pass 2 sees the
      // query as already "covered" and skips re-fetching — the aborted
      // request's own `finally` never clears `isLoading` either, so the
      // page is stuck on the spinner forever. Production builds don't
      // double-invoke, so this never reaches a visitor — but it breaks the
      // page in local dev and on every Fast Refresh of this file.
      setMockSearchParams({ q: "test" });
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      render(
        <StrictMode>
          <SearchInterface />
        </StrictMode>,
      );

      await waitFor(
        () => {
          expect(screen.getByText(/resultaten voor/i)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("Results-tracking effect on a no-op re-render (#2913)", () => {
    // The URL-preset mount path emits a spurious `search_no_results` before
    // the fetch settles — a separate defect, tracked as #2918. These tests
    // drive the component through type-and-submit so they exercise the
    // render-loop path this ticket fixes.
    it("does not re-fire search_results_shown when nothing about the results, query, filter or load state changed", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { rerender } = render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      await user.click(screen.getByRole("button", { name: /^zoeken$/i }));

      const resultsShownCalls = () =>
        mockTrackEvent.mock.calls.filter(
          ([eventName]) => eventName === "search_results_shown",
        );

      await waitFor(() => {
        expect(resultsShownCalls()).toHaveLength(1);
      });
      expect(resultsShownCalls()).toEqual([
        [
          "search_results_shown",
          { results_count: mockResponse.count, query_text: "test" },
        ],
      ]);

      // Force a re-render of the same instance with no change to the query,
      // the result set, the active type filter, or the loading/error state —
      // e.g. a parent re-render, or any unrelated state update elsewhere in
      // the tree. Before the fix, `useSearchAnalytics()`'s freshly-allocated
      // return object was in the effect's dep array, so this alone re-fired
      // the event.
      rerender(<SearchInterface />);

      expect(resultsShownCalls()).toHaveLength(1);
    });

    it("does not re-fire search_no_results when nothing about the results, query, filter or load state changed", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("nothing", []);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { rerender } = render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "nothing");
      await user.click(screen.getByRole("button", { name: /^zoeken$/i }));

      const noResultsCalls = () =>
        mockTrackEvent.mock.calls.filter(
          ([eventName]) => eventName === "search_no_results",
        );

      await waitFor(() => {
        expect(noResultsCalls()).toHaveLength(1);
      });
      expect(noResultsCalls()).toEqual([
        [
          "search_no_results",
          { query_text: "nothing", query_length: "nothing".length },
        ],
      ]);

      rerender(<SearchInterface />);

      expect(noResultsCalls()).toHaveLength(1);
    });

    it("still re-reports exactly once when switching to a different type filter", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { rerender } = render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      await user.click(screen.getByRole("button", { name: /^zoeken$/i }));

      const resultsShownCalls = () =>
        mockTrackEvent.mock.calls.filter(
          ([eventName]) => eventName === "search_results_shown",
        );

      await waitFor(() => {
        expect(resultsShownCalls()).toHaveLength(1);
      });

      const articleCount = mockResponse.results.filter(
        (result) => result.type === "article",
      ).length;
      const articleTab = screen.getByRole("button", { name: /nieuws/i });
      await user.click(articleTab);

      // Settle on a DOM signal unrelated to the tracked call count (the tab's
      // pressed state, which commits in the same render as the effect) rather
      // than waiting for `resultsShownCalls()` to reach 2 — polling the count
      // itself would resolve the instant it hits 2 and never notice a third,
      // spurious call landing a render later.
      await waitFor(() => {
        expect(articleTab).toHaveAttribute("aria-pressed", "true");
      });

      // Force one more no-op re-render (same pattern as the two tests above)
      // to catch a spurious call landing a render after the filter change
      // settles, not just one racing the `waitFor` above.
      rerender(<SearchInterface />);

      expect(resultsShownCalls()).toHaveLength(2);
      expect(resultsShownCalls().at(-1)).toEqual([
        "search_results_shown",
        { results_count: articleCount, query_text: "test" },
      ]);
    });
  });

  describe("Results-tracking effect on the URL-preset mount path (#2918)", () => {
    // A shared link, a page refresh, or a back/forward into `/zoeken?q=...`
    // mounts (or re-syncs) with `query` already set from the URL, but before
    // the mount-fetch effect has even run. On that first commit `results` is
    // still its initial `[]`, `isLoading` is still `false`, and `error` is
    // still `false` — indistinguishable from a settled empty result set. The
    // #2913 tests above deliberately drive the component through
    // type-and-submit, where `handleSearch` sets `isLoading` synchronously in
    // the same tick as `query`, so they never exercise this window.
    const noResultsCalls = () =>
      mockTrackEvent.mock.calls.filter(
        ([eventName]) => eventName === "search_no_results",
      );
    const resultsShownCalls = () =>
      mockTrackEvent.mock.calls.filter(
        ([eventName]) => eventName === "search_results_shown",
      );

    it("emits no search_no_results at all when the URL-preset query has results", async () => {
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      setMockSearchParams({ q: "test" });
      render(<SearchInterface />);

      await waitFor(() => {
        expect(resultsShownCalls()).toHaveLength(1);
      });
      expect(resultsShownCalls()).toEqual([
        [
          "search_results_shown",
          { results_count: mockResponse.count, query_text: "test" },
        ],
      ]);
      expect(noResultsCalls()).toHaveLength(0);
    });

    it("emits exactly one search_no_results, after the fetch settles, when the URL-preset query has no results", async () => {
      const mockResponse = createMockSearchResponse("nothing", []);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      setMockSearchParams({ q: "nothing" });
      render(<SearchInterface />);

      await waitFor(() => {
        expect(screen.getByText(/geen treffers/i)).toBeInTheDocument();
      });

      expect(noResultsCalls()).toEqual([
        [
          "search_no_results",
          { query_text: "nothing", query_length: "nothing".length },
        ],
      ]);
    });

    it("does not double-fire under React StrictMode's dev-only mount→cleanup→remount cycle", async () => {
      const mockResponse = createMockSearchResponse("nothing", []);
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      setMockSearchParams({ q: "nothing" });
      render(
        <StrictMode>
          <SearchInterface />
        </StrictMode>,
      );

      await waitFor(() => {
        expect(screen.getByText(/geen treffers/i)).toBeInTheDocument();
      });

      expect(noResultsCalls()).toHaveLength(1);
    });

    it("does not emit a bogus search_no_results for the stale-results commit when back/forward lands on a different query", async () => {
      const firstResponse = createMockSearchResponse("first");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => firstResponse,
      });

      setMockSearchParams({ q: "first" });
      render(<SearchInterface />);

      await waitFor(() => {
        expect(resultsShownCalls()).toHaveLength(1);
      });

      // Simulate browser back/forward to a query this component never
      // fetched before, without ever going through `handleSearch` (so
      // `isLoading` is not set synchronously in the same tick as `query`).
      const secondResponse = createMockSearchResponse("second", []);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => secondResponse,
      });
      act(() => {
        setMockSearchParams({ q: "second" });
      });

      await waitFor(() => {
        expect(screen.getByText(/geen treffers/i)).toBeInTheDocument();
      });

      // Exactly one no-results event for "second" — never one for "first"'s
      // stale (non-empty) results mislabelled under the new query text, and
      // never a spurious extra firing from the render where `query` had
      // already moved to "second" but `results` had not yet caught up.
      expect(noResultsCalls()).toEqual([
        [
          "search_no_results",
          { query_text: "second", query_length: "second".length },
        ],
      ]);
    });

    it("does not resurrect a stale search_no_results after the query drops below the 2-char threshold and returns to a previously-settled query", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      setMockSearchParams({ q: "test" });
      render(<SearchInterface />);

      await waitFor(() => {
        expect(resultsShownCalls()).toHaveLength(1);
      });

      // Drop below the 2-char threshold — the clear button routes through
      // `handleSearch("")`, which hits `performSearch`'s short-query reset
      // branch. That branch resets `results`/`isLoading`/`error` but (before
      // the fix) leaves `lastSettledQuery` at "test".
      const clearButton = screen.getByRole("button", {
        name: /wis zoekopdracht/i,
      });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText(/niet zeker waar te/i)).toBeInTheDocument();
      });

      // Return to the exact same, previously-settled query — e.g. browser
      // forward — without ever going through `handleSearch` again, so
      // nothing re-primes `lastSettledQuery` before this commit lands.
      const secondResponse = createMockSearchResponse("test");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => secondResponse,
      });
      act(() => {
        setMockSearchParams({ q: "test" });
      });

      await waitFor(() => {
        expect(resultsShownCalls()).toHaveLength(2);
      });

      // Zero search_no_results anywhere in this sequence — the bug fires it
      // on the commit BEFORE the refetch settles, so asserting only at the
      // end (after the correct event lands) would miss it.
      expect(noResultsCalls()).toHaveLength(0);
    });
  });
});
