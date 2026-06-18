import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type PageContainerWidth = "default" | "prose" | "index";

const WIDTH_CLASS: Record<PageContainerWidth, string> = {
  // Detail / single-subject pages — the most common body width.
  default: "max-w-[var(--container-wide)]", // 1040px
  // Narrow column — article/CMS reading text AND forms / legal prose.
  prose: "max-w-[var(--container-prose)]", // 680px
  // Card-grid index / listing / landing pages (matches the homepage).
  index: "max-w-7xl", // 1280px
};

export interface PageContainerProps {
  children: ReactNode;
  /**
   * Body width by role:
   * - `prose` (680, `--container-prose`) — long-form reading, forms, legal
   * - `default` (1040, `--container-wide`) — detail / single-subject pages
   * - `index` (1280, `max-w-7xl`) — card-grid index / listing / landing pages
   */
  width?: PageContainerWidth;
  /** Element to render — defaults to `<div>`; pass `"section"` for page sections. */
  as?: ElementType;
  /** Forwarded to the rendered element — e.g. an `id` for in-page nav anchors. */
  id?: string;
  className?: string;
}

/**
 * <PageContainer> — the single centered body container for page content.
 *
 * Horizontal only: `mx-auto w-full px-4 md:px-8` + the chosen max-width. Vertical
 * rhythm (`py-*`, `scroll-mt-*`, …) stays on the consuming section via `className`.
 *
 * Full-bleed elements (`<StripedSeam>`, heroes, `<CtaBand>`, coloured section
 * bands) must NOT be wrapped — they span the viewport as siblings of the container.
 */
export function PageContainer({
  children,
  width = "default",
  as: Tag = "div",
  id,
  className,
}: PageContainerProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "mx-auto w-full px-4 md:px-8",
        WIDTH_CLASS[width],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
