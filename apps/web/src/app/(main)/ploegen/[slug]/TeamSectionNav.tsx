import { cn } from "@/lib/utils/cn";

export interface TeamSectionNavItem {
  /** Anchor target id (matches the section's `id`). */
  id: string;
  /** Display label. */
  label: string;
}

export interface TeamSectionNavProps {
  /** Only the sections that actually render — auto-hide aware. */
  items: readonly TeamSectionNavItem[];
}

/**
 * Sticky in-page section navigation for the team detail page. Native anchor
 * links (no JS) — `scroll-margin-top` on the section targets keeps headings
 * clear of the sticky bar. Renders nothing when one or fewer sections exist.
 */
export function TeamSectionNav({ items }: TeamSectionNavProps) {
  if (items.length <= 1) return null;

  return (
    <nav
      data-testid="team-section-nav"
      aria-label="Sectienavigatie"
      className={cn(
        "border-ink bg-cream sticky top-0 z-20 border-y-2",
        "overflow-x-auto",
      )}
    >
      <ul className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-ink hover:bg-jersey-deep hover:text-cream inline-block px-3 py-1 font-mono text-[11px] tracking-[0.1em] whitespace-nowrap uppercase transition-colors"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
