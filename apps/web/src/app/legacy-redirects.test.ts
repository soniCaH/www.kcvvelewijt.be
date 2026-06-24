/**
 * Route-level tests for the legacy Gatsby URL resolvers (#2227). The pure
 * resolution logic is unit-tested in src/lib/seo/legacy-redirect.test.ts; these
 * assert the route wiring — that each resolver 308s (permanentRedirect) to the
 * right canonical path and 404s (notFound) when nothing resolves.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  permanentRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/effect/runtime", () => ({ runPromise: vi.fn() }));

const { runPromise } = await import("@/lib/effect/runtime");
const mockRun = vi.mocked(runPromise);

const player = await import("./player/[slug]/page");
const players = await import("./players/[slug]/page");
const staff = await import("./staff/[slug]/page");
const youth = await import("./(landing)/jeugd/[slug]/page");

const personRows = [
  { psdId: "123", firstName: "Jan", lastName: "Janssens" },
  { psdId: "456", firstName: "Rémi", lastName: "Mendes" },
];
const youthRows = [
  { slug: "kcvve-u9-groen", age: "U9" },
  { slug: "kcvve-u9-wit", age: "U9" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("legacy redirect routes", () => {
  it("/player/<name-slug> 308s to /spelers/<psdId>", async () => {
    mockRun.mockResolvedValueOnce(personRows);
    await expect(
      player.default({ params: Promise.resolve({ slug: "jan-janssens" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/spelers/123");
  });

  it("/players/<name-slug> resolves the same as /player", async () => {
    mockRun.mockResolvedValueOnce(personRows);
    await expect(
      players.default({ params: Promise.resolve({ slug: "remi-mendes" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/spelers/456");
  });

  it("/staff/<name-slug> 308s to /staf/<psdId>", async () => {
    mockRun.mockResolvedValueOnce(personRows);
    await expect(
      staff.default({ params: Promise.resolve({ slug: "jan-janssens" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/staf/123");
  });

  it("404s an unresolvable person", async () => {
    mockRun.mockResolvedValueOnce(personRows);
    await expect(
      player.default({ params: Promise.resolve({ slug: "piet-pieters" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("/jeugd/<age> 308s to /ploegen/<resolved-slug>", async () => {
    mockRun.mockResolvedValueOnce(youthRows);
    await expect(
      youth.default({ params: Promise.resolve({ slug: "u9" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/ploegen/kcvve-u9-groen");
  });

  it("404s an unknown youth age", async () => {
    mockRun.mockResolvedValueOnce(youthRows);
    await expect(
      youth.default({ params: Promise.resolve({ slug: "u99" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
