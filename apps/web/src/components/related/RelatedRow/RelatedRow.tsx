"use client";

import { useEffect, useRef } from "react";
import type { PortableTextBlock } from "@portabletext/react";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { HorizontalSlider } from "@/components/design-system/HorizontalSlider";
import { NewsCard, type NewsCardBg } from "@/components/article/NewsCard";
import { articleTypeCardLabel } from "@/lib/utils/article-type-label";
import { getCardSubjectArtefact } from "@/lib/utils/card-subject-artefact";
import { trackEvent } from "@/lib/analytics/track-event";
import { useArticleAnalytics } from "@/hooks/useArticleAnalytics";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";
import type {
  RelatedContentItem,
  RelatedContentSource,
  RelatedPageType,
  RelatedRowItem,
} from "@/components/related/types";
import { cn } from "@/lib/utils/cn";

/**
 * <RelatedRow> — the one onward-navigation slot every detail page ends on
 * (#2443 decision, #2581). Renamed + moved from `<VerderLezenRow>`
 * (`components/article/VerderLezenRow`, Phase 5.d4) — the slider mechanics,
 * per-`articleType` card backgrounds, and GA4 contract (#1832) all carry over
 * byte-identical; what changes is scope: one merged, ordered, capped,
 * cross-type list (`mergeRelatedRow`, `../mergeRelatedRow`) instead of a
 * single article-relations feed, replacing four other onward-affordance
 * components (`AndereEvents`, `GallerySection`, `MatchArticleLinkCard`, the
 * `/nieuws/[slug]` match-CTA band — all deleted) plus the article page's own
 * narrower slider across 7 routes total.
 *
 * "Blijf nog even hangen." replaces "Verder lezen." as the default heading
 * (#2443 rule 5) — "read on" is false for a photo set, a fixture, or a
 * profile card (three of the seven target types this row now carries), so
 * the heading claims nothing about topic or medium.
 *
 * A destination with no `RelatedContentItem` union member of its own (a PSD
 * match — see that union's docblock) is built directly as a `RelatedRowItem`
 * by the page and merged in as a domain-tier item like any other; this
 * component only ever renders the flat card shape, never the union.
 *
 * ## Cardinality is not a treatment (#2443 rule 3)
 *
 * Every item renders through the same `<NewsCard>` in the same slider
 * regardless of how many items there are — a one-item row is a one-card row,
 * not a hero-style full-bleed card or a centred button. `imageUrl` absent →
 * the item's own `artefact` (a `CardArtefactSubject`, #2574) resolves via
 * `getCardSubjectArtefact`, falling through to `<NewsCard>`'s default hatch
 * when neither is set (a bare Sanity "page" document has no subject artefact
 * of its own).
 *
 * ## Auto-hide at zero (#2443 rule 7 / #2427 Tier 2 exception)
 *
 * `items.length === 0` → renders `null`. This is the documented exception to
 * Tier 2's dashed reserved-slot box (`<EmptyState tier="slot">`,
 * `components/design-system/EmptyState`): Tier 2 exists so a slot the page
 * *promised* doesn't visibly collapse when its content is temporarily empty.
 * This row promises nothing — after cross-type merging across five tiers,
 * genuinely zero related items is rare, and when it happens the page simply
 * ends after its last real section rather than holding an empty box open for
 * a slot nobody was told to expect.
 *
 * ## Click tracking — one delegated listener, not a handler per card
 *
 * A single native `click` listener on the row's own container (via
 * `useDelegatedClick`, mirroring `<ErrorAnalytics>`) resolves clicks that
 * land on a card's link, then reads the analytics payload off the matched
 * slot's inert `data-related-row-*` attributes — never a per-card `onClick`
 * closure.
 *
 * ## Analytics (event contract lifted at #1832, kept exactly)
 *
 * When `pageType` + `pageSlug` are supplied the row emits the three GA4
 * events the article surface has always shipped:
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
 * **Not VR-tagged.** Page-composition surface; Playwright e2e owns the
 * per-route smoke. Component-level VR for the underlying primitives
 * (`<NewsCard>`, `<EditorialHeading>`, `<HorizontalSlider>`) already exists.
 */
