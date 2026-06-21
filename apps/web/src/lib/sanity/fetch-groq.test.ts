import { Effect } from "effect";
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
vi.mock("./client", () => ({
  sanityClient: { fetch: (...args: unknown[]) => fetchMock(...args) },
}));

import { fetchGroq } from "./fetch-groq";

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
});
