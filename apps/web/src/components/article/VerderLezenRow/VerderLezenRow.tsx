"use client";

import { useEffect, useRef } from "react";
import type { PortableTextBlock } from "@portabletext/react";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { HorizontalSlider } from "@/components/design-system/HorizontalSlider";
import { NewsCard, type NewsCardBg } from "@/components/article/NewsCard";
import { trackEvent } from "@/lib/analytics/track-event";
import { useArticleAnalytics } from "@/hooks/useArticleAnalytics";
import type {
  RelatedContentItem,
  RelatedContentSource,
  RelatedPageType,
} from "@/components/related/types";
import { cn } from "@/lib/utils/cn";

/**
 * <VerderLezenRow> — net-new Phase 5 footer primitive (5.d4 lock, slider
 * variant ratified during #1800 implementation review).
 *
 * Renders the "Verder lezen." row at the article footer as a horizontal
 * scroller (using the canonical `<HorizontalSlider>` primitive) of
 * `<NewsCard>` (Phase 4.5 R10 flush-edge) at `--container-wide` width.
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
 * ## Analytics (event contract lifted at #1832)
 *
 * When `pageType` + `pageSlug` are supplied the row emits the three GA4
 * events the article surface has always shipped, so GTM/GA4 stay
 * untouched:
 *
 *   - `related_content_shown` — once per mount when at least one item
 *     renders. Dedup via `useRef` so React StrictMode's double-effect
 *     doesn't double-fire.
 *   - `related_content_click` — per click, payload-identical to the
 *     legacy emit.
 *   - `related_article_click` — when source page + target are both
 *     articles, fires the typed article→article variant via
 *     `useArticleAnalytics().trackRelatedArticleClick` (hashes the
 *     related id).
 *
 * Storybook stories that don't set `pageType` / `pageSlug` get no
 * analytics emissions — the row stays a pure display primitive in
 * isolation.
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
  /**
   * Analytics payload — optional so demo / Storybook items can skip it.
   * When present, the row emits `related_content_click` / impression
   * events with these fields (the GA4 contract is locked at #1832 to
   * preserve existing report dimensions).
   */
  analyticsId?: string;
  analyticsSource?: RelatedContentSource;
  analyticsType?: RelatedContentItem["type"];
  /**
   * `psdId` for players, `slug` for articles / events / teams / pages.
   * Staff items are dropped by `mapRelatedToVerderLezen` (no /staf/[slug]
   * route exists yet — see #1831), so the staff target-slug case isn't
   * reachable in production today.
   */
  analyticsTargetSlug?: string;
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
  /**
   * Surfacing page context for analytics. When both `pageType` and
   * `pageSlug` are set, the row emits `related_content_shown` on mount
   * and `related_content_click` on each item click. Omit both on
   * Storybook fixtures / demo views to suppress analytics.
   */
  pageType?: RelatedPageType;
  pageSlug?: string;
  /**
   * `articleType` of the source page — only meaningful when `pageType
   * === "article"`. When supplied, article→article clicks additionally
   * emit the typed `related_article_click` event via
   * `useArticleAnalytics().trackRelatedArticleClick`.
   */
  sourceArticleType?: string | null;
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

function deriveImpressionSource(
  items: VerderLezenItem[],
): RelatedContentSource | "mixed" {
  const sources = new Set(
    items
      .map((i) => i.analyticsSource)
      .filter((s): s is RelatedContentSource => s !== undefined),
  );
  if (sources.size === 0) return "mixed";
  if (sources.size === 1) return [...sources][0]!;
  return "mixed";
}

export function VerderLezenRow({
  items,
  heading = DEFAULT_HEADING,
  pageType,
  pageSlug,
  sourceArticleType,
  className,
}: VerderLezenRowProps) {
  const hasFired = useRef(false);
  const { trackRelatedArticleClick } = useArticleAnalytics();

  const analyticsEnabled =
    pageType !== undefined && pageSlug !== undefined && items.length > 0;

  // Impression event — fires once per mount when analytics is enabled
  // and at least one item renders. Single-ref dedup so StrictMode's
  // double-invoke doesn't double-fire (#1832).
  useEffect(() => {
    if (!analyticsEnabled) return;
    if (hasFired.current) return;
    hasFired.current = true;

    const contentTypes = [
      ...new Set(
        items
          .map((i) => i.analyticsType)
          .filter((t): t is RelatedContentItem["type"] => t !== undefined),
      ),
    ].join(",");

    trackEvent("related_content_shown", {
      source: deriveImpressionSource(items),
      count: items.length,
      content_types: contentTypes,
      page_type: pageType,
      page_slug: pageSlug,
    });
  }, [analyticsEnabled, items, pageType, pageSlug]);

  if (items.length === 0) return null;

  const handleItemClick = (
    event: React.MouseEvent<HTMLDivElement>,
    item: VerderLezenItem,
    position: number,
  ) => {
    if (!analyticsEnabled) return;
    // The slot wrapper carries a real layout box (`w-72 shrink-0 pt-4`)
    // so the tape strip clears the slider's clip rect — see
    // VerderLezenRow.tsx top comment. That means clicks on the slot's
    // padding / whitespace also bubble through this handler. Guard so
    // only clicks that resolve to the inner `<a>` count — keeps the
    // `related_content_click` GA4 contract honest (analytics review at
    // #1832).
    if (!(event.target as Element).closest("a")) return;
    if (
      !item.analyticsSource ||
      !item.analyticsType ||
      !item.analyticsTargetSlug
    ) {
      return;
    }
    trackEvent("related_content_click", {
      source: item.analyticsSource,
      target_type: item.analyticsType,
      target_slug: item.analyticsTargetSlug,
      position,
      page_type: pageType,
      page_slug: pageSlug,
    });
    // Article→article variant — fires only when both the source page
    // and the clicked item are articles, mirroring the legacy guard.
    if (
      pageType === "article" &&
      item.analyticsType === "article" &&
      sourceArticleType !== undefined &&
      item.analyticsId !== undefined
    ) {
      trackRelatedArticleClick({
        articleType: sourceArticleType,
        relatedArticleId: item.analyticsId,
        position,
      });
    }
  };

  return (
    <section
      data-verder-lezen-row="true"
      aria-label="Verder lezen"
      className={cn("bg-cream w-full px-4 py-16 lg:py-24", className)}
    >
      <div
        className="mx-auto w-full"
        style={{ maxWidth: "var(--container-wide)" }}
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
              // `pt-4` gives the NewsCard tape strip room inside the
              // slider's clip rect — `<TapeStrip>` sits at `top: 0` with
              // `translateY(-50%)` so half its height extends above the
              // card, which `<HorizontalSlider>`'s `overflow-x: auto`
              // would otherwise clip (browsers force `overflow-y: auto`
              // alongside the explicit `overflow-x: auto`).
              className="w-72 shrink-0 pt-4 md:w-80"
              // Click tracking relies on bubbling from the inner <Link>
              // anchor inside NewsCard. Keyboard Enter on a focused
              // link dispatches a native click so no extra role / tabIndex
              // / onKeyDown is needed on this wrapper.
              onClick={(event) => handleItemClick(event, item, i + 1)}
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
