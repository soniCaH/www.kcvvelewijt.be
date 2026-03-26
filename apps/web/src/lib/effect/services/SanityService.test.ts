import { describe, it, expect, vi, type Mock } from "vitest";
import { Effect } from "effect";
import { SanityService, SanityServiceLive } from "./SanityService";
import { sanityClient } from "../../sanity/client";
import { PAGE_BY_SLUG_QUERY } from "../../sanity/queries/pages";

vi.mock("../../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn().mockResolvedValue([]),
  },
}));

function mockFetch(value: unknown) {
  (vi.mocked(sanityClient.fetch) as Mock).mockResolvedValueOnce(value);
}

describe("SanityService.getPage", () => {
  it("returns a SanityPage when found", async () => {
    const mockPage = {
      _id: "page-123",
      title: "Praktische Info",
      slug: { current: "register" },
      body: [{ _type: "block", children: [{ text: "Hello" }] }],
    };
    mockFetch(mockPage);

    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getPage("register");
    }).pipe(Effect.provide(SanityServiceLive));

    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?._id).toBe("page-123");
    expect(result?.title).toBe("Praktische Info");
    expect(vi.mocked(sanityClient.fetch)).toHaveBeenCalledWith(
      PAGE_BY_SLUG_QUERY,
      expect.objectContaining({ slug: "register" }),
    );
  });

  it("returns null when page not found", async () => {
    mockFetch(null);

    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getPage("unknown-slug");
    }).pipe(Effect.provide(SanityServiceLive));

    const result = await Effect.runPromise(program);

    expect(result).toBeNull();
  });
});
