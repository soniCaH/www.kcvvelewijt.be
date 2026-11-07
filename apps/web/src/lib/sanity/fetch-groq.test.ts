import { Cause, Effect, Exit } from "effect";
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
const previewFetchMock = vi.fn();
const draftModeMock = vi.fn();
vi.mock("./client", () => ({
  sanityClient: { fetch: (...args: unknown[]) => fetchMock(...args) },
  sanityPreviewClient: {
    fetch: (...args: unknown[]) => previewFetchMock(...args),
  },
}));
vi.mock("next/headers", () => ({ draftMode: () => draftModeMock() }));

import { fetchGroq, SanityReadError } from "./fetch-groq";

describe("fetchGroq", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue([]);
    previewFetchMock.mockReset();
    previewFetchMock.mockResolvedValue([]);
    draftModeMock.mockReset();
    draftModeMock.mockResolvedValue({ isEnabled: false });
  });

  it("omits the options arg when no cache options are given", async () => {
    await Effect.runPromise(fetchGroq("*[_type=='x']"));
    expect(fetchMock).toHaveBeenCalledWith("*[_type=='x']", {});
  });

  it("forwards revalidate + tags to the client's next options", async () => {
    await Effect.runPromise(
      fetchGroq("*[_type=='player']", undefined, {
        revalidate: 3600,
        tags: ["players"],
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "*[_type=='player']",
      {},
      { next: { revalidate: 3600, tags: ["players"] } },
    );
  });

  describe("in preview mode (#3619)", () => {
    beforeEach(() => {
      draftModeMock.mockResolvedValue({ isEnabled: true });
    });

    it("reads through the drafts-perspective client with no Next cache options", async () => {
      await Effect.runPromise(
        fetchGroq(
          "*[_type=='x']",
          { slug: "s" },
          { revalidate: 900, tags: ["a"] },
        ),
      );
      expect(previewFetchMock).toHaveBeenCalledWith("*[_type=='x']", {
        slug: "s",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("fails with a typed SanityReadError when the preview read rejects", async () => {
      const cause = new Error("preview unreachable");
      previewFetchMock.mockRejectedValue(cause);
      const error = await Effect.runPromise(
        Effect.flip(fetchGroq("*[_type=='x']")),
      );
      expect(error).toBeInstanceOf(SanityReadError);
      expect(error.cause).toBe(cause);
    });
  });

  it("fails with a typed SanityReadError when the preview state cannot be read", async () => {
    const cause = new Error("no request scope");
    draftModeMock.mockRejectedValue(cause);
    const exit = await Effect.runPromiseExit(fetchGroq("*[_type=='x']"));
    expect(Exit.isFailure(exit)).toBe(true);
    if (!Exit.isFailure(exit)) return;
    expect(Cause.isFailType(exit.cause)).toBe(true);
    expect(Cause.isDieType(exit.cause)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // #2864: this is the function the whole typed-error-channel ticket turns
  // on — a rejected client read must surface as a genuine typed `Fail` of
  // `SanityReadError`, never a `Die`. Every call site's degrade-or-die
  // decision downstream depends on that being true.
  describe("on a rejected client read", () => {
    const clientError = new Error("Sanity is unreachable");

    beforeEach(() => {
      fetchMock.mockReset();
      fetchMock.mockRejectedValue(clientError);
    });

    it("fails with a SanityReadError carrying the original cause", async () => {
      // `Effect.flip` only resolves when the effect genuinely FAILS (a typed
      // `E`) rather than dies — a defect would still reject `runPromise`
      // here, so this assertion doubles as the fail-not-die proof.
      const error = await Effect.runPromise(
        Effect.flip(fetchGroq("*[_type=='x']")),
      );
      expect(error).toBeInstanceOf(SanityReadError);
      expect(error._tag).toBe("SanityReadError");
      expect(error.cause).toBe(clientError);
    });

    it("builds its message from the cause", async () => {
      const error = await Effect.runPromise(
        Effect.flip(fetchGroq("*[_type=='x']")),
      );
      expect(error.message).toBe(`Sanity fetch failed: ${String(clientError)}`);
    });

    it("rejects via a Fail cause, not a Die (#2864 — the whole point)", async () => {
      const exit = await Effect.runPromiseExit(fetchGroq("*[_type=='x']"));
      expect(Exit.isFailure(exit)).toBe(true);
      if (!Exit.isFailure(exit)) return;
      expect(Cause.isFailType(exit.cause)).toBe(true);
      expect(Cause.isDieType(exit.cause)).toBe(false);
    });
  });
});

describe("SanityReadError.transient", () => {
  const httpError = (statusCode: number) =>
    Object.assign(new Error(`HTTP ${statusCode}`), { statusCode });

  it.each([
    ["a transport failure (no status)", new TypeError("fetch failed")],
    ["a 503", httpError(503)],
    ["a 500", httpError(500)],
    ["a 429", httpError(429)],
  ])("is transient for %s", (_label, cause) => {
    expect(new SanityReadError({ cause }).transient).toBe(true);
  });

  it.each([
    ["an invalid GROQ query (400)", httpError(400)],
    ["a bad token (401)", httpError(401)],
    ["a forbidden dataset (403)", httpError(403)],
    ["an unknown project (404)", httpError(404)],
  ])("is permanent for %s — the build must still fail", (_label, cause) => {
    expect(new SanityReadError({ cause }).transient).toBe(false);
  });
});
