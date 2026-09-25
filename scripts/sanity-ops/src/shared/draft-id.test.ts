import { describe, expect, it } from "vitest";
import { stripDraftPrefix, uniqueBaseIds } from "./draft-id";

describe("stripDraftPrefix", () => {
  it("returns a published id unchanged", () => {
    expect(stripDraftPrefix("staff-board-abc123")).toBe("staff-board-abc123");
  });

  it("strips a leading drafts. prefix", () => {
    expect(stripDraftPrefix("drafts.responsibility-pestgedrag-melden")).toBe(
      "responsibility-pestgedrag-melden",
    );
  });

  it("does not touch drafts. appearing mid-id", () => {
    expect(stripDraftPrefix("staff-board-drafts.abc123")).toBe(
      "staff-board-drafts.abc123",
    );
  });
});

describe("uniqueBaseIds", () => {
  it("returns base ids, not whichever shape came first", () => {
    // The exact case that broke migrate-board-docs.ts step 6c: the draft row
    // sorts before its published twin, so a dedupe that keeps the first raw id
    // it sees would return the drafts.* id and delete the draft twice while the
    // published document is never deleted.
    expect(
      uniqueBaseIds([
        "drafts.staff-board-a",
        "staff-board-a",
        "drafts.staff-board-b",
      ]),
    ).toEqual(["staff-board-a", "staff-board-b"]);
  });

  it("is order-independent — published-first gives the same result", () => {
    expect(
      uniqueBaseIds([
        "staff-board-a",
        "drafts.staff-board-a",
        "drafts.staff-board-b",
      ]),
    ).toEqual(["staff-board-a", "staff-board-b"]);
  });
});
