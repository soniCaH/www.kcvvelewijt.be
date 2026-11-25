/**
 * `fetchGalleriesAction` is a `"use server"` export, so a public POST endpoint:
 * it decodes its argument before it reaches the repository (#3875).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const findPaginated = vi.hoisted(() => vi.fn());

vi.mock(
  "@/lib/repositories/photoGallery.repository",
  async (importOriginal) => {
    const mod =
      await importOriginal<
        typeof import("@/lib/repositories/photoGallery.repository")
      >();
    const { Effect, Layer } = await import("effect");
    return {
      ...mod,
      PhotoGalleryRepositoryLive: Layer.succeed(mod.PhotoGalleryRepository, {
        findPaginated: (...args: unknown[]) => {
          findPaginated(...args);
          return Effect.succeed([]);
        },
        findBySlug: () => Effect.die("not used by this suite"),
        findByLinkedMatch: () => Effect.die("not used by this suite"),
        findByLinkedEvent: () => Effect.die("not used by this suite"),
      }),
    };
  },
);

import { fetchGalleriesAction } from "./actions";

describe("fetchGalleriesAction decodes its public input (#3875)", () => {
  beforeEach(() => {
    findPaginated.mockClear();
  });

  it.each([
    ["null", null],
    ["a string", "x"],
  ])("rejects %s, and never reads", async (_, input) => {
    await expect(
      fetchGalleriesAction(
        input as unknown as Parameters<typeof fetchGalleriesAction>[0],
      ),
    ).rejects.toThrow();
    expect(findPaginated).not.toHaveBeenCalled();
  });

  it("reads one window for a valid argument", async () => {
    await expect(
      fetchGalleriesAction({ offset: 0, limit: 12 }),
    ).resolves.toEqual({ items: [], hasMore: false });
    expect(findPaginated).toHaveBeenCalledWith({ offset: 0, limit: 13 });
  });
});
