import type { PortableTextBlock } from "@portabletext/react";

/**
 * Bridge between Sanity typegen's PT shape and `@portabletext/react`'s
 * `PortableTextBlock`. Two mismatches need normalising:
 *
 *   - Sanity emits `children?:` (optional) while the library requires
 *     `children: [...]`. We default to `[]` so the renderer doesn't
 *     crash on a block that came back without spans.
 *   - Sanity emits `markDefs?: null` (literal null) while the library
 *     expects `markDefs?: PortableTextMarkDefinition[] | undefined`.
 *     We coerce `null` → `[]` so the library's mark-resolution path
 *     can safely iterate.
 *
 * The runtime data is valid PT; only the TS shape differs. The function
 * returns a structurally-correct `PortableTextBlock[]` so consumers can
 * pass it straight to `<PortableText value={...} />` (and to
 * `<EditorialHero title={...}>` / `<EditorialHeading>` which accept the
 * same shape).
 *
 * Returns an empty array when the input is null/undefined so call-sites
 * can fall back to a plain-string title without an extra guard.
 */
export function toPortableTextBlocks(
  input:
    | ReadonlyArray<{
        _type: string;
        _key: string;
        children?: ReadonlyArray<unknown>;
        markDefs?: ReadonlyArray<unknown> | null;
        style?: string;
        level?: number;
        listItem?: string | never;
      }>
    | null
    | undefined,
): PortableTextBlock[] {
  if (!input || input.length === 0) return [];
  return input.map((block) => ({
    ...block,
    children: (block.children ?? []) as PortableTextBlock["children"],
    markDefs: (block.markDefs ?? []) as PortableTextBlock["markDefs"],
  })) as PortableTextBlock[];
}
