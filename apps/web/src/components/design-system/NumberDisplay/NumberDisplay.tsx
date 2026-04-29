import { createElement } from "react";
import { cn } from "@/lib/utils/cn";

export type NumberDisplaySize = "display-2xl" | "display-xl" | "display-lg";
export type NumberDisplayTone = "jersey" | "jersey-deep" | "ink" | "cream";
export type NumberDisplayAs = "span" | "div" | "p";

export interface NumberDisplayProps {
  value: string | number;
  size?: NumberDisplaySize;
  tone?: NumberDisplayTone;
  prefix?: string;
  suffix?: string;
  label?: string;
  as?: NumberDisplayAs;
  className?: string;
}

const SIZE_CLASS: Record<NumberDisplaySize, string> = {
  "display-2xl":
    "text-[length:var(--text-display-2xl)] leading-[var(--text-display-2xl--lh)]",
  "display-xl":
    "text-[length:var(--text-display-xl)] leading-[var(--text-display-xl--lh)]",
  "display-lg":
    "text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--lh)]",
};

const TONE_CLASS: Record<NumberDisplayTone, string> = {
  jersey: "text-jersey",
  "jersey-deep": "text-jersey-deep",
  ink: "text-ink",
  cream: "text-cream",
};

export function NumberDisplay({
  value,
  size = "display-xl",
  tone = "ink",
  prefix,
  suffix,
  label,
  as = "span",
  className,
}: NumberDisplayProps) {
  const numberSection = (
    <span
      className={cn(
        "font-display-big inline-flex items-baseline gap-1 font-black",
        SIZE_CLASS[size],
        TONE_CLASS[tone],
      )}
    >
      {prefix && (
        <span className="font-display text-[0.6em] font-semibold italic">
          {prefix}
        </span>
      )}
      <span>{value}</span>
      {suffix && (
        <span className="font-display text-[0.6em] font-semibold italic">
          {suffix}
        </span>
      )}
    </span>
  );

  const labelSection = label ? (
    <span
      className={cn(
        "font-mono text-[length:var(--text-mono-sm)] leading-none tracking-[0.08em] uppercase",
        tone === "cream" ? "text-cream/70" : "text-ink-muted",
      )}
    >
      {label}
    </span>
  ) : null;

  // span (default) keeps the number inline; div/p wrap label + value as a
  // flex column so labelled instances stack properly inside stat strips.
  const stack = label && as !== "span";

  return createElement(
    as,
    {
      "data-size": size,
      "data-tone": tone,
      className: cn(
        stack
          ? "inline-flex flex-col items-start gap-1"
          : "inline-flex items-baseline gap-1.5",
        className,
      ),
    },
    numberSection,
    labelSection,
  );
}
