import type { PortableTextBlock } from "@portabletext/react";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { NewsCard, type NewsCardBg } from "@/components/article/NewsCard";
import { cn } from "@/lib/utils/cn";

/**
 * <VerderLezenRow> — net-new Phase 5 footer primitive (5.d4 lock).
 *
 * Renders the "Verder lezen." row at the article footer: a 3-up grid of
 * `<NewsCard>` (Phase 4.5 R10 flush-edge) at `--container-page` width,
 * with per-`articleType` card backgrounds (Phase 4.5 R3 lookup) and the
 * sparse-state behaviour from R10 — "cards drop, never pad".
 *
 * Sparse states:
 *   - 0 items → row does not render (returns `null`).
 *   - 1 item   → 1-up at the left of a 3-column grid; cols 2 + 3 stay empty.
 *   - 2 items  → 2-up in cols 1 + 2; col 3 stays empty.
 *   - 3 items  → standard 3-up.
 *
 * Items are passed in pre-sorted; this component does not own ranking,
 * fetching, or capping (call-site is responsible — typically the article
 * page after `mergeRelatedItems`). It simply slices to a max of 3.
 *
 * **Not VR-tagged.** This is a page-composition surface; Playwright e2e
 * (Pages/Article/* templates) owns the smoke test once 5.C wires it into
 * `/nieuws/[slug]`. Component-level VR for the underlying primitives
 * (`<NewsCard>`, `<EditorialHeading>`) already exists.
 */
export interface VerderLezenItem {
  title: string;
  href: string;
  imageUrl?: string;
  imageAlt?: string;
  /** Single category label rendered above the title (article tag). */
  badge?: string;
  /** Display date (e.g. formatted `publishedAt`). */
  date?: string;
  /**
   * `articleType` of the linked article — drives the per-card background
   * lookup (R3): `transfer` → jersey-deep / cream text; everything else
   * → cream / ink text. `null`/`undefined` legacy articles default to
   * cream. Match the strings the article schema validator allows.
   */
  articleType?: "interview" | "announcement" | "transfer" | "event" | null;
}

export interface VerderLezenRowProps {
  items: VerderLezenItem[];
  /**
   * Optional heading override. Defaults to "Verder lezen." with the
   * accent decorator on "Verder". Provide a PT block array to author a
   * different accent split (rare); strings are not supported here
   * because the heading's accent geometry depends on PT marks.
   */
  heading?: PortableTextBlock[];
  className?: string;
}

const DEFAULT_HEADING: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "verder-lezen-heading",
    style: "normal",
    markDefs: [],
    children: [
      { _type: "span", _key: "v1", text: "Verder", marks: ["accent"] },
      { _type: "span", _key: "v2", text: " lezen.", marks: [] },
    ],
  } as PortableTextBlock,
];

// R3 per-articleType card-background lookup. Drives both `<NewsGrid>`
// and `<VerderLezenRow>` so related-articles read with the same chrome
// register as the homepage grid.
function bgForArticleType(type: VerderLezenItem["articleType"]): NewsCardBg {
  if (type === "transfer") return "jersey-deep";
  return "cream";
}

// Slot-deterministic rotation cycle so adjacent cards don't twin. Three
// rotations covers the 3-up case without repeats; the `none` fallback
// hits position 4+ which doesn't exist here, kept for safety only.
const ROTATION_CYCLE = ["a", "b", "c", "none"] as const;

export function VerderLezenRow({
  items,
  heading = DEFAULT_HEADING,
  className,
}: VerderLezenRowProps) {
  // Cap at 3 cards — the grid is 3-up and Phase 4.5 R10 doesn't pad.
  // Anything beyond 3 is dropped; ranking belongs to the call-site
  // (`mergeRelatedItems`). Warn in dev so a caller passing 5 items
  // doesn't wonder why only 3 render.
  if (process.env.NODE_ENV === "development" && items.length > 3) {
    console.warn(
      `[VerderLezenRow] ${items.length} items supplied; capped at 3. Rank + slice at the call site (e.g. mergeRelatedItems) so the drop is intentional.`,
    );
  }
  const cards = items.slice(0, 3);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section
      data-verder-lezen-row="true"
      data-card-count={cards.length}
      aria-label="Verder lezen"
      className={cn("bg-cream w-full px-4 py-16 lg:py-24", className)}
    >
      <div
        className="mx-auto w-full"
        style={{ maxWidth: "var(--container-page)" }}
      >
        <EditorialHeading
          level={2}
          size="display-md"
          tone="ink"
          className="mb-10"
        >
          {heading}
        </EditorialHeading>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((item, i) => (
            <NewsCard
              key={item.href}
              title={item.title}
              href={item.href}
              imageUrl={item.imageUrl}
              imageAlt={item.imageAlt}
              badge={item.badge}
              date={item.date}
              aspectRatio="landscape-16-9"
              rotation={ROTATION_CYCLE[i] ?? "none"}
              bg={bgForArticleType(item.articleType)}
              as="h3"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
