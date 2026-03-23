// apps/web/src/components/design-system/SectionHeader/SectionHeader.tsx
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface SectionHeaderProps {
  title: string;
  /** Optional CTA link label */
  linkText?: string;
  /** Required when linkText is set */
  linkHref?: string;
  /** "light" = dark title on light bg (default); "dark" = white title on dark bg */
  variant?: "light" | "dark";
  /** Override the rendered heading level (default: 2) */
  as?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * Reusable section header with green left-border title and optional CTA link.
 * Used consistently across all homepage sections.
 *
 * All heading-override !important modifiers are encapsulated here so consumers
 * never have to fight the global `h1-h6 {}` cascade rule.
 */
export const SectionHeader = ({
  title,
  linkText,
  linkHref,
  variant = "light",
  as: Heading = "h2",
  className,
}: SectionHeaderProps) => {
  const isDark = variant === "dark";

  return (
    <header className={cn("flex items-end justify-between mb-10", className)}>
      <Heading
        className={cn(
          // Font — font-body! forces Montserrat over the global h1-h6 font-family rule
          "font-body! font-black!",
          // Size, spacing, decoration
          "text-[clamp(1.8rem,4vw,2.8rem)]! uppercase tracking-[-0.03em]! leading-none! mb-0!",
          // Green left accent bar
          "pl-4 border-l-4 border-kcvv-green-bright",
          // Colour
          isDark ? "text-white!" : "text-kcvv-black!",
        )}
      >
        {title}
      </Heading>

      {linkText && linkHref && (
        <Link
          href={linkHref}
          className={cn(
            "group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] transition-colors",
            isDark
              ? "text-white/80 hover:text-white"
              : "text-kcvv-green-dark hover:text-kcvv-green-bright",
          )}
        >
          {linkText}
          <span
            className="inline-block transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          >
            →
          </span>
        </Link>
      )}
    </header>
  );
};
