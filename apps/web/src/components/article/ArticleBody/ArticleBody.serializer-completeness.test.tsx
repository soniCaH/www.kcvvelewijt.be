import { render } from "@testing-library/react";
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from "@portabletext/react";
import { schemaTypes } from "@kcvv/sanity-schemas";
import { describe, expect, it, vi } from "vitest";
import { ArticleBody, buildComponents } from "./ArticleBody";

/**
 * Guard #1 (#2278) — serializer completeness for the ArticleBody surface.
 *
 * `<ArticleBody>` serializes `article.body` + `page.body` (the two fields with
 * the largest `of:[]` surface). A body block type declared in the schema but
 * missing from the serializer map renders NOTHING — the exact `qaSectionDivider`
 * bug that shipped in #2275, which no unit test or type-check caught. This
 * guard drives the check off the REAL schema `of:[]` (not a hand-maintained key
 * table): every declared object type, annotation, and custom decorator must
 * resolve to a handler, and a spy on Portable Text's `unknownType` /
 * `unknownMark` must never fire. Deleting a serializer entry turns it red.
 *
 * Scope boundary (per issue): BioBlock / TeamEditorial (`player.bio`,
 * `staffMember.bio`, `team.body`) are Normal-locked with a tiny `of:[]` and are
 * NOT covered here — a deliberate future extension, noted so the gap is on the
 * record rather than silent.
 */

// Loose views over the schema so this test needs no `sanity` type import.
interface OfMember {
  type?: string;
  styles?: Array<{ value?: string }>;
  lists?: Array<{ value?: string }>;
  marks?: {
    annotations?: Array<{ name?: string }>;
    decorators?: Array<{ value?: string }>;
  };
}
interface FieldLike {
  name?: string;
  of?: OfMember[];
}
interface SchemaLike {
  name?: string;
  fields?: FieldLike[];
}

const TYPES = schemaTypes as unknown as SchemaLike[];

function bodyOf(typeName: string): OfMember[] {
  const type = TYPES.find((t) => t.name === typeName);
  const body = type?.fields?.find((f) => f.name === "body");
  return Array.isArray(body?.of) ? body.of : [];
}

const objectTypes = (of: OfMember[]): string[] =>
  of
    .map((m) => m.type)
    .filter((t): t is string => typeof t === "string" && t !== "block");

const blockMember = (of: OfMember[]): OfMember | undefined =>
  of.find((m) => m.type === "block");

const annotationNames = (of: OfMember[]): string[] =>
  (blockMember(of)?.marks?.annotations ?? [])
    .map((a) => a.name)
    .filter((n): n is string => typeof n === "string");

// Sanity's built-in decorators are handled by @portabletext/react's defaults;
// only project-custom decorators need an entry in our `marks` map.
const DEFAULT_DECORATORS = new Set([
  "strong",
  "em",
  "code",
  "underline",
  "strike-through",
]);
const customDecorators = (of: OfMember[]): string[] =>
  (blockMember(of)?.marks?.decorators ?? [])
    .map((d) => d.value)
    .filter(
      (v): v is string => typeof v === "string" && !DEFAULT_DECORATORS.has(v),
    );

// A `block` member that omits `lists` inherits Sanity's implicit bullet+number
// defaults — the exact state of `article.body`, which is why an editor can add a
// list the renderer must serialize. `lists: []` (bio/title blocks) opts out.
const DEFAULT_LISTS = ["bullet", "number"];
const listValues = (of: OfMember[]): string[] => {
  const block = blockMember(of);
  if (!block) return [];
  if (block.lists === undefined) return DEFAULT_LISTS;
  return block.lists
    .map((l) => l.value)
    .filter((v): v is string => typeof v === "string");
};

// A `block` member that omits `styles` inherits Sanity's default set. `normal`
// renders through Portable Text's default <p>; every other style needs a `block`
// serializer or it falls through as a bare, Preflight-stripped tag (flat text).
const DEFAULT_STYLES = [
  "normal",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
];
const styleValues = (of: OfMember[]): string[] => {
  const block = blockMember(of);
  if (!block) return [];
  if (block.styles === undefined) return DEFAULT_STYLES;
  return block.styles
    .map((s) => s.value)
    .filter((v): v is string => typeof v === "string");
};

// `transferFact` is routed by ArticleBody's adjacency segmenter
// (`buildSegments` → `<TransferFactGroup>`), NOT the Portable Text `types` map,
// so it is legitimately absent from the serializer map. Verified to still
// render via `<ArticleBody>` in its own test below, so the exclusion is not a
// silent hole.
const SEGMENTER_HANDLED = new Set(["transferFact"]);

const components = buildComponents({
  subjects: null,
  videoBlockPositions: new Map(),
});

