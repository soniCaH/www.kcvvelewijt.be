/**
 * A failed staff-member read must degrade to the club card, not throw (#2863).
 *
 * `StaffRepository.findByPsdId` is a Sanity read — every Sanity read ends in
 * `Effect.orDie` (`lib/sanity/fetch-groq.ts`), so the effect is typed
 * `Effect<A>` with `E = never` and its failures arrive as *defects*. An
 * `Effect.catchAll` on it type-checks but never runs; only a cause-aware
 * guard (`degradeSection`) can see the failure. This route has no error
 * boundary to bubble into — a throw here would serve a broken image to every
 * social crawler — so a failed read must resolve to the club-branded
 * fallback card instead.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockRenderShareCard } = vi.hoisted(() => ({
  mockRenderShareCard: vi.fn(async () => new Response(null)),
}));

vi.mock("@/lib/og/share-card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/og/share-card")>();
  return { ...actual, renderShareCard: mockRenderShareCard };
});

// The staff-member read fails as a defect, mirroring a Sanity blip reaching
// `fetchGroq`'s `Effect.orDie`. Every other method is unused by this route
// but must be present to satisfy `StaffRepositoryInterface`.
vi.mock("@/lib/repositories/staff.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/staff.repository")
    >();
  const { Effect, Layer } = await import("effect");
  return {
    ...mod,
    StaffRepositoryLive: Layer.succeed(mod.StaffRepository, {
      findAll: () => Effect.die(new Error("Sanity is unreachable")),
      findByPsdId: () => Effect.die(new Error("Sanity is unreachable")),
      findKeyContacts: () => Effect.die(new Error("Sanity is unreachable")),
      findAllForStaticParams: () =>
        Effect.die(new Error("Sanity is unreachable")),
    }),
  };
});

import Image from "./opengraph-image";

describe("/staf/[slug] opengraph-image degrades on a failed read (#2863)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    mockRenderShareCard.mockClear();
  });

  it("renders the club card instead of throwing when the staff-member read fails", async () => {
    await expect(
      Image({ params: Promise.resolve({ slug: "42" }) }),
    ).resolves.toBeInstanceOf(Response);

    expect(mockRenderShareCard).toHaveBeenCalledWith({
      nameTop: "KCVV",
      nameBottom: "Elewijt",
    });
  });
});
