/**
 * SearchInterface Component Tests
 * Most complex component - handles state, URL sync, fetch, and coordination
 */

import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInterface } from "./SearchInterface";
import { createMockSearchResponse } from "@/../tests/helpers/search.helpers";
import { trackEvent } from "@/lib/analytics/track-event";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));
const mockTrackEvent = vi.mocked(trackEvent);

// Mock Next.js navigation hooks
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
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
// (useSemanticAugment.test.ts). Stub it to "none" here so its request doesn't
// disturb the lexical fetch-count assertions in this file.
vi.mock("./useSemanticAugment", () => ({
  useSemanticAugment: () => ({ kind: "none" }),
}));

describe("SearchInterface", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear all params to prevent cross-test leakage
    Array.from(mockSearchParams.keys()).forEach((key) => {
      mockSearchParams.delete(key);
    });

    // Setup fetch mock using vi.stubGlobal for proper cleanup
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
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

      mockSearchParams.set("q", "test");
      mockSearchParams.set("type", "article");

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
      mockSearchParams.set("q", "url query");
      mockSearchParams.set("type", "player");

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

      mockSearchParams.set("q", "test");

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

      mockSearchParams.set("q", "test");

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

      mockSearchParams.set("q", "test");

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

      mockSearchParams.set("q", "test");
      mockSearchParams.set("type", "article");

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

      mockSearchParams.set("q", "test");

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

      mockSearchParams.set("q", "test");

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
      mockSearchParams.set("q", "initial");
      mockSearchParams.set("type", "article");

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
      mockSearchParams.set("q", "test");
      mockSearchParams.set("type", "invalid");

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
      mockSearchParams.set("q", "test");

      render(<SearchInterface />);

      await waitFor(() => {
        expect(screen.getByRole("group")).toBeInTheDocument();
      });

      // First click: "all" -> "article". `mockSearchParams` (what
      // useSearchParams() returns) is deliberately NOT updated by this —
      // exactly like a real router.push whose transition hasn't landed yet.
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
});
