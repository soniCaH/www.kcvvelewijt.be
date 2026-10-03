import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react";
import type { ImageProps } from "next/image";
import { NewsListingClient } from "./NewsListingClient";
import type { ArticleVM } from "@/lib/repositories/article.repository";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

const mockFetchArticles = vi.fn();

function makeArticle(overrides: Partial<ArticleVM> = {}): ArticleVM {
  const id = overrides.id ?? `article-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    title: overrides.title ?? "Test Article",
    slug: overrides.title?.toLowerCase().replace(/\s/g, "-") ?? "test",
    publishedAt: "2026-03-15T10:00:00Z",
    featured: false,
    coverImageUrl: null,
    tags: overrides.tags ?? [],
    articleType: null,
    subjects: null,
    firstTransferFact: null,
    firstEventFact: null,
    ...overrides,
  };
}

const categories = [
  {
    id: "Eerste ploeg",
    attributes: { name: "Eerste ploeg", slug: "Eerste ploeg" },
  },
  { id: "Jeugd", attributes: { name: "Jeugd", slug: "Jeugd" } },
];

describe("NewsListingClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // `vi.spyOn(window.history, "pushState")` (used below) leaves a spy
    // installed on the shared jsdom `window.history` instance across tests —
    // `clearAllMocks` only resets call logs, not the wrapping itself, so a
    // later test's spy would inherit an earlier test's already-recorded
    // calls. Restore the real implementation between tests too.
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/nieuws");
  });

  const clickLoadMore = () =>
    fireEvent.click(screen.getByRole("button", { name: "Meer nieuws laden" }));

  it("renders every article in one chronological grid (#2569)", () => {
    render(
      <NewsListingClient
        initialArticles={[
          makeArticle({ id: "a1", title: "Article One" }),
          makeArticle({ id: "a2", title: "Article Two" }),
          makeArticle({ id: "a3", title: "Article Three" }),
          makeArticle({ id: "a4", title: "Article Four" }),
        ]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    // `<EditorialHeading>` appends a trailing period — match optional `.`.
    for (const title of [
      "Article One",
      "Article Two",
      "Article Three",
      "Article Four",
    ]) {
      expect(
        screen.getByRole("heading", { name: new RegExp(`^${title}\\.?$`) }),
      ).toBeInTheDocument();
    }
  });

  it("drops the 'Uitgelicht' row — an archive is chronological (#2569)", () => {
    const { container } = render(
      <NewsListingClient
        initialArticles={[
          makeArticle({ id: "a1", title: "Article One" }),
          makeArticle({ id: "a2", title: "Article Two" }),
        ]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: /uitgelicht/i }),
    ).not.toBeInTheDocument();

    // One grid, on the shared 1 → 2 → 3 ladder at the `md` gutter.
    const grids = container.querySelectorAll("[data-columns]");
    expect(grids).toHaveLength(1);
    expect(grids[0]!.getAttribute("data-columns")).toBe("3");
    expect(grids[0]!.getAttribute("data-gap")).toBe("md");
  });

  it("renders one uniform card size — no featured variant, no dek (#2569)", () => {
    const { container } = render(
      <NewsListingClient
        initialArticles={[
          makeArticle({
            id: "a1",
            title: "Article One",
            lead: "Deze samenvatting hoort niet in de grid.",
          }),
          makeArticle({ id: "a2", title: "Article Two" }),
          makeArticle({ id: "a3", title: "Article Three" }),
        ]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    expect(
      screen.queryByText("Deze samenvatting hoort niet in de grid."),
    ).not.toBeInTheDocument();

    const links = container.querySelectorAll("a[data-variant]");
    expect(links).toHaveLength(3);
    for (const link of links) {
      expect(link.getAttribute("data-variant")).toBe("standard");
    }

    // The locked 16:9 image region survives on every card, and no card is
    // height-matched to a neighbour (the retired 2fr|1fr split's `flex-1
    // aspect-auto`, #2027).
    const cards = container.querySelectorAll("article");
    expect(cards.length).toBe(3);
    for (const card of cards) {
      expect(card.className).not.toMatch(/\baspect-auto\b/);
      expect(card.className).not.toMatch(/\bflex-1\b/);
    }
    const imageRegions = container.querySelectorAll(
      '[data-testid="newscard-image-region"]',
    );
    expect(imageRegions.length).toBe(3);
    for (const region of imageRegions) {
      expect(region.getAttribute("data-aspect")).toBe("landscape-16-9");
    }
  });

  it("shows the load-more button only when there are more articles (NEWS-1)", () => {
    render(
      <NewsListingClient
        initialArticles={[makeArticle({ id: "g1" })]}
        categories={categories}
        hasMore={true}
        fetchArticles={mockFetchArticles}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Meer nieuws laden" }),
    ).toBeInTheDocument();

    cleanup();

    render(
      <NewsListingClient
        initialArticles={[makeArticle({ id: "g1" })]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Meer nieuws laden" }),
    ).not.toBeInTheDocument();
  });

  it("renders category filter tabs as buttons", () => {
    render(
      <NewsListingClient
        initialArticles={[makeArticle()]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    expect(screen.getByRole("button", { name: "Alles" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Eerste ploeg" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Jeugd" })).toBeInTheDocument();
  });

  it("shows empty state when no articles match category", async () => {
    mockFetchArticles.mockResolvedValue({ items: [], hasMore: false });

    render(
      <NewsListingClient
        initialArticles={[]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    // Click a category tab
    fireEvent.click(screen.getByRole("button", { name: "Jeugd" }));

    await waitFor(() => {
      expect(screen.getByText(/geen artikelen/i)).toBeInTheDocument();
    });
  });

  it("names the facet by name even when id, slug and name diverge", async () => {
    // `CategoryFilters` builds tab values from `attributes.slug` (matching
    // `?categorie=`), never `id` — a fixture where the three strings differ
    // guards against matching the empty-state facet name on the wrong field
    // (#2562 review).
    mockFetchArticles.mockResolvedValue({ items: [], hasMore: false });
    const divergentCategories = [
      { id: "cat-42", attributes: { name: "Jeugdwerking", slug: "jeugd" } },
    ];

    render(
      <NewsListingClient
        initialArticles={[]}
        categories={divergentCategories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Jeugdwerking" }));

    await waitFor(() => {
      expect(
        screen.getByText(/geen artikelen in jeugdwerking/i),
      ).toBeInTheDocument();
    });
  });

  it("marks the 'Toon alles' undo with the nieuws source + active facet for the global analytics listener (#2719)", async () => {
    // The click-to-`empty_state_undo` wiring itself is no longer this
    // component's concern — one global listener (`EmptyStateUndoTracker`,
    // mounted once near the root layout) owns that, and is tested on its
    // own. This host's job is only to supply the correct
    // `analyticsSource`/`analyticsFacet` structural props, which
    // `<EmptyState>` renders as inert `data-*` attributes.
    mockFetchArticles.mockResolvedValue({ items: [], hasMore: false });

    render(
      <NewsListingClient
        initialArticles={[]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Jeugd" }));
    await waitFor(() => {
      expect(screen.getByText(/geen artikelen in jeugd/i)).toBeInTheDocument();
    });

    const undo = screen.getByRole("button", { name: "Toon alles" });
    expect(undo).toHaveAttribute("data-empty-state-undo-source", "nieuws");
    expect(undo).toHaveAttribute("data-empty-state-undo-facet", "Jeugd");
  });

  it("deduplicates articles returned by loadMore against the grid", async () => {
    const initial = [
      makeArticle({ id: "a1", title: "Article One" }),
      makeArticle({ id: "a2", title: "Article Two" }),
      makeArticle({ id: "a3", title: "Article Three" }),
      makeArticle({ id: "a4", title: "Article Four" }),
      makeArticle({ id: "a5", title: "Article Five" }),
      makeArticle({ id: "a6", title: "Article Six" }),
    ];

    // loadMore returns a mix of duplicates (a3, a6) and new articles (a7, a8)
    mockFetchArticles.mockResolvedValue({
      items: [
        makeArticle({ id: "a3", title: "Article Three" }),
        makeArticle({ id: "a6", title: "Article Six" }),
        makeArticle({ id: "a7", title: "Article Seven" }),
        makeArticle({ id: "a8", title: "Article Eight" }),
      ],
      hasMore: false,
    });

    render(
      <NewsListingClient
        initialArticles={initial}
        categories={categories}
        hasMore={true}
        fetchArticles={mockFetchArticles}
      />,
    );

    // Click the load-more button (replaces the old infinite-scroll trigger).
    clickLoadMore();

    // New articles should appear, duplicates should not create extra DOM nodes.
    // EditorialHeading appends a period, so match by heading role with optional `.`.
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /^Article Seven\.?$/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^Article Eight\.?$/ }),
      ).toBeInTheDocument();
    });

    // Verify no duplicate IDs in the rendered output
    const allArticleTitles = [
      "Article One",
      "Article Two",
      "Article Three",
      "Article Four",
      "Article Five",
      "Article Six",
      "Article Seven",
      "Article Eight",
    ];
    for (const title of allArticleTitles) {
      const elements = screen.getAllByRole("heading", {
        name: new RegExp(`^${title}\\.?$`),
      });
      expect(elements).toHaveLength(1);
    }
  });

  it("deduplicates articles after category change", async () => {
    mockFetchArticles.mockResolvedValue({
      items: [
        makeArticle({ id: "c1", title: "Cat One" }),
        makeArticle({ id: "c1", title: "Cat One" }), // duplicate in the batch
        makeArticle({ id: "c2", title: "Cat Two" }),
        makeArticle({ id: "c3", title: "Cat Three" }),
        makeArticle({ id: "c4", title: "Cat Four" }),
      ],
      hasMore: false,
    });

    render(
      <NewsListingClient
        initialArticles={[makeArticle({ id: "a1", title: "First Article" })]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Jeugd" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /^Cat Four\.?$/ }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getAllByRole("heading", { name: /^Cat One\.?$/ }),
    ).toHaveLength(1);
  });

  it("writes ?categorie= via history.pushState (not router.push), adding a real history entry", async () => {
    mockFetchArticles.mockResolvedValue({ items: [], hasMore: false });
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    render(
      <NewsListingClient
        initialArticles={[]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Jeugd" }));

    await waitFor(() => {
      expect(pushStateSpy).toHaveBeenCalledWith(
        window.history.state,
        "",
        "/nieuws?categorie=Jeugd",
      );
    });
    expect(window.location.search).toBe("?categorie=Jeugd");
  });

  it("fetches exactly once per category change — no server round-trip double-fetch (#2564 review finding 3)", async () => {
    mockFetchArticles.mockResolvedValue({ items: [], hasMore: false });

    render(
      <NewsListingClient
        initialArticles={[makeArticle({ id: "a1", title: "Article One" })]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Jeugd" }));

    await waitFor(() => {
      expect(mockFetchArticles).toHaveBeenCalledTimes(1);
    });
    // A `router.push`-triggered server round-trip would show up as a second
    // call shortly after — give it a beat, then confirm it never arrives.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockFetchArticles).toHaveBeenCalledTimes(1);
  });

  it("re-fetches the URL's category on browser back/forward (popstate) without pushing the URL again", async () => {
    mockFetchArticles.mockResolvedValueOnce({
      items: [makeArticle({ id: "j1", title: "Jeugd Article" })],
      hasMore: false,
    });

    render(
      <NewsListingClient
        initialArticles={[makeArticle({ id: "a1", title: "Article One" })]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Jeugd" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /^Jeugd Article\.?$/ }),
      ).toBeInTheDocument(),
    );

    // Simulate what the browser itself does on a back press: move the URL,
    // then fire `popstate` (jsdom/happy-dom don't do this from a real back
    // button, since there's no real session history in a test).
    mockFetchArticles.mockResolvedValueOnce({
      items: [makeArticle({ id: "a2", title: "All Article" })],
      hasMore: false,
    });
    window.history.pushState({}, "", "/nieuws");
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /^All Article\.?$/ }),
      ).toBeInTheDocument(),
    );
    // Our own popstate handler must not push a second history entry on top
    // of the browser's own back-navigation.
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it("narrows a stale/bogus ?categorie= from back/forward instead of handing it to fetchArticles raw (PR #2783 review, finding 4)", async () => {
    mockFetchArticles.mockResolvedValueOnce({
      items: [makeArticle({ id: "j1", title: "Jeugd Article" })],
      hasMore: false,
    });

    render(
      <NewsListingClient
        initialArticles={[makeArticle({ id: "a1", title: "Article One" })]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Jeugd" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /^Jeugd Article\.?$/ }),
      ).toBeInTheDocument(),
    );

    // A category since renamed or removed — nothing in `categories` matches
    // it. The raw, unnarrowed slug must never reach fetchArticles.
    mockFetchArticles.mockResolvedValueOnce({
      items: [makeArticle({ id: "a2", title: "All Article" })],
      hasMore: false,
    });
    window.history.pushState({}, "", "/nieuws?categorie=Verwijderd");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /^All Article\.?$/ }),
      ).toBeInTheDocument(),
    );
    expect(mockFetchArticles).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: undefined }),
    );

    // Internal state landed on "all", consistent with what rendered — a
    // subsequent "Toon alles" click (a no-op, since it's already showing
    // "all") must not be needed to reach a coherent state, and the "Alles"
    // tab reflects it.
    expect(screen.getByRole("button", { name: "Alles" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows loading indicator while fetching", async () => {
    // Make fetchArticles hang
    let resolvePromise: (value: unknown) => void;
    mockFetchArticles.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    render(
      <NewsListingClient
        initialArticles={[makeArticle({ id: "g1" })]}
        categories={categories}
        hasMore={true}
        fetchArticles={mockFetchArticles}
      />,
    );

    // Click the load-more button to start the fetch.
    clickLoadMore();

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    // Resolve to prevent act warnings
    resolvePromise!({ items: [], hasMore: false });
  });

  describe("a pending category switch (#3388)", () => {
    const renderListing = (
      overrides: Partial<React.ComponentProps<typeof NewsListingClient>> = {},
    ) =>
      render(
        <NewsListingClient
          initialArticles={[makeArticle({ id: "a1", title: "Article One" })]}
          categories={categories}
          hasMore={true}
          fetchArticles={mockFetchArticles}
          {...overrides}
        />,
      );

    const hangFetch = () => {
      let resolve!: (value: unknown) => void;
      let reject!: (reason: unknown) => void;
      mockFetchArticles.mockReturnValue(
        new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        }),
      );
      return { resolve, reject };
    };

    const pulseIn = (name: string) =>
      screen.getByRole("button", { name }).querySelector(".kcvv-spinner-pulse");

    it("puts the dots on the chip that is becoming active and busies the grid — not the footer", async () => {
      const { resolve } = hangFetch();
      vi.spyOn(window, "scrollTo").mockImplementation(() => {});
      const { container } = renderListing();

      expect(container.querySelector("[aria-busy]")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Jeugd" }));

      await waitFor(() => expect(pulseIn("Jeugd")).not.toBeNull());
      // Only the chip that made the request waits.
      expect(pulseIn("Alles")).toBeNull();
      expect(pulseIn("Eerste ploeg")).toBeNull();
      const grid = container.querySelector('[aria-busy="true"]');
      expect(grid).not.toBeNull();
      expect(grid).toHaveClass("opacity-50", "delay-150");
      // The footer is not a second device for the same request.
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Meer nieuws laden" }),
      ).not.toBeInTheDocument();

      resolve({
        items: [makeArticle({ id: "j1", title: "Jeugd" })],
        hasMore: false,
      });
      await waitFor(() => expect(pulseIn("Jeugd")).toBeNull());
      // Arrival is an instant swap: no busy flag, no dim left behind.
      expect(container.querySelector("[aria-busy]")).toBeNull();
      expect(container.querySelector(".opacity-50")).toBeNull();
    });

    it("puts the dots on 'Alles' when a popstate switches back to it", async () => {
      mockFetchArticles.mockResolvedValueOnce({ items: [], hasMore: false });
      renderListing();
      fireEvent.click(screen.getByRole("button", { name: "Jeugd" }));
      await waitFor(() => expect(pulseIn("Jeugd")).toBeNull());

      hangFetch();
      window.history.pushState({}, "", "/nieuws");
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      await waitFor(() => expect(pulseIn("Alles")).not.toBeNull());
      expect(pulseIn("Jeugd")).toBeNull();
    });

    it("does not flash the empty state while a switch is pending on an empty grid", async () => {
      hangFetch();
      renderListing({ initialArticles: [], hasMore: false });

      fireEvent.click(screen.getByRole("button", { name: "Jeugd" }));

      await waitFor(() => expect(pulseIn("Jeugd")).not.toBeNull());
      expect(screen.queryByText(/geen artikelen/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/nog geen artikelen/i)).not.toBeInTheDocument();
    });

    it("reports a failed switch above the grid, reverts the chip and scrolls up; retry re-runs the switch", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const scrollTo = vi
        .spyOn(window, "scrollTo")
        .mockImplementation(() => {});
      mockFetchArticles.mockRejectedValueOnce(new Error("boom"));
      const { container } = renderListing();

      fireEvent.click(screen.getByRole("button", { name: "Jeugd" }));

      const retry = await screen.findByRole("button", {
        name: "Probeer opnieuw",
      });
      const notice = retry;
      const grid = container.querySelector("[data-columns]")!;
      // Above the grid, not in the footer beneath it.
      expect(
        notice.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(screen.getByRole("button", { name: "Alles" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(pulseIn("Jeugd")).toBeNull();
      expect(container.querySelector("[aria-busy]")).toBeNull();
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

      mockFetchArticles.mockResolvedValueOnce({
        items: [makeArticle({ id: "j1", title: "Jeugd Article" })],
        hasMore: false,
      });
      fireEvent.click(retry);

      await screen.findByRole("heading", { name: /^Jeugd Article\.?$/ });
      expect(mockFetchArticles).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: "Jeugd" }),
      );
      expect(
        screen.queryByRole("button", { name: "Probeer opnieuw" }),
      ).toBeNull();
    });

    it("keeps a failed load-more in the footer, below the grid", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetchArticles.mockRejectedValueOnce(new Error("boom"));
      const { container } = renderListing();

      clickLoadMore();

      const notice = await screen.findByRole("button", {
        name: "Probeer opnieuw",
      });
      const grid = container.querySelector("[data-columns]")!;
      expect(
        grid.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it.each([
      [true, "auto"],
      [false, "smooth"],
    ])(
      "scrolls to the top (reduced motion: %s) with behavior %s",
      async (reduced, behavior) => {
        vi.spyOn(window, "matchMedia").mockImplementation(
          (query) =>
            ({
              matches: reduced,
              media: query,
              addEventListener: () => {},
              removeEventListener: () => {},
            }) as unknown as MediaQueryList,
        );
        const scrollTo = vi
          .spyOn(window, "scrollTo")
          .mockImplementation(() => {});
        mockFetchArticles.mockResolvedValueOnce({ items: [], hasMore: false });
        renderListing();

        fireEvent.click(screen.getByRole("button", { name: "Jeugd" }));

        await waitFor(() =>
          expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior }),
        );
      },
    );
  });
});
