import { cn } from "@/lib/utils/cn";

export type ShieldFigureSize = "sm" | "md";
export type ShieldFigureVariant = "kcvv" | "opponent";

export interface ShieldFigureProps {
  variant: ShieldFigureVariant;
  /** Team name — used to derive the initial fallback when no logo is provided. */
  name: string;
  /** Optional team logo URL. Rendered inside the shield with object-contain. */
  logoUrl?: string;
  /** Size variant. `sm` = 28×33 (mobile), `md` = 36×42 (desktop). Default `md`. */
  size?: ShieldFigureSize;
  className?: string;
}

const SIZE: Record<ShieldFigureSize, { w: number; h: number; font: number }> = {
  sm: { w: 28, h: 33, font: 14 },
  md: { w: 36, h: 42, font: 18 },
};

/**
 * Last-word-initial: "RC Mechelen" → "M", "KCVV" → "K". Falls back to the
 * first character of the trimmed name when there's no whitespace.
 */
function deriveInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const tail = trimmed.split(/\s+/).at(-1) ?? trimmed;
  return tail[0]!.toUpperCase();
}

export function ShieldFigure({
  variant,
  name,
  logoUrl,
  size = "md",
  className,
}: ShieldFigureProps) {
  const { w, h, font } = SIZE[size];
  // Inset by half the stroke width so the 1.5px ink stroke sits flush inside
  // the bounding box rather than half-extending outside it.
  const inset = 0.75;
  const path = `M${inset} ${inset} L${w - inset} ${inset} L${w - inset} ${h * 0.66} L${w / 2} ${h - inset} L${inset} ${h * 0.66} Z`;

  const fillVar =
    variant === "kcvv" ? "var(--color-jersey-deep)" : "var(--color-cream-soft)";
  const initialTone = variant === "kcvv" ? "text-cream" : "text-ink";

  const initial = deriveInitial(name);

  const ariaLabel = name.trim() || "Unnamed team";

  return (
    <span
      data-variant={variant}
      data-size={size}
      role="img"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: w, height: h }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        aria-hidden="true"
        className="absolute inset-0"
      >
        <path
          d={path}
          fill={fillVar}
          stroke="var(--color-ink)"
          strokeWidth={1.5}
          strokeLinejoin="miter"
        />
      </svg>

      {logoUrl ? (
        // Inset the logo so it never overlaps the heraldic stroke.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none relative z-10 object-contain"
          style={{ width: w * 0.6, height: h * 0.55 }}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "font-display relative z-10 leading-none font-black italic",
            initialTone,
          )}
          style={{ fontSize: font }}
        >
          {initial}
        </span>
      )}
    </span>
  );
}
