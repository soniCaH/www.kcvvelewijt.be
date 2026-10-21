import { beforeEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";

// A memoising stand-in for `unstable_cache`: the real one needs Next's request
// scope. It caches per key like the real one, which is what "once per cache
// fill" is about, and records the options the module hands it.
const cacheOptions = vi.hoisted(() => ({
  seen: [] as { keyParts: string[]; options: unknown }[],
}));
vi.mock("next/cache", () => ({
  unstable_cache: <T>(
    fn: () => Promise<T>,
    keyParts: string[],
    options: unknown,
  ) => {
    cacheOptions.seen.push({ keyParts, options });
    let filled: Promise<T> | undefined;
    return () => (filled ??= fn());
  },
}));

const mockFetch = vi.hoisted(() => vi.fn());
vi.mock("../sanity/client", () => ({ sanityClient: { fetch: mockFetch } }));
vi.mock("@/lib/effect/runtime", async () => {
  const { ShortLinkRepositoryLive } =
    await import("@/lib/repositories/short-link.repository");
  return {
    runPromise: <A>(effect: Effect.Effect<A, never, unknown>) =>
      Effect.runPromise(
        Effect.provide(
          effect as Effect.Effect<A, never, never>,
          ShortLinkRepositoryLive,
        ),
      ),
  };
});

import { findShortLink, getShortLinks } from "./short-links";

const LINKS = [
  { name: "stage", target: "/nieuws/herfststage-2026" },
  { name: "tornooi", target: "https://www.tournify.nl/live/kcvvelewijt2025" },
];

beforeEach(() => {
  mockFetch.mockReset().mockResolvedValue(LINKS);
});

describe("getShortLinks", () => {
  it("caches under the short-link tag with no time limit of its own and a daily safety net", () => {
    expect(cacheOptions.seen).toEqual([
      {
        keyParts: ["short-links"],
        options: { revalidate: 86400, tags: ["shortLinks"] },
      },
    ]);
  });

  it("reads Sanity once for any number of lookups, with the whole list in one query", async () => {
    await findShortLink("stage");
    await findShortLink("tornooi");
    await findShortLink("onbekend");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [query, , options] = mockFetch.mock.calls[0];
    expect(query).toContain('_type == "shortLink"');
    expect(options).toMatchObject({
      next: { revalidate: 86400, tags: ["shortLinks"] },
    });
  });

  it("returns the list as read", async () => {
    expect(await getShortLinks()).toEqual(LINKS);
  });
});

describe("findShortLink", () => {
  it("finds a known name", async () => {
    expect(await findShortLink("stage")).toEqual(LINKS[0]);
  });

  it("matches case-insensitively, like the redirects() entries it replaces", async () => {
    expect(await findShortLink("Tornooi")).toEqual(LINKS[1]);
  });

  it("returns null for an unknown name", async () => {
    expect(await findShortLink("onbekend")).toBeNull();
  });
});
