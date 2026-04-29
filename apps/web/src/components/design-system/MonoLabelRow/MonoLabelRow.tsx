import { Fragment } from "react";
import { cn } from "@/lib/utils/cn";
import { MonoLabel, type MonoLabelProps } from "../MonoLabel";

export type MonoLabelRowDivider = "·" | "|" | "/" | "★";
export type MonoLabelRowAs = "div" | "ol" | "ul";

export interface MonoLabelRowItem {
  label: string;
  variant?: MonoLabelProps["variant"];
  size?: MonoLabelProps["size"];
}

export interface MonoLabelRowProps {
  items: MonoLabelRowItem[];
  divider?: MonoLabelRowDivider;
  as?: MonoLabelRowAs;
  wrap?: boolean;
  className?: string;
}

export function MonoLabelRow({
  items,
  divider = "·",
  as: Tag = "div",
  wrap = true,
  className,
}: MonoLabelRowProps) {
  if (items.length === 0) return null;

  const isList = Tag === "ol" || Tag === "ul";
  const ItemTag = isList ? "li" : "span";

  return (
    <Tag
      data-divider-glyph={divider}
      className={cn(
        "flex items-center gap-2",
        wrap && "flex-wrap",
        isList && "list-none",
        className,
      )}
    >
      {items.map((item, index) => (
        <Fragment key={index}>
          <ItemTag className={isList ? "list-none" : undefined}>
            <MonoLabel
              variant={item.variant ?? "plain"}
              size={item.size ?? "sm"}
            >
              {item.label}
            </MonoLabel>
          </ItemTag>
          {index < items.length - 1 && (
            <span
              data-divider="true"
              aria-hidden="true"
              // Match MonoLabel's font sizing + leading-none so the glyph
              // centers vertically with the label text rather than floating
              // above it (default browser baseline alignment for "·").
              className="text-ink-muted font-mono text-[length:var(--text-label)] leading-none"
            >
              {divider}
            </span>
          )}
        </Fragment>
      ))}
    </Tag>
  );
}
