/**
 * A failed team read must degrade to the club card, not throw (#2863).
 *
 * `TeamRepository.findBySlug` is a Sanity read — every Sanity read ends in
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

// The team read fails as a defect, mirroring a Sanity blip reaching
// `fetchGroq`'s `Effect.orDie`. Every other method is unused by this route
// but must be present to satisfy `TeamRepositoryInterface`.
vi.mock("@/lib/repositories/team.repository", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("@/lib/repositories/team.repository")>();
  const { Effect, Layer } = await import("effect");
  return {
    ...mod,
    TeamRepositoryLive: Layer.succeed(mod.TeamRepository, {
      findAll: () => Effect.die(new Error("Sanity is unreachable")),
      findBySlug: () => Effect.die(new Error("Sanity is unreachable")),
      findAllForLanding: () => Effect.die(new Error("Sanity is unreachable")),
      findYouthTeamsForContact: () =>
        Effect.die(new Error("Sanity is unreachable")),
      findByMemberId: () => Effect.die(new Error("Sanity is unreachable")),
    }),
  };
});

import Image from "./opengraph-image";

describe("/ploegen/[slug] opengraph-image degrades on a failed read (#2863)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    mockRenderShareCard.mockClear();
  });

  it("renders the club card instead of throwing when the team read fails", async () => {
    await expect(
      Image({ params: Promise.resolve({ slug: "a-ploeg" }) }),
    ).resolves.toBeInstanceOf(Response);

    expect(mockRenderShareCard).toHaveBeenCalledWith({
      nameTop: "KCVV",
      nameBottom: "Elewijt",
    });
  });
});
