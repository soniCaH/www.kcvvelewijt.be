import assert from "node:assert/strict";
import { test } from "node:test";
import { stripDraftPrefix } from "./draft-id";

test("returns a published id unchanged", () => {
  assert.equal(
    stripDraftPrefix("responsibility-pestgedrag-melden"),
    "responsibility-pestgedrag-melden",
  );
});

test("strips a leading drafts. prefix", () => {
  assert.equal(
    stripDraftPrefix("drafts.responsibility-pestgedrag-melden"),
    "responsibility-pestgedrag-melden",
  );
});

test("does not touch drafts. appearing mid-id", () => {
  assert.equal(
    stripDraftPrefix("responsibility-drafts.example"),
    "responsibility-drafts.example",
  );
});
