import { describe, expect, it } from "vitest";

import StableShardSequencer from "../../.storybook/stable-shard-sequencer.mjs";

// `--index-json` writes every story file's test into a fresh random temp dir
// per process, so each shard sees the same file names under a different root.
const namesOf = (count: number) =>
  Array.from({ length: count }, (_, i) => `story-${i}.test.js`);
const testsUnder = (root: string, names: string[]) =>
  names.map((name) => ({
    path: `${root}/${name}`,
    context: { config: { rootDir: "/repo" } },
  }));

const shardNames = (root: string, names: string[], shardIndex: number) =>
  new StableShardSequencer()
    .shard(testsUnder(root, names), { shardIndex, shardCount: 3 })
    .map((t: { path: string }) => t.path.split("/").pop());

describe("StableShardSequencer", () => {
  // 209 is the real suite; 31 and 4 leave a remainder, 4 barely fills 3 shards.
  it.each([30, 31, 209, 4])(
    "gives each of %i files to exactly one non-empty shard when each shard has its own temp dir",
    (count) => {
      const names = namesOf(count);
      const shards = [1, 2, 3].map((i) =>
        shardNames(`/tmp/random-${i}`, names, i),
      );
      const all = shards.flat();
      expect(shards.every((s) => s.length > 0)).toBe(true);
      expect(new Set(all).size).toBe(all.length);
      expect(all.toSorted()).toEqual(names.toSorted());
    },
  );

  it("puts a file on the same shard whatever the temp dir is", () => {
    const names = namesOf(30);
    expect(shardNames("/tmp/aaa", names, 2)).toEqual(
      shardNames("/tmp/bbb", names, 2),
    );
  });
});
