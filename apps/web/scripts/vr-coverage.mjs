#!/usr/bin/env node
// Fails when a VR run did not visit every story test-storybook runs (#3275).
//
// A green VR run only says that nothing it looked at failed. For 5 days the 3
// shards each took a random third of the suite and ~⅓ of the stories ran on
// no shard, all green. `.storybook/test-runner.ts` appends each visited story
// id to `$VR_VISITED_LOG`; this compares those ids with the built index.
//
//   node scripts/vr-coverage.mjs storybook-static/index.json visited-*.txt
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Story ids in `index` that test-storybook runs by default (a story entry
 * tagged `test`, not `skip`) and that no visited list contains.
 */
export function unvisitedStoryIds(index, visitedIds) {
  const visited = new Set(visitedIds);
  return Object.values(index.entries)
    .filter(
      (entry) =>
        entry.type === "story" &&
        entry.tags.includes("test") &&
        !entry.tags.includes("skip"),
    )
    .map((entry) => entry.id)
    .filter((id) => !visited.has(id));
}

function main([indexPath, ...visitedPaths]) {
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  // A missing list throws: a shard that wrote nothing is a failure, not zero.
  const visited = visitedPaths.flatMap((p) =>
    readFileSync(p, "utf8").split("\n").filter(Boolean),
  );
  const missing = unvisitedStoryIds(index, visited);
  if (missing.length > 0) {
    console.error(
      `::error::${missing.length} stories were never visited by any VR shard: ${missing.join(" ")}`,
    );
    process.exit(1);
  }
  console.log(`Every story was visited (${new Set(visited).size} ids).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
