import type { PortableTextBlock } from "@portabletext/react";

/**
 * Flatten a `qaPair.respondents[].answer` PortableText body to a plain
 * string for `<PullQuote>`'s `children` prop. Inline marks are dropped —
 * `key` and `quote` bodies are typically a single paragraph and PullQuote
 * renders a flat `<q>` element, so marks would be ignored anyway. Multiple
 * blocks are joined with a single space (matching the rendered prose flow
 * after CSS collapse).
 */
export function flattenAnswerToString(
  blocks: PortableTextBlock[] | undefined,
): string {
  if (!blocks || blocks.length === 0) return "";
  return blocks
    .map((block) => {
      const children = (block as { children?: unknown }).children;
      if (!Array.isArray(children)) return "";
      return children
        .map((child) => {
          if (
            child &&
            typeof child === "object" &&
            (child as { _type?: unknown })._type === "span" &&
            typeof (child as { text?: unknown }).text === "string"
          ) {
            return (child as { text: string }).text;
          }
          return "";
        })
        .join("");
    })
    .filter((s) => s.length > 0)
    .join(" ");
}
