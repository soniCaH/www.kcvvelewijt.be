import { describe, expect, it, vi } from "vitest";
import { matchbal, validateMatchbalMatchId } from "@kcvv/sanity-schemas";

/** A client whose `fetch` answers the duplicate count with `taken`. */
const contextWith = (taken: number, id = "matchbal-new") => {
  const fetch = vi.fn().mockResolvedValue(taken);
  return {
    fetch,
    context: { document: { _id: id }, getClient: () => ({ fetch }) },
  };
};

describe("validateMatchbalMatchId", () => {
  it.each(["3414", "1", "987654"])("accepts %s", async (id) => {
    expect(await validateMatchbalMatchId(id, contextWith(0).context)).toBe(
      true,
    );
  });

  it.each([
    "abc",
    "34 14",
    "/wedstrijd/3414",
    "03414",
    "0",
    "-1",
    "3414x",
    "1234567890",
  ])("rejects %j", async (id) => {
    expect(await validateMatchbalMatchId(id, contextWith(0).context)).toMatch(
      /enkel cijfers/,
    );
  });

  it("leaves an empty value to .required()", async () => {
    expect(await validateMatchbalMatchId("", contextWith(1).context)).toBe(
      true,
    );
    expect(
      await validateMatchbalMatchId(undefined, contextWith(1).context),
    ).toBe(true);
  });

  it("rejects a second Matchbal for the same match", async () => {
    expect(
      await validateMatchbalMatchId("3414", contextWith(1).context),
    ).toMatch(/heeft al een Matchbal/);
  });

  it("ignores the draft and the published twin of this document", async () => {
    const { fetch, context } = contextWith(0, "drafts.matchbal-3414");
    await validateMatchbalMatchId("3414", context);
    expect(fetch.mock.calls[0][0]).toContain(
      '!(_id in [$id, "drafts." + $id])',
    );
    expect(fetch.mock.calls[0][0]).toContain("matchId == $value");
    expect(fetch.mock.calls[0][1]).toEqual({
      type: "matchbal",
      value: "3414",
      id: "matchbal-3414",
    });
  });

  it("does not hit Sanity for an id it already refuses", async () => {
    const { fetch, context } = contextWith(0);
    await validateMatchbalMatchId("abc", context);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("matchbal schema", () => {
  it("has a required match id and a Sponsor reference", () => {
    expect(matchbal.fields.map((f) => f.name)).toEqual(["matchId", "sponsor"]);
    const sponsor = matchbal.fields.find((f) => f.name === "sponsor") as {
      to?: { type: string }[];
    };
    expect(sponsor.to).toEqual([{ type: "sponsor" }]);
  });
});
