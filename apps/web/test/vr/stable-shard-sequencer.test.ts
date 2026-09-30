import { describe, expect, it } from "vitest";

import StableShardSequencer from "../../.storybook/stable-shard-sequencer.mjs";

// `--index-json` writes every story file's test into a fresh random temp dir
// per process, so each shard sees the same file names under a different root.
const files = Array.from({ length: 30 }, (_, i) => `story-${i}.test.js`);
const testsUnder = (root: string) =>
  files.map((name) => ({
    path: `${root}/${name}`,
    context: { config: { rootDir: "/repo" } },
  }));

const shardNames = (root: string, shardIndex: number) =>
  new StableShardSequencer()
    .shard(testsUnder(root), { shardIndex, shardCount: 3 })
    .map((t: { path: string }) => t.path.split("/").pop());

describe("StableShardSequencer", () => {
  it("gives every file to exactly one shard when each shard has its own temp dir", () => {
    const shards = [1, 2, 3].map((i) => shardNames(`/tmp/random-${i}`, i));
    const all = shards.flat();
    expect(new Set(all).size).toBe(all.length);
    expect(all.toSorted()).toEqual(files.toSorted());
  });

  it("puts a file on the same shard whatever the temp dir is", () => {
    expect(shardNames("/tmp/aaa", 2)).toEqual(shardNames("/tmp/bbb", 2));
  });
});
