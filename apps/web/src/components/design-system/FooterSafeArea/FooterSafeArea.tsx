import { cn } from "@/lib/utils/cn";
import type { SectionBg } from "@/components/design-system/SectionTransition/SectionTransition";

export interface FooterSafeAreaProps {
  /**
   * Background color that should show through the `PageFooter`'s
   * `overlap="full"` diagonal upper triangle. Defaults to `transparent`
   * (the page's body background shows through) — matches the common
   * case where a page ends in a white/gray body area. Set this to the
   * last section's bg when the page ends in an explicitly-colored
   * region (e.g. `kcvv-black`), so the diagonal's transparent triangle
   * reveals that color instead of white.
   */
  bg?: SectionBg;
  className?: string;
}

const BG_CLASS: Record<SectionBg, string> = {
  white: "bg-white",
  "gray-100": "bg-gray-100",
  "kcvv-black": "bg-kcvv-black",
  "kcvv-green-dark": "bg-kcvv-green-dark",
  transparent: "bg-transparent",
};

/**
 * Reserves a footer-diagonal-sized safe area at the end of a page so the
 * `PageFooter`'s overlap-full diagonal has room to sit without clipping
 * real content. Render this as the last element on pages that do NOT use
 * `SectionStack` (which handles its own last-section padding via the
 * `reserveFooterSafeArea` prop). See #1360.
 */
export function FooterSafeArea({
  bg = "transparent",
  className,
}: FooterSafeAreaProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-[var(--footer-diagonal)] w-full",
        BG_CLASS[bg],
        className,
      )}
    />
  );
}
