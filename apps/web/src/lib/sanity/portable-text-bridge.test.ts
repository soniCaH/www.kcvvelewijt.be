import { describe, it, expect } from "vitest";
import { toPortableTextBlocks } from "./portable-text-bridge";

describe("toPortableTextBlocks", () => {
  it("returns [] for null", () => {
    expect(toPortableTextBlocks(null)).toEqual([]);
  });

  it("returns [] for undefined", () => {
    expect(toPortableTextBlocks(undefined)).toEqual([]);
  });

  it("returns [] for an empty array", () => {
    expect(toPortableTextBlocks([])).toEqual([]);
  });

  it("normalises `markDefs: null` (Sanity typegen) to `[]` (library shape)", () => {
    const input = [
      {
        _type: "block",
        _key: "b1",
        children: [{ _type: "span", _key: "s1", text: "Hello", marks: [] }],
        markDefs: null,
        style: "normal",
      },
    ];
    const out = toPortableTextBlocks(input);
    expect(out[0]?.markDefs).toEqual([]);
  });

  it("defaults missing `children` to `[]`", () => {
    const input = [
      {
        _type: "block",
        _key: "b1",
        markDefs: null,
        style: "normal",
      },
    ];
    const out = toPortableTextBlocks(input);
    expect(out[0]?.children).toEqual([]);
  });

  it("preserves accent-marked spans untouched", () => {
    const input = [
      {
        _type: "block",
        _key: "b1",
        children: [
          { _type: "span", _key: "s1", text: "We zijn ", marks: [] },
          {
            _type: "span",
            _key: "s2",
            text: "klaar",
            marks: ["accent"],
          },
          {
            _type: "span",
            _key: "s3",
            text: " voor de volgende stap.",
            marks: [],
          },
        ],
        markDefs: null,
        style: "normal",
      },
    ];
    const out = toPortableTextBlocks(input);
    expect(out[0]?.children).toHaveLength(3);
    const accentSpan = (out[0]?.children?.[1] ?? null) as {
      marks?: string[];
    } | null;
    expect(accentSpan?.marks).toContain("accent");
  });

  it("preserves the `_key` so React reconciliation stays stable", () => {
    const input = [
      {
        _type: "block",
        _key: "stable-key",
        children: [],
        markDefs: null,
        style: "normal",
      },
    ];
    expect(toPortableTextBlocks(input)[0]?._key).toBe("stable-key");
  });
});
