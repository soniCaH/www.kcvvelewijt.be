import { describe, expect, it } from "vitest";
import type { PortableTextBlock } from "@portabletext/react";
import { segmentArticleBody } from "./segmentArticleBody";

const paragraph = (
  text: string,
  key = `p-${text.slice(0, 6)}`,
): PortableTextBlock => {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    children: [{ _type: "span", _key: `${key}-c`, text, marks: [] }],
    markDefs: [],
  } as PortableTextBlock;
};

const blockquote = (text: string, key: string): PortableTextBlock => {
  return {
    _type: "block",
    _key: key,
    style: "blockquote",
    children: [{ _type: "span", _key: `${key}-c`, text, marks: [] }],
    markDefs: [],
  } as PortableTextBlock;
};

const transferFact = (playerName: string, key: string): PortableTextBlock => {
  return {
    _type: "transferFact",
    _key: key,
    playerName,
    direction: "incoming",
  } as unknown as PortableTextBlock;
};

describe("segmentArticleBody", () => {
  it("returns a single pt segment for a body with no special blocks", () => {
    const segments = segmentArticleBody([paragraph("A."), paragraph("B.")]);
    expect(segments).toEqual([
      { kind: "pt", key: "pt-0", blocks: [paragraph("A."), paragraph("B.")] },
    ]);
  });

  it("groups consecutive blockquote blocks into one blockquote-group segment", () => {
    const bq1 = blockquote("Eerste.", "bq-1");
    const bq2 = blockquote("Tweede.", "bq-2");
    const segments = segmentArticleBody([
      paragraph("Intro."),
      bq1,
      bq2,
      paragraph("Slot."),
    ]);
    expect(segments.map((s) => s.kind)).toEqual([
      "pt",
      "blockquote-group",
      "pt",
    ]);
    const group = segments[1];
    if (group.kind !== "blockquote-group") throw new Error("expected group");
    expect(group.blocks).toEqual([bq1, bq2]);
  });

  it("keeps non-adjacent blockquotes as separate segments", () => {
    const segments = segmentArticleBody([
      blockquote("Eén.", "bq-1"),
      paragraph("Tussenzin."),
      blockquote("Twee.", "bq-2"),
    ]);
    const groups = segments.filter((s) => s.kind === "blockquote-group");
    expect(groups).toHaveLength(2);
  });

  it("groups consecutive transferFact blocks into one transfer-facts segment", () => {
    const segments = segmentArticleBody([
      paragraph("Intro."),
      transferFact("Joren De Smet", "tf-1"),
      transferFact("Wim Peeters", "tf-2"),
    ]);
    expect(segments.map((s) => s.kind)).toEqual(["pt", "transfer-facts"]);
    const facts = segments[1];
    if (facts.kind !== "transfer-facts") throw new Error("expected facts");
    expect(facts.facts.map((f) => f.playerName)).toEqual([
      "Joren De Smet",
      "Wim Peeters",
    ]);
  });

  it("drops a transferFact with no playerName rather than segmenting it", () => {
    const segments = segmentArticleBody([
      transferFact("", "tf-empty"),
      paragraph("Only content."),
    ]);
    expect(segments).toEqual([
      { kind: "pt", key: "pt-0", blocks: [paragraph("Only content.")] },
    ]);
  });

  it("interleaves transferFact and blockquote groups without cross-contaminating buffers", () => {
    const bq = blockquote("Quote.", "bq-1");
    const tf = transferFact("Joren De Smet", "tf-1");
    const segments = segmentArticleBody([
      paragraph("A."),
      bq,
      tf,
      paragraph("B."),
    ]);
    expect(segments.map((s) => s.kind)).toEqual([
      "pt",
      "blockquote-group",
      "transfer-facts",
      "pt",
    ]);
  });

  it("returns an empty array for an empty body", () => {
    expect(segmentArticleBody([])).toEqual([]);
  });

  it("assigns stable, ordered segment keys", () => {
    const segments = segmentArticleBody([
      paragraph("A."),
      blockquote("Q.", "bq-1"),
      paragraph("B."),
    ]);
    expect(segments.map((s) => s.key)).toEqual(["pt-0", "bq-1", "pt-2"]);
  });
});
