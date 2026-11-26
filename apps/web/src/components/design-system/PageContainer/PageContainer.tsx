import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type PageContainerWidth = "default" | "prose" | "index";

const WIDTH_CLASS: Record<PageContainerWidth, string> = {
  // Detail / single-subject pages — the most common body width.
  default: "max-w-[var(--container-wide)]", // 1040px
  // Narrow column — article/CMS reading text AND forms / legal prose.
  prose: "max-w-[var(--container-prose)]", // 680px
  // Card-grid index / listing / landing pages (matches the homepage).
  index: "max-w-[var(--container-index)]", // 1280px
};

export interface PageContainerProps {
  children: ReactNode;
  /**
   * Body width by role:
   * - `prose` (680, `--container-prose`) — long-form reading, forms, legal
   * - `default` (1040, `--container-wide`) — detail / single-subject pages
   * - `index` (1280, `--container-index`) — card-grid index / listing / landing pages
   */
  width?: PageContainerWidth;
  /** Element to render — defaults to `<div>`; pass `"section"` for page sections. */
  as?: ElementType;
  /** Forwarded to the rendered element — e.g. an `id` for in-page nav anchors. */
  id?: string;
  /** Forwarded to the rendered element — `-1` makes an anchor target
   *  focusable so a nav click can move keyboard focus into it (#2478
   *  rule 8); pair with `focus:outline-none` in `className`. */
  tabIndex?: number;
  /** Forwarded as `aria-label` — required alongside `tabIndex={-1}` on an
   *  otherwise-unlabelled focus target (a `<section>` with no heading of
   *  its own to associate via `aria-labelledby`), so a screen reader
   *  announces something on focus instead of nothing. */
  ariaLabel?: string;
  className?: string;
}

/**
 * <PageContainer> — the single centered body container for page content.
 *
 * Horizontal only: `mx-auto w-full px-4 md:px-8` + the chosen max-width.
 * Vertical rhythm (`py-*`, …) stays on the consuming section via
 * `className`. The in-page anchor offset is `scroll-padding-top` on `<html>`
 * (#2478 rule 7, `src/hooks/useSectionNav.ts`) — never a per-section
 * `scroll-mt-*`.
 *
 * Full-bleed elements (`<StripedSeam>`, heroes, `<CtaBand>`, coloured section
 * bands) must NOT be wrapped — they span the viewport as siblings of the container.
 */
export const PageContainer = ({
  children,
  width = "default",
  as: Tag = "div",
  id,
  tabIndex,
  ariaLabel,
  className,
}: PageContainerProps) => {
  return (
    <Tag
      id={id}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      className={cn(
        "mx-auto w-full px-4 md:px-8",
        WIDTH_CLASS[width],
        className,
      )}
    >
      {children}
    </Tag>
  );
};
