import { Cause, Effect, Exit } from "effect";
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
vi.mock("./client", () => ({
  sanityClient: { fetch: (...args: unknown[]) => fetchMock(...args) },
}));

import { fetchGroq, SanityReadError } from "./fetch-groq";

describe("fetchGroq", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue([]);
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
