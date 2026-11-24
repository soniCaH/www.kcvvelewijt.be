import { describe, expect, it } from "vitest";
import { hashMemberId } from "./hash-member-id";

// [input, output] taken from the web function `hashMemberId`
// (apps/web/src/lib/analytics/hash-member-id.ts). If the web hash changes,
// recompute these from it AND update the copy here: GA4 holds the old hashes.
const WEB_PAIRS: [string, string][] = [
  ["", "1505"],
  ["a", "2b606"],
  ["sponsor-1", "c480857"],
  ["9f4c1e2a-7b3d-4c5e-8a1f-0d2b6c3e4f5a", "98eb1ff2"], // top bit set
  ["drafts.sponsor-abc", "1275177e"],
  ["Garage Janssens é", "605323da"],
  ["zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz", "25b86815"],
];

describe("hashMemberId (copy of the web hash)", () => {
  it.each(WEB_PAIRS)("hashes %j to %s, as the web does", (input, expected) => {
    expect(hashMemberId(input)).toBe(expected);
  });
});
