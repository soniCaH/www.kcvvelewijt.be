import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import type { ImageProps } from "next/image";
import { GalleryListingClient } from "./GalleryListingClient";
import type { GalleryCardVM } from "@/lib/repositories/photoGallery.repository";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

const mockFetchGalleries = vi.fn();

function makeGallery(id: string, title: string): GalleryCardVM {
  return {
    id,
    title,
    slug: title.toLowerCase().replace(/\s/g, "-"),
    publishedAt: "2026-03-15T10:00:00Z",
    imageCount: 4,
    coverUrl: null,
    coverLqip: null,
  };
}

const loadMoreButton = () =>
  screen.getByRole("button", { name: /Meer foto's laden/ });

describe("GalleryListingClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the initial galleries", () => {
    render(
      <GalleryListingClient
        initialGalleries={[
          makeGallery("g1", "Derby"),
          makeGallery("g2", "Bal"),
        ]}
        hasMore={false}
        fetchGalleries={mockFetchGalleries}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /^Derby\.?$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Bal\.?$/ }),
    ).toBeInTheDocument();
  });

  it("shows the load-more button only when there are more galleries", () => {
    render(
      <GalleryListingClient
        initialGalleries={[makeGallery("g1", "Derby")]}
        hasMore={true}
        fetchGalleries={mockFetchGalleries}
      />,
    );
    expect(loadMoreButton()).toBeInTheDocument();

    cleanup();

    render(
      <GalleryListingClient
        initialGalleries={[makeGallery("g1", "Derby")]}
        hasMore={false}
        fetchGalleries={mockFetchGalleries}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Meer foto's laden/ }),
    ).not.toBeInTheDocument();
  });

  it("appends the next batch and drops galleries already on screen", async () => {
    mockFetchGalleries.mockResolvedValue({
      items: [makeGallery("g1", "Derby"), makeGallery("g2", "Bal")],
      hasMore: false,
    });

    render(
      <GalleryListingClient
        initialGalleries={[makeGallery("g1", "Derby")]}
        hasMore={true}
        fetchGalleries={mockFetchGalleries}
      />,
    );

    fireEvent.click(loadMoreButton());

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /^Bal\.?$/ }),
      ).toBeInTheDocument();
    });

    expect(mockFetchGalleries).toHaveBeenCalledWith({ offset: 1, limit: 12 });
    expect(screen.getAllByRole("heading", { name: /^Derby\.?$/ })).toHaveLength(
      1,
    );
  });

  it("advances the offset by the raw row count, so an all-duplicate batch cannot stall the button", async () => {
    // Every row comes back already on screen — the offset must still move, or
    // the next click re-requests the same window forever.
    mockFetchGalleries.mockResolvedValue({
      items: [makeGallery("g1", "Derby"), makeGallery("g2", "Bal")],
      hasMore: true,
    });

    render(
      <GalleryListingClient
        initialGalleries={[
          makeGallery("g1", "Derby"),
          makeGallery("g2", "Bal"),
        ]}
        hasMore={true}
        fetchGalleries={mockFetchGalleries}
      />,
    );

    fireEvent.click(loadMoreButton());
    await waitFor(() =>
      expect(mockFetchGalleries).toHaveBeenCalledWith({ offset: 2, limit: 12 }),
    );

    fireEvent.click(loadMoreButton());
    await waitFor(() =>
      expect(mockFetchGalleries).toHaveBeenCalledWith({ offset: 4, limit: 12 }),
    );
  });

  it("offers a retry when the batch fails", async () => {
    mockFetchGalleries.mockRejectedValueOnce(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <GalleryListingClient
        initialGalleries={[makeGallery("g1", "Derby")]}
        hasMore={true}
        fetchGalleries={mockFetchGalleries}
      />,
    );

    fireEvent.click(loadMoreButton());

    // The failure notice now renders through <EmptyState>, which accents
    // "mislukt" in its own <em> — the sentence text is split across nodes,
    // so a single getByText(/laden mislukt/i) can no longer match it whole
    // (#2815).
    await waitFor(() => {
      expect(screen.getByText("mislukt").tagName).toBe("EM");
    });

    mockFetchGalleries.mockResolvedValue({
      items: [makeGallery("g2", "Bal")],
      hasMore: false,
    });
    fireEvent.click(screen.getByRole("button", { name: "Probeer opnieuw" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /^Bal\.?$/ }),
      ).toBeInTheDocument();
    });
  });
});
