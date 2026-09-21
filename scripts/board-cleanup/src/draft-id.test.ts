import assert from "node:assert/strict";
import { test } from "node:test";
import { stripDraftPrefix, uniqueBaseIds } from "./draft-id";

test("returns a published id unchanged", () => {
  assert.equal(stripDraftPrefix("staff-board-abc123"), "staff-board-abc123");
});

test("strips a leading drafts. prefix", () => {
  assert.equal(stripDraftPrefix("drafts.staff-board-abc123"), "staff-board-abc123");
});

test("does not touch drafts. appearing mid-id", () => {
  assert.equal(stripDraftPrefix("staff-board-drafts.abc123"), "staff-board-drafts.abc123");
});

test("uniqueBaseIds returns base ids, not whichever shape came first", () => {
  // The exact case that broke migrate-board-docs.ts step 6c: the draft row
  // sorts before its published twin, so a dedupe that keeps the first raw id
  // it sees would return the drafts.* id and delete the draft twice while the
  // published document is never deleted.
  assert.deepEqual(
    uniqueBaseIds(["drafts.staff-board-a", "staff-board-a", "drafts.staff-board-b"]),
    ["staff-board-a", "staff-board-b"],
  );
});

test("uniqueBaseIds is order-independent — published-first gives the same result", () => {
  assert.deepEqual(
    uniqueBaseIds(["staff-board-a", "drafts.staff-board-a", "drafts.staff-board-b"]),
    ["staff-board-a", "staff-board-b"],
  );
});
