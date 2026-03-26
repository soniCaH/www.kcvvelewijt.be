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
        screen.getByRole("button", { name: /^zoek$/i }),
      ).toBeInTheDocument();
    });

    it("should display help text initially when no query", () => {
      render(<SearchInterface />);

      expect(screen.getByText(/wat wil je zoeken/i)).toBeInTheDocument();
      expect(screen.getByText(/typ minimaal 2 karakters/i)).toBeInTheDocument();
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
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      // Article tab should be active
      const articleTab = screen.getByRole("tab", { name: /nieuws/i });
      expect(articleTab).toHaveAttribute("aria-selected", "true");
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
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      const playerTab = screen.getByRole("tab", { name: /spelers/i });
      expect(playerTab).toHaveAttribute("aria-selected", "true");
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      // Click article filter
      const articleTab = screen.getByRole("tab", { name: /nieuws/i });
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/er is een fout opgetreden/i),
        ).toBeInTheDocument();
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/er is een fout opgetreden/i),
        ).toBeInTheDocument();
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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
      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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
        expect(screen.getByText(/wat wil je zoeken/i)).toBeInTheDocument();
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });

      // First search - type directly (input is empty initially)
      const input = screen.getByRole("textbox");
      await user.type(input, "first");
      await user.click(submitButton);

      // Wait for input to be disabled (loading starts)
      await waitFor(() => {
        expect(input).toBeDisabled();
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
      await user.click(submitButton);

      // Should not display error for aborted request
      await waitFor(
        () => {
          expect(
            screen.queryByText(/er is een fout opgetreden/i),
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
      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      const articleTab = screen.getByRole("tab", { name: /nieuws/i });
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
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      const articleTab = screen.getByRole("tab", { name: /nieuws/i });
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
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      const allTab = screen.getByRole("tab", { name: /alles/i });
      await user.click(allTab);

      expect(mockPush).toHaveBeenCalledWith("/zoeken?q=test");
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
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      const articleTab = screen.getByRole("tab", { name: /nieuws/i });
      expect(articleTab).toHaveAttribute("aria-selected", "true");
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
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      // Should default to 'all' for invalid type
      const allTab = screen.getByRole("tab", { name: /alles/i });
      expect(allTab).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Loading States", () => {
    it("should disable form during loading", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockReturnValueOnce(promise);

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
      await user.click(submitButton);

      // Input should be disabled
      await waitFor(() => {
        expect(input).toBeDisabled();
      });

      resolvePromise!({
        ok: true,
        json: async () => createMockSearchResponse("test"),
      });

      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/er is een fout opgetreden/i),
        ).toBeInTheDocument();
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
        expect(
          screen.queryByText(/er is een fout opgetreden/i),
        ).not.toBeInTheDocument();
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("tablist")).toBeInTheDocument();
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      // Verify total count is displayed on the "Alles" tab
      const tablist = screen.getByRole("tablist");
      const allesTab = within(tablist).getByRole("tab", { name: /alles/i });
      expect(
        within(allesTab).getByText(mockResponse.count.toString()),
      ).toBeInTheDocument();
    });
  });

  describe("Conditional Rendering", () => {
    it("should show help text when query is empty", () => {
      render(<SearchInterface />);

      expect(screen.getByText(/wat wil je zoeken/i)).toBeInTheDocument();
    });

    it("should show help text when query is 1 character", async () => {
      const user = userEvent.setup();

      render(<SearchInterface />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      expect(screen.getByText(/wat wil je zoeken/i)).toBeInTheDocument();
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/wat wil je zoeken/i),
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/er is een fout opgetreden/i),
        ).toBeInTheDocument();
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
      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
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
      expect(screen.getByRole("tablist")).toBeInTheDocument();
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

      const submitButton = screen.getByRole("button", { name: /^zoek$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });

      // Change filter
      const articleTab = screen.getByRole("tab", { name: /nieuws/i });
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
});
