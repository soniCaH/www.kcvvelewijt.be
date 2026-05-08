export type MonoLabelVariant =
  | "plain"
  | "pill-jersey"
  | "pill-ink"
  | "pill-cream";
export type MonoLabelSize = "sm" | "md";

/**
 * Text colour for the `plain` variant. Pill variants are self-contained
 * badges (their bg/text pair is variant-determined) and ignore `tone`.
 *
 * - `ink` (default) — readable on cream / paper surfaces.
 * - `cream` — readable on jersey-deep / ink surfaces, e.g. the meta line
 *   above the editorial heading inside `<YouthBackdrop>` (#1675).
 */
export type MonoLabelTone = "ink" | "cream";

export interface MonoLabelProps {
  variant?: MonoLabelVariant;
  size?: MonoLabelSize;
  tone?: MonoLabelTone;
  children: React.ReactNode;
}

const VARIANT_CLASS: Record<MonoLabelVariant, string> = {
  plain: "",
  "pill-jersey": "bg-jersey text-ink",
  "pill-ink": "bg-ink text-cream",
  "pill-cream": "bg-cream-soft text-ink border border-paper-edge",
};

// Applied only to the `plain` variant — pills already carry their own text
// colour and shouldn't have it overridden by `tone`.
const PLAIN_TONE_CLASS: Record<MonoLabelTone, string> = {
  ink: "text-ink",
  cream: "text-cream/85",
};

// Per-size font + spacing: pill variants need real vertical padding to read
// as badges; plain renders inline so adds none.
const SIZE_CLASS: Record<MonoLabelSize, string> = {
  // sm consumes the canonical `--text-label` token (11px / 0.08em) so any
  // future tweak to the label size lands here automatically.
  sm: "text-[length:var(--text-label)] tracking-[var(--text-label--tracking)]",
  // md keeps explicit values — no design token represents 13px/0.06em yet;
  // promote to a token when a second consumer needs the same size.
  md: "text-[13px] tracking-[0.06em]",
};

// Pill padding is per-size; plain has no padding at any size.
const PILL_PADDING_CLASS: Record<MonoLabelSize, string> = {
  sm: "px-2 py-1",
  md: "px-2.5 py-1.5",
};

export function MonoLabel({
  variant = "plain",
  size = "sm",
  tone = "ink",
  children,
}: MonoLabelProps) {
  const isPill = variant !== "plain";
  const toneClass = isPill ? "" : PLAIN_TONE_CLASS[tone];
  return (
    <span
      data-variant={variant}
      data-size={size}
      data-tone={tone}
      className={`${VARIANT_CLASS[variant]} ${toneClass} ${SIZE_CLASS[size]} ${
        isPill ? PILL_PADDING_CLASS[size] : ""
      } inline-block font-mono leading-none font-medium uppercase`}
    >
      {children}
    </span>
  );
}
