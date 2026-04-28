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
  sm: "text-[11px] tracking-[0.08em]",
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
