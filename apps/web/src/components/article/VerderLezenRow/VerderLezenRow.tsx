import type { PortableTextBlock } from "@portabletext/react";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { HorizontalSlider } from "@/components/design-system/HorizontalSlider";
import { NewsCard, type NewsCardBg } from "@/components/article/NewsCard";
import { cn } from "@/lib/utils/cn";

/**
 * <VerderLezenRow> — net-new Phase 5 footer primitive (5.d4 lock, slider
 * variant ratified during #1800 implementation review).
 *
 * Renders the "Verder lezen." row at the article footer as a horizontal
 * scroller (using the canonical `<HorizontalSlider>` primitive) of
 * `<NewsCard>` (Phase 4.5 R10 flush-edge) at `--container-page` width.
 * At desktop the first ~3 cards sit in-frame; the rest reveal via
 * paper-chrome scroll arrows + drag. At narrow viewports 1–1.5 cards
 * show at a time. Per-`articleType` card backgrounds (Phase 4.5 R3
 * lookup) tint each card.
 *
 * The slider replaces the locked 3-up grid because relations include
 * not just articles but also mentioned players / teams / staff / events,
 * which often produce > 3 items — capping discarded discoverability.
 *
 * Sparse states:
 *   - 0 items → row does not render (returns `null`).
 *   - 1–N items → slider track; cards beyond the visible viewport are
 *     reachable via the slider arrows or horizontal scroll.
 *
 * Items are passed in pre-sorted; this component does not own ranking
 * or fetching (call-site is responsible — typically the article page
 * after `mergeRelatedItems`).
 *
 * **Not VR-tagged.** This is a page-composition surface; Playwright e2e
 * (Pages/Article/* templates) owns the smoke test once 5.C wires it into
 * `/nieuws/[slug]`. Component-level VR for the underlying primitives
 * (`<NewsCard>`, `<EditorialHeading>`, `<HorizontalSlider>`) already
 * exists.
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

// Slot-deterministic rotation cycle so adjacent cards don't twin. The
// cycle wraps for >4 items — by the time the 5th card paints, the first
// is well off-screen so a repeat reads as fresh tilt rather than a twin.
const ROTATION_CYCLE = ["a", "b", "c", "none"] as const;

export function VerderLezenRow({
  items,
  heading = DEFAULT_HEADING,
  className,
}: VerderLezenRowProps) {
  if (items.length === 0) return null;

  return (
    <section
      data-verder-lezen-row="true"
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
        <HorizontalSlider>
          {items.map((item, i) => (
            <div
              key={item.href}
              data-slot="verder-lezen-card"
              className="w-[280px] shrink-0 md:w-[320px] lg:w-[340px]"
            >
              <NewsCard
                title={item.title}
                href={item.href}
                imageUrl={item.imageUrl}
                imageAlt={item.imageAlt}
                badge={item.badge}
                date={item.date}
                aspectRatio="landscape-16-9"
                rotation={ROTATION_CYCLE[i % ROTATION_CYCLE.length] ?? "none"}
                bg={bgForArticleType(item.articleType)}
                as="h3"
              />
            </div>
          ))}
        </HorizontalSlider>
      </div>
    </section>
  );
}
