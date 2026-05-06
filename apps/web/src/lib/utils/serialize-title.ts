import type { PortableTextBlock } from "@portabletext/react";

interface TitleSpan {
  _type?: "span";
  _key?: string;
  text?: string;
  marks?: string[];
}

export type TitleValue = string | PortableTextBlock[];

export function serializeTitle(value: TitleValue): string {
  if (typeof value === "string") return value;
  const block = value[0];
  if (!block || !Array.isArray((block as { children?: unknown }).children)) {
    return "";
  }
  const children = (block as PortableTextBlock).children as TitleSpan[];
  return children.map((c) => c.text ?? "").join("");
}

export function isPortableTextTitle(
  value: TitleValue,
): value is PortableTextBlock[] {
  return Array.isArray(value);
}
