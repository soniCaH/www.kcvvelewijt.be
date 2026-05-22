/**
 * Unit tests for the shared `pullquote` decorator span-indexing utility.
 * BioBlock (`n = 0`) and QuotesBlock (`n = 1`) both depend on these
 * semantics — if a marked-run rule changes, it should change here.
 */

import { describe, it, expect } from "vitest";
import type { PortableTextBlock } from "@portabletext/react";
import {
  findNthPullquoteText,
  hasRenderableBioContent,
} from "./findPullquoteText";

function block(
  key: string,
  ...spans: ReadonlyArray<{ text: string; marks?: string[] }>
): PortableTextBlock {
  return {
    _type: "block",
    _key: `block-${key}`,
    style: "normal",
    children: spans.map((span, i) => ({
      _type: "span",
      _key: `${key}-${i}`,
      text: span.text,
      marks: span.marks ?? [],
    })),
    markDefs: [],
  } as unknown as PortableTextBlock;
}

describe("hasRenderableBioContent", () => {
  it("returns false for an empty array", () => {
    expect(hasRenderableBioContent([])).toBe(false);
  });

  it("returns false when every block is whitespace", () => {
    expect(
      hasRenderableBioContent([
        block("a", { text: "" }),
        block("b", { text: "  " }),
      ]),
    ).toBe(false);
  });

  it("returns true when any block has non-whitespace text", () => {
    expect(
      hasRenderableBioContent([
        block("a", { text: "  " }),
        block("b", { text: "Hello" }),
      ]),
    ).toBe(true);
  });
});

describe("findNthPullquoteText", () => {
  it("returns null when no spans are marked", () => {
    const bio = [block("a", { text: "Plain text only." })];
    expect(findNthPullquoteText(bio, 0)).toBeNull();
    expect(findNthPullquoteText(bio, 1)).toBeNull();
  });

  it("returns the first marked run for n=0", () => {
    const bio = [
      block(
        "p",
        { text: "Intro " },
        { text: "first quote.", marks: ["pullquote"] },
        { text: " tail." },
      ),
    ];
    expect(findNthPullquoteText(bio, 0)).toBe("first quote.");
  });

  it("returns the second marked run for n=1 within the same block", () => {
    const bio = [
      block(
        "p",
        { text: "Intro " },
        { text: "first quote.", marks: ["pullquote"] },
        { text: " middle " },
        { text: "second quote.", marks: ["pullquote"] },
        { text: " tail." },
      ),
    ];
    expect(findNthPullquoteText(bio, 0)).toBe("first quote.");
    expect(findNthPullquoteText(bio, 1)).toBe("second quote.");
    expect(findNthPullquoteText(bio, 2)).toBeNull();
  });

  it("returns the second marked run across blocks", () => {
    const bio = [
      block(
        "p1",
        { text: "Intro " },
        { text: "first quote.", marks: ["pullquote"] },
      ),
      block(
        "p2",
        { text: "Other " },
        { text: "second quote.", marks: ["pullquote"] },
      ),
    ];
    expect(findNthPullquoteText(bio, 0)).toBe("first quote.");
    expect(findNthPullquoteText(bio, 1)).toBe("second quote.");
  });

  it("concatenates adjacent marked spans into one run", () => {
    const bio = [
      block(
        "p",
        { text: "Intro " },
        { text: "first ", marks: ["pullquote"] },
        { text: "continued.", marks: ["pullquote"] },
        { text: " tail " },
        { text: "second.", marks: ["pullquote"] },
      ),
    ];
    expect(findNthPullquoteText(bio, 0)).toBe("first continued.");
    expect(findNthPullquoteText(bio, 1)).toBe("second.");
  });

  it("returns null for n=1 when only one marked run exists", () => {
    const bio = [
      block(
        "p",
        { text: "Intro " },
        { text: "only run.", marks: ["pullquote"] },
      ),
    ];
    expect(findNthPullquoteText(bio, 1)).toBeNull();
  });

  it("skips marked runs whose trimmed text is empty", () => {
    const bio = [
      block(
        "p",
        { text: "Intro " },
        { text: "   ", marks: ["pullquote"] },
        { text: " mid " },
        { text: "real quote.", marks: ["pullquote"] },
      ),
    ];
    expect(findNthPullquoteText(bio, 0)).toBe("real quote.");
  });

  it("returns null for a negative index", () => {
    const bio = [block("p", { text: "x ", marks: ["pullquote"] })];
    expect(findNthPullquoteText(bio, -1)).toBeNull();
  });
});
