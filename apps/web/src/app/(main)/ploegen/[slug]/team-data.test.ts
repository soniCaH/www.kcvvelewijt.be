import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";

// `fetchTeamOrNull` wraps itself in React's request-scoped `cache()`, which has
// no request boundary under Vitest; pass it through so cases do not share results.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

const { mockFindBySlug } = vi.hoisted(() => ({ mockFindBySlug: vi.fn() }));

vi.mock("@/lib/repositories/team.repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/repositories/team.repository")>();
  return {
    ...actual,
    TeamRepositoryLive: Layer.succeed(actual.TeamRepository, {
      findAll: () => Effect.succeed([]),
      findHiddenPsdIds: () => Effect.die("not used by this suite"),
      findBySlug: mockFindBySlug,
      findAllForLanding: () => Effect.succeed([]),
      findByMemberId: () => Effect.succeed([]),
    }),
  };
});

import { fetchTeamOrNull } from "./team-data";

describe("fetchTeamOrNull", () => {
  beforeEach(() => mockFindBySlug.mockReset());

  // Untagged (#3483, #3915): no `teams` tag, so a team publish does not
  // rebuild every `/ploegen/<slug>`; no `sponsors` tag, the read holds no Sponsor.
  it("reads the team untagged", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(null));

    await fetchTeamOrNull("kcvv-elewijt-u13");

    expect(mockFindBySlug).toHaveBeenCalledWith("kcvv-elewijt-u13");
  });
});
