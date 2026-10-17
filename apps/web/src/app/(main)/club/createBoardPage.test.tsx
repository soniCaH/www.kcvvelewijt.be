import { describe, expect, it, vi } from "vitest";
import { Effect, Layer } from "effect";

const { mockFindBySlug } = vi.hoisted(() => ({ mockFindBySlug: vi.fn() }));

// Run the page's Effect against a stub repository, so the test sees exactly
// what `createBoardPage` asks the repository for.
vi.mock("@/lib/effect/runtime", async () => {
  const { TeamRepository } = await import("@/lib/repositories/team.repository");
  const layer = Layer.succeed(TeamRepository, {
    findBySlug: mockFindBySlug,
  } as unknown as typeof TeamRepository.Service);
  return {
    runPromise: (effect: Effect.Effect<unknown, never, never>) =>
      Effect.runPromise(
        (effect as Effect.Effect<unknown, never, unknown>).pipe(
          Effect.provide(layer),
        ) as Effect.Effect<unknown>,
      ),
  };
});

import { createBoardPage } from "./createBoardPage";

describe("createBoardPage read (#3483)", () => {
  it("tags the board team read with teams, staff and players, and no revalidate", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed({ name: "Bestuur" }));
    const { Layout } = createBoardPage({
      slug: "bestuur",
      fallbackDescription: "d",
      fallbackTitle: "t",
    });

    await Layout({ children: null });

    expect(mockFindBySlug).toHaveBeenCalledWith("bestuur", {
      tags: ["teams", "staff", "players"],
    });
    expect(mockFindBySlug.mock.calls[0]![1]).not.toHaveProperty("revalidate");
  });
});
