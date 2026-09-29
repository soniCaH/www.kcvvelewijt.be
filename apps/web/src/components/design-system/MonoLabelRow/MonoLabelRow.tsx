import { Fragment } from "react";
import { cn } from "@/lib/utils/cn";
import {
  MonoLabel,
  type MonoLabelProps,
  type MonoLabelTone,
} from "../MonoLabel";

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
  /**
   * Text tone applied to every `plain`-variant item and to the divider —
   * forwarded to each `<MonoLabel>` (pill variants ignore it, same as
   * `MonoLabel` itself). Defaults to "ink" (readable on cream/paper). Pass
   * "cream" on a dark card (e.g. `<PullQuote>`'s context-label slot) so
   * the row stays readable.
   */
  tone?: MonoLabelTone;
  className?: string;
}

// `ink` and `muted` read identically on the divider (both are the same
// ink-muted grey) — the only real axis is light-surface vs dark-surface,
// so the divider classes are keyed on that shade rather than repeating the
// same string under three tone keys.
type DividerShade = "light" | "dark";

function shadeFor(tone: MonoLabelTone): DividerShade {
  return tone === "cream" ? "dark" : "light";
}

// Full class strings per shade, built by template-literal concatenation —
// no `cn()`. `--text-label` is a custom @theme *size* token, so passing it
// through `cn()` alongside a `text-*` colour utility makes tailwind-merge
// treat both as the same "text colour" slot and silently drop one (#2769's
// failure mode). Precomputing the complete string sidesteps the merge
// entirely, matching `MonoLabel.tsx`'s own static-base + tone-class
// concatenation.
const DOT_CLASS: Record<DividerShade, string> = {
  light: "bg-ink-muted/60 inline-block h-[3px] w-[3px] rounded-full",
  dark: "bg-cream/60 inline-block h-[3px] w-[3px] rounded-full",
};
const GLYPH_CLASS: Record<DividerShade, string> = {
  light: "text-ink-muted text-label font-mono",
  dark: "text-cream text-label font-mono",
};

export function MonoLabelRow({
  items,
  divider = "·",
  as: Tag = "div",
  wrap = true,
  tone = "ink",
  className,
}: MonoLabelRowProps) {
  if (items.length === 0) return null;

  const isList = Tag === "ol" || Tag === "ul";
  const shade = shadeFor(tone);

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
          <MonoLabel
            variant={item.variant ?? "plain"}
            size={item.size ?? "sm"}
            tone={tone}
          >
            {item.label}
          </MonoLabel>
        );
        const dividerEl =
          index < items.length - 1 ? (
            divider === "·" ? (
              <span
                data-divider="true"
                data-divider-glyph={divider}
                aria-hidden="true"
                className={DOT_CLASS[shade]}
              />
            ) : (
              <span
                data-divider="true"
                data-divider-glyph={divider}
                aria-hidden="true"
                className={GLYPH_CLASS[shade]}
              >
                {divider}
              </span>
            )
          ) : null;
        return isList ? (
          // <ol>/<ul> requires <li> direct children. Pack the label AND its
          // following divider inside the same <li> so list semantics stay
          // valid — divider <span>s as direct children of <ol>/<ul> would be
          // invalid HTML.
          <li key={index} className="inline-flex list-none items-center gap-2">
            {label}
            {dividerEl}
          </li>
        ) : (
          // Non-list mode: MonoLabel is a direct flex child of the row.
          <Fragment key={index}>
            {label}
            {dividerEl}
          </Fragment>
        );
      })}
    </Tag>
  );
}
