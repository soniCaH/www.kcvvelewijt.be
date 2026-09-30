// Jest's own sequencer, with one change: `shard()` hashes the test file's
// basename instead of its path relative to `rootDir` (#3275).
//
// `--index-json` writes each story file's test into a fresh random temp dir
// per process (`tempy.directory()` in @storybook/test-runner), and Jest's
// default hash includes that dir. Every shard is its own process, so each
// sorted the suite in a different order and took its own third: 61 of 209
// story files ran on no shard at all. Basenames are the story titles, which
// are unique, so they give every shard the same order.
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

// apps/web has no direct Jest dependency; reach Jest's sequencer through the
// test runner that brings it.
const Sequencer = createRequire(import.meta.resolve("@storybook/test-runner"))(
  "@jest/test-sequencer",
).default;

export default class StableShardSequencer extends Sequencer {
  shard(tests, { shardIndex, shardCount }) {
    const size = Math.ceil(tests.length / shardCount);
    return tests
      .map((test) => ({
        hash: createHash("sha1").update(path.basename(test.path)).digest("hex"),
        test,
      }))
      .sort((a, b) => (a.hash < b.hash ? -1 : a.hash > b.hash ? 1 : 0))
      .slice(size * (shardIndex - 1), size * shardIndex)
      .map(({ test }) => test);
  }
}