describe.each([["article"], ["page"]])(
  "ArticleBody serializer completeness — %s.body (#2278)",
  (typeName) => {
    const of = bodyOf(typeName);

    it("has a non-empty body of:[] in the real schema", () => {
      expect(of.length).toBeGreaterThan(0);
    });

    it("every Portable-Text-routed object type has a serializer", () => {
      const types = components.types ?? {};
      const missing = objectTypes(of).filter(
        (t) => !SEGMENTER_HANDLED.has(t) && !(t in types),
      );
      expect(missing).toEqual([]);
    });

    it("every annotation has a mark serializer", () => {
      const marks = components.marks ?? {};
      const missing = annotationNames(of).filter((n) => !(n in marks));
      expect(missing).toEqual([]);
    });

    it("every custom decorator has a mark serializer", () => {
      const marks = components.marks ?? {};
      const missing = customDecorators(of).filter((n) => !(n in marks));
      expect(missing).toEqual([]);
    });

    // Lists live on the block's `lists` config, NOT the `of:[]` object surface —
    // so the type/annotation/decorator guards above are blind to them. Without a
    // `list`/`listItem` serializer, Tailwind Preflight strips the default ul/ol
    // markers and lists render as flat text (the #shipped bug).
    it("every list style has a list + listItem serializer", () => {
      const values = listValues(of);
      const list = (components.list ?? {}) as Record<string, unknown>;
      const missing = values.filter((v) => !(v in list));
      expect(missing).toEqual([]);
      if (values.length > 0) expect(components.listItem).toBeDefined();
    });

    // Block styles (h1–h6, blockquote) live on the block's `styles` config, also
    // outside the type/annotation/decorator surface. h1 must NOT be offered (the
    // article title is the page's only <h1>); every other offered style must have
    // a block serializer or it renders as flat text.
    it("does not offer h1 (title is the only page <h1>)", () => {
      expect(styleValues(of)).not.toContain("h1");
    });

    it("every non-normal block style has a block serializer", () => {
      const block = (components.block ?? {}) as Record<string, unknown>;
      const missing = styleValues(of).filter(
        (v) => v !== "normal" && !(v in block),
      );
      expect(missing).toEqual([]);
    });
  },
);

describe("ArticleBody serializer completeness — render integration (#2278)", () => {
  it("no article.body type/annotation renders through the unknown fallback", () => {
    const of = bodyOf("article");
    const unknownType = vi.fn();
    const unknownMark = vi.fn();
    const spied: PortableTextComponents = {
      ...components,
      unknownType,
      unknownMark,
    };

    const typeBlocks = objectTypes(of)
      .filter((t) => !SEGMENTER_HANDLED.has(t))
      .map((t, i) => ({ _type: t, _key: `type-${i}` }) as PortableTextBlock);

    // One text block carrying every annotation (as markDefs) + custom decorator.
    const annNames = annotationNames(of);
    const decVals = customDecorators(of);
    const markDefs = annNames.map((n, i) => ({ _type: n, _key: `md-${i}` }));
    const textBlock = {
      _type: "block",
      _key: "marks",
      style: "normal",
      markDefs,
      children: [
        ...markDefs.map((md, i) => ({
          _type: "span",
          _key: `sa-${i}`,
          text: "x",
          marks: [md._key],
        })),
        ...decVals.map((v, i) => ({
          _type: "span",
          _key: `sd-${i}`,
          text: "y",
          marks: [v],
        })),
      ],
    } as unknown as PortableTextBlock;

    render(
      <PortableText value={[textBlock, ...typeBlocks]} components={spied} />,
    );

    expect(unknownType).not.toHaveBeenCalled();
    expect(unknownMark).not.toHaveBeenCalled();
  });

  it("segmenter-handled transferFact renders via ArticleBody (not dropped)", () => {
    const { container } = render(
      <ArticleBody
        content={[
          {
            _type: "transferFact",
            _key: "tf",
            playerName: "Test Speler",
          } as unknown as PortableTextBlock,
        ]}
      />,
    );
    expect(
      container.querySelector("[data-transfer-fact-group]"),
    ).not.toBeNull();
  });

  it("bullet + numbered lists render with visible markers (Preflight-safe)", () => {
    const { container } = render(
      <ArticleBody
        content={
          [
            {
              _type: "block",
              _key: "b1",
              style: "normal",
              listItem: "bullet",
              level: 1,
              markDefs: [],
              children: [{ _type: "span", _key: "s1", text: "een", marks: [] }],
            },
            {
              _type: "block",
              _key: "b2",
              style: "normal",
              listItem: "number",
              level: 1,
              markDefs: [],
              children: [
                { _type: "span", _key: "s2", text: "twee", marks: [] },
              ],
            },
          ] as unknown as PortableTextBlock[]
        }
      />,
    );
    // Bare <ul>/<ol> would render (Preflight kills their markers) — assert the
    // explicit marker classes are present, which is what makes bullets visible.
    expect(container.querySelector("ul")?.className).toContain("list-disc");
    expect(container.querySelector("ol")?.className).toContain("list-decimal");
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("canary: removing the qaSectionDivider serializer trips unknownType", () => {
    const types = { ...(components.types ?? {}) } as Record<string, unknown>;
    delete types.qaSectionDivider;
    const unknownType = vi.fn();
    const spied = {
      ...components,
      types,
      unknownType,
    } as unknown as PortableTextComponents;

    render(
      <PortableText
        value={[{ _type: "qaSectionDivider", _key: "q" } as PortableTextBlock]}
        components={spied}
      />,
    );
    expect(unknownType).toHaveBeenCalled();
  });
});