export interface RelatedRowProps {
  items: RelatedRowItem[];
  /**
   * Optional heading override. Defaults to "Blijf nog even hangen." with the
   * accent decorator on "hangen." Provide a PT block array to author a
   * different accent split (rare); strings are not supported here because
   * the heading's accent geometry depends on PT marks.
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
    _key: "related-row-heading",
    style: "normal",
    markDefs: [],
    children: [
      { _type: "span", _key: "r1", text: "Blijf nog even ", marks: [] },
      { _type: "span", _key: "r2", text: "hangen.", marks: ["accent"] },
    ],
  } as PortableTextBlock,
];

// R3 per-articleType card-background lookup. Drives both `<NewsGrid>`
// and `<RelatedRow>` so related-articles read with the same chrome
// register as the homepage grid.
function bgForArticleType(type: RelatedRowItem["articleType"]): NewsCardBg {
  if (type === "transfer") return "jersey-deep";
  return "cream";
}

// Slot-deterministic rotation cycle so adjacent cards don't twin. The
// cycle wraps for >4 items — by the time the 5th card paints, the first
// is well off-screen so a repeat reads as fresh tilt rather than a twin.
const ROTATION_CYCLE = ["a", "b", "c", "none"] as const;

function deriveImpressionSource(
  items: RelatedRowItem[],
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

const CARD_SELECTOR = '[data-slot="related-row-card"]';

export function RelatedRow({
  items,
  heading = DEFAULT_HEADING,
  pageType,
  pageSlug,
  sourceArticleType,
  className,
}: RelatedRowProps) {
  const rowRef = useRef<HTMLElement>(null);
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

  // One delegated listener on the row itself, reading the matched card
  // slot's inert data-* attributes — no per-card onClick closure. Selector
  // is a bare "a": scoped to this row's own container already, so no need
  // for a compound descendant selector — `link.closest(CARD_SELECTOR)`
  // below does the ancestor lookup instead.
  useDelegatedClick(rowRef, {
    selector: "a",
    onMatch: (link) => {
      if (!analyticsEnabled) return;
      const slot = link.closest<HTMLElement>(CARD_SELECTOR);
      if (!slot) return;

      const {
        relatedRowSource: source,
        relatedRowType: type,
        relatedRowTargetSlug: targetSlug,
        relatedRowId: id,
        relatedRowPosition: position,
      } = slot.dataset;
      if (!source || !type || !targetSlug || position === undefined) return;

      const positionNumber = Number(position);

      trackEvent("related_content_click", {
        source,
        target_type: type,
        target_slug: targetSlug,
        position: positionNumber,
        page_type: pageType,
        page_slug: pageSlug,
      });

      if (
        pageType === "article" &&
        type === "article" &&
        sourceArticleType !== undefined &&
        id !== undefined
      ) {
        trackRelatedArticleClick({
          articleType: sourceArticleType,
          relatedArticleId: id,
          position: positionNumber,
        });
      }
    },
  });

  if (items.length === 0) return null;

  return (
    <section
      ref={rowRef}
      data-related-row="true"
      aria-label="Blijf nog even hangen"
      // ART-1 (#2237): asymmetric padding — a tighter top closes the
      // oversized gap after a preceding section while the generous bottom
      // keeps the row off the footer.
      className={cn(
        "bg-cream w-full px-4 pt-8 pb-16 lg:pt-10 lg:pb-24",
        className,
      )}
    >
      <div
        className="mx-auto w-full"
        style={{ maxWidth: "var(--container-wide)" }}
      >
        <EditorialHeading
          level={2}
          size="display-md"
          tone="ink"
          // eslint-disable-next-line no-restricted-syntax -- #2552 rule 4: read-next row, owned by the article reading-column map (#2519), not this ticket's adoption list
          className="mb-10"
        >
          {heading}
        </EditorialHeading>
        {/* ART-2 (#2237): a roomier gap than the cards need cramped in —
            `gap-6 md:gap-8` is now `<HorizontalSlider>`'s own default
            (#2444 resolution), so no override is needed here any more. */}
        <HorizontalSlider>
          {items.map((item, i) => {
            const position = i + 1;
            return (
              <div
                key={item.href}
                data-slot="related-row-card"
                data-related-row-source={item.analyticsSource}
                data-related-row-type={item.analyticsType}
                data-related-row-target-slug={item.analyticsTargetSlug}
                data-related-row-id={item.analyticsId}
                data-related-row-position={position}
                // `pt-4` gives the NewsCard tape strip room inside the
                // slider's clip rect — `<TapeStrip>` sits at `top: 0` with
                // `translateY(-50%)` so half its height extends above the
                // card, which `<HorizontalSlider>`'s `overflow-x: auto`
                // would otherwise clip (browsers force `overflow-y: auto`
                // alongside the explicit `overflow-x: auto`).
                className="w-72 shrink-0 pt-4 md:w-80"
              >
                <NewsCard
                  title={item.title}
                  href={item.href}
                  imageUrl={item.imageUrl}
                  artefact={
                    !item.imageUrl && item.artefact
                      ? getCardSubjectArtefact(item.artefact)
                      : undefined
                  }
                  badge={item.badge}
                  // The third surface applying the transfer-green rule, so the
                  // third that has to say the word (#2404).
                  typeLabel={articleTypeCardLabel(item.articleType)}
                  date={item.date}
                  aspectRatio="landscape-16-9"
                  rotation={ROTATION_CYCLE[i % ROTATION_CYCLE.length] ?? "none"}
                  bg={bgForArticleType(item.articleType)}
                  as="h3"
                />
              </div>
            );
          })}
        </HorizontalSlider>
      </div>
    </section>
  );
}
