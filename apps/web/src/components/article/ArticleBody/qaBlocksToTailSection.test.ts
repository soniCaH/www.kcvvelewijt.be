import type { PortableTextBlock } from "@portabletext/react";
import { describe, expect, it } from "vitest";
import { qaBlocksToTailSection } from "./qaBlocksToTailSection";

const paragraph = (key: string, text = "lorem"): PortableTextBlock =>
  ({
    _type: "block",
    _key: key,
    style: "normal",
    children: [{ _type: "span", _key: `${key}-c`, text, marks: [] }],
    markDefs: [],
  }) as PortableTextBlock;

const qaBlock = (
  key: string,
  opts: { groupAtTail?: boolean; pairs?: number } = {},
): PortableTextBlock =>
  ({
    _type: "qaBlock",
    _key: key,
    pairs: Array.from({ length: opts.pairs ?? 1 }, (_, i) => ({
      _key: `${key}-pair-${i}`,
      question: `Q${i}`,
      respondents: [],
    })),
    ...(opts.groupAtTail === true ? { groupAtTail: true } : {}),
  }) as unknown as PortableTextBlock;

describe("qaBlocksToTailSection", () => {
  it("returns empty arrays for an empty body", () => {
    expect(qaBlocksToTailSection([])).toEqual({ inFlow: [], tailBlocks: [] });
  });

  it("returns empty arrays for null / undefined body", () => {
    expect(qaBlocksToTailSection(null)).toEqual({ inFlow: [], tailBlocks: [] });
    expect(qaBlocksToTailSection(undefined)).toEqual({
      inFlow: [],
      tailBlocks: [],
    });
  });

  it("passes through a body with no qaBlocks unchanged", () => {
    const body = [paragraph("p1"), paragraph("p2"), paragraph("p3")];
    const result = qaBlocksToTailSection(body);
    expect(result.inFlow).toEqual(body);
    expect(result.tailBlocks).toEqual([]);
  });

  it("keeps in-flow qaBlocks in `inFlow` (groupAtTail unset or false)", () => {
    const body = [
      paragraph("p1"),
      qaBlock("qa-1"),
      paragraph("p2"),
      qaBlock("qa-2", { groupAtTail: false }),
      paragraph("p3"),
    ];
    const result = qaBlocksToTailSection(body);
    expect(result.inFlow).toEqual(body);
    expect(result.tailBlocks).toEqual([]);
  });

  it("hoists a single groupAtTail qaBlock into tailBlocks", () => {
    const tail = qaBlock("qa-tail", { groupAtTail: true });
    const body = [paragraph("p1"), tail, paragraph("p2")];
    const result = qaBlocksToTailSection(body);
    expect(result.inFlow).toEqual([paragraph("p1"), paragraph("p2")]);
    expect(result.tailBlocks).toEqual([tail]);
  });

  it("hoists multiple groupAtTail qaBlocks interleaved with in-flow content, preserving source order in both arrays", () => {
    const tailA = qaBlock("tail-a", { groupAtTail: true });
    const inFlowQa = qaBlock("inflow-qa");
    const tailB = qaBlock("tail-b", { groupAtTail: true });
    const tailC = qaBlock("tail-c", { groupAtTail: true });
    const body = [
      paragraph("p1"),
      tailA,
      paragraph("p2"),
      inFlowQa,
      tailB,
      paragraph("p3"),
      tailC,
    ];
    const result = qaBlocksToTailSection(body);
    expect(result.inFlow).toEqual([
      paragraph("p1"),
      paragraph("p2"),
      inFlowQa,
      paragraph("p3"),
    ]);
    expect(result.tailBlocks).toEqual([tailA, tailB, tailC]);
  });

  it("is idempotent — feeding the returned `inFlow` back yields the same inFlow + empty tailBlocks", () => {
    const tail = qaBlock("tail-1", { groupAtTail: true });
    const body = [paragraph("p1"), tail, paragraph("p2")];
    const { inFlow: firstPass } = qaBlocksToTailSection(body);
    const second = qaBlocksToTailSection(firstPass);
    expect(second.inFlow).toEqual(firstPass);
    expect(second.tailBlocks).toEqual([]);
  });
});
