// @vitest-environment node
/**
 * `unvisitedStoryIds` (#3275) — the VR gate's own count. For 5 days the 3 VR
 * shards passed while ~⅓ of the stories ran on no shard, because a green run
 * only says nothing it looked at failed. This names what it never looked at.
 */
import { describe, expect, it } from "vitest";

import { unvisitedStoryIds } from "../../scripts/vr-coverage.mjs";

const story = (id: string, tags: string[] = ["dev", "test"]) => ({
  id,
  type: "story",
  tags,
});

const index = {
  v: 5,
  entries: {
    "a--one": story("a--one"),
    "a--two": story("a--two"),
    "b--one": story("b--one", ["dev", "test", "vr"]),
    "a--docs": { id: "a--docs", type: "docs", tags: ["dev", "test"] },
    "c--no-test": story("c--no-test", ["dev", "!test"]),
    "d--skipped": story("d--skipped", ["dev", "test", "skip"]),
  },
};

describe("unvisitedStoryIds", () => {
  // The index also holds a docs entry, a `!test` story and a `skip` story;
  // none of them may be reported.
  it("is empty when every story the runner runs was visited", () => {
    expect(unvisitedStoryIds(index, ["a--one", "a--two", "b--one"])).toEqual(
      [],
    );
  });

  it("names every story no shard visited", () => {
    expect(unvisitedStoryIds(index, ["a--one"])).toEqual(["a--two", "b--one"]);
  });

  it("counts a story visited on two shards once", () => {
    expect(
      unvisitedStoryIds(index, ["a--one", "a--one", "a--two", "b--one"]),
    ).toEqual([]);
  });
});
