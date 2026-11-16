import { beforeEach, describe, expect, it, vi } from "vitest";
import { Effect, type Layer } from "effect";

// "Voorbeeld" (#3619, #3660): the Event, Page and photo-gallery detail pages
// render a Sanity draft by reading through the drafts client. A publication
// window, a `drafts.` exclusion or a date filter in one of these by-slug
// queries would 404 a never-published document in preview, so this pins both:
// preview mode reads through `sanityPreviewClient` with the slug only, and the
// query text carries none of those filters. (Article keeps its own window and
// `$preview` switch: `article.repository.test.ts`.)

const { draftModeMock } = vi.hoisted(() => ({ draftModeMock: vi.fn() }));
vi.mock("next/headers", () => ({ draftMode: () => draftModeMock() }));
vi.mock("../sanity/client", () => ({
  sanityClient: { fetch: vi.fn() },
  sanityPreviewClient: { fetch: vi.fn() },
}));

import { sanityClient, sanityPreviewClient } from "../sanity/client";
import { EventRepository, EventRepositoryLive } from "./event.repository";
import { PageRepository, PageRepositoryLive } from "./page.repository";
import {
  PhotoGalleryRepository,
  PhotoGalleryRepositoryLive,
} from "./photoGallery.repository";

const mockFetch = vi.mocked(sanityClient.fetch);
const mockPreviewFetch = vi.mocked(sanityPreviewClient.fetch);

/** Anything that would hide a never-published or not-yet-live document. */
const HIDING_FILTER = /publishedAt\s*<|unpublishAt|now\(\)|drafts\./;

const CASES = [
  {
    type: "event",
    read: Effect.flatMap(EventRepository, (repo) => repo.findBySlug("kamp")),
    layer: EventRepositoryLive,
  },
  {
    type: "page",
    read: Effect.flatMap(PageRepository, (repo) => repo.findBySlug("kamp")),
    layer: PageRepositoryLive,
  },
  {
    type: "photoGallery",
    read: Effect.flatMap(PhotoGalleryRepository, (repo) =>
      repo.findBySlug("kamp"),
    ),
    layer: PhotoGalleryRepositoryLive,
  },
] as const;

beforeEach(() => {
  mockFetch.mockReset();
  mockPreviewFetch.mockReset();
  draftModeMock.mockReset();
});

describe.each(CASES)("$type by slug", ({ type, read, layer }) => {
  // The three read effects need different services; one cast keeps the table flat.
  const run = () =>
    Effect.runPromise(
      Effect.provide(
        read as Effect.Effect<unknown, unknown, never>,
        layer as Layer.Layer<never>,
      ),
    );

  it("reads the unpublished change through the drafts client in preview mode", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: true });
    mockPreviewFetch.mockResolvedValueOnce(null as never);

    await run();

    expect(mockPreviewFetch).toHaveBeenCalledTimes(1);
    expect(mockPreviewFetch).toHaveBeenCalledWith(
      expect.stringContaining(`_type == "${type}"`),
      { slug: "kamp" },
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("carries no filter that hides a never-published document", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: true });
    mockPreviewFetch.mockResolvedValueOnce(null as never);

    await run();

    const query = mockPreviewFetch.mock.calls[0]?.[0] as string;
    expect(query).not.toMatch(HIDING_FILTER);
  });

  it("keeps the published read for visitors", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: false });
    mockFetch.mockResolvedValueOnce(null as never);

    await run();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockPreviewFetch).not.toHaveBeenCalled();
  });
});
