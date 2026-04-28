export type MonoLabelVariant =
  | "plain"
  | "pill-jersey"
  | "pill-ink"
  | "pill-cream";
export type MonoLabelSize = "sm" | "md";

export interface MonoLabelProps {
  variant?: MonoLabelVariant;
  size?: MonoLabelSize;
  children: React.ReactNode;
}

const VARIANT_CLASS: Record<MonoLabelVariant, string> = {
  plain: "text-ink",
  "pill-jersey": "bg-jersey text-ink px-2 py-0.5",
  "pill-ink": "bg-ink text-cream px-2 py-0.5",
  "pill-cream": "bg-cream-soft text-ink px-2 py-0.5 border border-paper-edge",
};

const SIZE_CLASS: Record<MonoLabelSize, string> = {
  // sm consumes the canonical `--text-label` token (11px / 0.08em) so any
  // future tweak to the label size lands here automatically.
  sm: "text-[length:var(--text-label)] tracking-[var(--text-label--tracking)]",
  // md keeps explicit values — no design token represents 13px/0.06em yet;
  // promote to a token when a second consumer needs the same size.
  md: "text-[13px] tracking-[0.06em]",
};

export function MonoLabel({
  variant = "plain",
  size = "sm",
  children,
}: MonoLabelProps) {
  return (
    <span
      data-variant={variant}
      data-size={size}
      className={`${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} inline-block font-mono leading-none font-medium uppercase`}
    >
      {children}
    </span>
  );
}
