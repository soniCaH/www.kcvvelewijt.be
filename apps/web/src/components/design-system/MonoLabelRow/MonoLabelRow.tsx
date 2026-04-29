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
      {items.map((item, index) => {
        const label = (
          <MonoLabel variant={item.variant ?? "plain"} size={item.size ?? "sm"}>
            {item.label}
          </MonoLabel>
        );
        return (
          <Fragment key={index}>
            {isList ? (
              // <ol>/<ul> requires <li> children. inline-flex on the <li>
              // bypasses the inline strut so the list item sizes to the
              // MonoLabel's actual height.
              <li className="inline-flex list-none items-center">{label}</li>
            ) : (
              // No wrapper — MonoLabel is a direct flex child. Its
              // inline-block leading-none box is already 11px.
              label
            )}
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
        );
      })}
    </Tag>
  );
}
