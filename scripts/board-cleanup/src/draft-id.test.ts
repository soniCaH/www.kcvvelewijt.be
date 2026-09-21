import assert from "node:assert/strict";
import { test } from "node:test";
import { stripDraftPrefix } from "./draft-id";

test("returns a published id unchanged", () => {
  assert.equal(stripDraftPrefix("staff-board-abc123"), "staff-board-abc123");
});

test("strips a leading drafts. prefix", () => {
  assert.equal(stripDraftPrefix("drafts.staff-board-abc123"), "staff-board-abc123");
});

test("does not touch drafts. appearing mid-id", () => {
  assert.equal(stripDraftPrefix("staff-board-drafts.abc123"), "staff-board-drafts.abc123");
});
