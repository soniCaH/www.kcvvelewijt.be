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
          {/* Item wrapper inherits browser-default line-height by default,
              which makes the wrapper's box taller than its MonoLabel content
              and pushes flex `items-center` to centre against an empty box
              centre rather than the label's actual visual centre. Forcing
              leading-none collapses the wrapper to the label's height so
              dots line up with cap-height middle. */}
          <ItemTag className={cn("leading-none", isList && "list-none")}>
            <MonoLabel
              variant={item.variant ?? "plain"}
              size={item.size ?? "sm"}
            >
              {item.label}
            </MonoLabel>
          </ItemTag>
          {index < items.length - 1 &&
            (divider === "·" ? (
              <span
                data-divider="true"
                data-divider-glyph={divider}
                aria-hidden="true"
                className="bg-ink-muted/60 inline-block h-[3px] w-[3px] rounded-full"
              />
            ) : (
              <span
                data-divider="true"
                data-divider-glyph={divider}
                aria-hidden="true"
                className="text-ink-muted font-mono text-[length:var(--text-label)] leading-none"
              >
                {divider}
              </span>
            ))}
        </Fragment>
      ))}
    </Tag>
  );
}
