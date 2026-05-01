import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { STROKE_PATH } from "../HighlighterStroke/strokes";

export type EditorialLinkVariant = "cta" | "inline";
export type EditorialLinkTone = "light" | "dark";

export interface EditorialLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: EditorialLinkVariant;
  tone?: EditorialLinkTone;
  withArrow?: boolean;
  className?: string;
}

// Mask geometry shared with <HighlighterStroke> via STROKE_PATH so the sweep
// uses the same hand-pulled slab outline. fill='black' makes this a mask:
// the consuming element fills via background-color so the sweep colour is
// driven by tone, not by the mask SVG.
const HIGHLIGHTER_MASK_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 14' preserveAspectRatio='none'><path d='${STROKE_PATH}' fill='black'/></svg>`,
)}`;

const TEXT_TONE: Record<EditorialLinkTone, string> = {
  light: "text-jersey-deep",
  dark: "text-cream/85",
};

const SWEEP_TONE: Record<EditorialLinkTone, string> = {
  light: "bg-jersey-deep",
  dark: "bg-jersey/65",
};

const VARIANT_TYPE: Record<EditorialLinkVariant, string> = {
  cta: "font-mono text-[length:var(--text-label)] leading-none font-medium tracking-[var(--text-label--tracking)] uppercase",
  inline: "font-medium",
};

export const EditorialLink = ({
  href,
  children,
  variant = "inline",
  tone = "light",
  withArrow,
  className,
}: EditorialLinkProps) => {
  const showArrow = withArrow ?? variant === "cta";

  return (
    <Link
      href={href}
      data-variant={variant}
      data-tone={tone}
      className={cn(
        "group inline-flex items-center gap-2",
        VARIANT_TYPE[variant],
        TEXT_TONE[tone],
        className,
      )}
    >
      <span className="relative inline-block">
        {children}
        <span
          aria-hidden="true"
          className={cn(
            "absolute right-0 -bottom-1 left-0 h-[0.45em] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none",
            SWEEP_TONE[tone],
          )}
          style={{
            WebkitMaskImage: `url("${HIGHLIGHTER_MASK_DATA_URL}")`,
            maskImage: `url("${HIGHLIGHTER_MASK_DATA_URL}")`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        />
      </span>
      {showArrow && (
        <span
          aria-hidden="true"
          className="inline-block transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none"
        >
          →
        </span>
      )}
    </Link>
  );
};
