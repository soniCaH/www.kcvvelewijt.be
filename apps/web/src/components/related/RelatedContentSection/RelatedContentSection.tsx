"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { NewsCard } from "@/components/article/NewsCard/NewsCard";
import { trackEvent } from "@/lib/analytics/track-event";
import { useArticleAnalytics } from "@/hooks/useArticleAnalytics";
import {
  MentionedEntitiesStrip,
  type MentionedEntity,
} from "../MentionedEntitiesStrip/MentionedEntitiesStrip";
import type {
  RelatedArticleItem,
  RelatedContentItem,
  RelatedContentSource,
  RelatedEventItem,
  RelatedPageItem,
  RelatedPageType,
} from "../types";

export interface RelatedContentSectionProps {
  items: RelatedContentItem[];
  pageType: RelatedPageType;
  pageSlug: string;
  /**
   * `articleType` of the source article. Only set when the source page is
   * an article detail — used to emit the design §11 `related_article_click`
   * event alongside the existing generic `related_content_click`. The two
   * events coexist: `related_content_click` stays page-agnostic for BI
   * continuity across the /spelers, /staf, /ploegen pages that also use
   * this component, while `related_article_click` is scoped to article →
   * article navigation per the design.
   */
  sourceArticleType?: string | null;
  className?: string;
}

type ContentItem = RelatedArticleItem | RelatedPageItem | RelatedEventItem;

const CONTENT_TYPES = new Set<RelatedContentItem["type"]>([
  "article",
  "page",
  "event",
]);
const ENTITY_TYPES = new Set<RelatedContentItem["type"]>([
  "player",
  "team",
  "staff",
]);

const SOURCE_PRIORITY: Record<RelatedContentSource, number> = {
  editorial: 0,
  reference: 1,
  ai: 2,
};

const TYPE_BADGE: Record<ContentItem["type"], string> = {
  article: "Artikel",
  page: "Pagina",
  event: "Evenement",
};

function partitionItems(items: RelatedContentItem[]): {
  content: ContentItem[];
  entities: MentionedEntity[];
} {
  const content: ContentItem[] = [];
  const entities: MentionedEntity[] = [];

  for (const item of items) {
    if (CONTENT_TYPES.has(item.type)) {
      content.push(item as ContentItem);
    } else if (ENTITY_TYPES.has(item.type)) {
      entities.push(item as MentionedEntity);
    }
  }

  content.sort((a, b) => SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source]);

  return { content, entities };
}

function deriveImpressionSource(
  items: RelatedContentItem[],
): RelatedContentSource | "mixed" {
  const sources = new Set(items.map((i) => i.source));
  if (sources.size === 1) return [...sources][0] as RelatedContentSource;
  return "mixed";
}

function getHref(item: ContentItem): string {
  switch (item.type) {
    case "article":
      return `/nieuws/${item.slug}`;
    case "event":
      return `/events/${item.slug}`;
    case "page":
      return `/club/${item.slug}`;
  }
}

function getEntityTargetSlug(entity: MentionedEntity): string {
  switch (entity.type) {
    case "player":
      return entity.psdId;
    case "team":
      return entity.slug;
    case "staff":
      return entity.id;
  }
}

function formatDate(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const RelatedContentSection = ({
  items,
  pageType,
  pageSlug,
  sourceArticleType,
  className,
}: RelatedContentSectionProps) => {
  const hasFired = useRef(false);
  const { trackRelatedArticleClick } = useArticleAnalytics();

  const { content, entities } = partitionItems(items);
  const displayedContent = content.slice(0, 6);

  useEffect(() => {
    if (hasFired.current) return;

    // Impression metrics track what the user actually sees, not the raw
    // input: content is capped at 6 slots (lead + right-stack + overflow),
    // entities always render in full via the strip.
    const { content: c, entities: e } = partitionItems(items);
    const displayed = [...c.slice(0, 6), ...e];
    if (displayed.length === 0) return;
    hasFired.current = true;

    const contentTypes = [...new Set(displayed.map((i) => i.type))].join(",");

    trackEvent("related_content_shown", {
      source: deriveImpressionSource(displayed),
      count: displayed.length,
      content_types: contentTypes,
      page_type: pageType,
      page_slug: pageSlug,
    });
  }, [items, pageType, pageSlug]);

  if (content.length === 0 && entities.length === 0) return null;

  const lead = displayedContent[0];
  const rightStack = displayedContent.slice(1, 3);
  const overflow = displayedContent.slice(3, 6);

  const handleContentClick = (item: ContentItem, position: number) => {
    trackEvent("related_content_click", {
      source: item.source,
      target_type: item.type,
      target_slug: item.slug,
      position,
      page_type: pageType,
      page_slug: pageSlug,
    });
    // Design §11: the typed article→article variant carries the source
    // article type + hashed related id. Fires only when both source page
    // and target are articles.
    if (
      pageType === "article" &&
      item.type === "article" &&
      sourceArticleType !== undefined
    ) {
      trackRelatedArticleClick({
        articleType: sourceArticleType,
        relatedArticleId: item.id,
        position,
      });
    }
  };

  const handleEntityClick = (entity: MentionedEntity, position: number) => {
    trackEvent("related_content_click", {
      source: entity.source,
      target_type: entity.type,
      target_slug: getEntityTargetSlug(entity),
      position,
      page_type: pageType,
      page_slug: pageSlug,
    });
  };

  const renderCard = (
    item: ContentItem,
    variant: "featured" | "standard" | "listing",
    position: number,
    className?: string,
  ) => (
    // Click tracking relies on bubbling from the inner <Link> anchor inside
    // NewsCard. Keyboard Enter on a focused link dispatches a native click, so
    // no extra role / tabIndex / onKeyDown is needed on this wrapper.
    <div
      key={item.id}
      onClick={() => handleContentClick(item, position)}
      className="contents"
    >
      <NewsCard
        variant={variant}
        className={className}
        title={item.title}
        href={getHref(item)}
        imageUrl={item.imageUrl ?? undefined}
        imageAlt={item.title}
        badge={TYPE_BADGE[item.type]}
        date={item.type === "article" ? formatDate(item.date) : undefined}
        eventDate={
          item.type === "event" ? formatDate(item.dateStart) : undefined
        }
      />
    </div>
  );

  return (
    <div
      className={cn(
        "max-w-inner-lg mx-auto mt-12 mb-10 space-y-10 px-4 lg:px-0",
        className,
      )}
    >
      {entities.length > 0 && (
        <MentionedEntitiesStrip
          entities={entities}
          onEntityClick={handleEntityClick}
        />
      )}

      {content.length > 0 && (
        <section>
          <header className="mb-3">
            <h2 className="text-kcvv-black text-2xl font-bold tracking-tight md:text-3xl">
              Gerelateerd
            </h2>
          </header>
          <div
            className="bg-kcvv-green-bright mb-6 h-[3px] w-12"
            aria-hidden="true"
          />

          {lead && (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                {renderCard(lead, "featured", 1)}
              </div>
              {rightStack.length > 0 && (
                <div className="flex flex-col gap-4">
                  {rightStack.map((item, idx) =>
                    renderCard(
                      item,
                      "standard",
                      idx + 2,
                      "md:flex-1 md:aspect-auto",
                    ),
                  )}
                </div>
              )}
            </section>
          )}

          {overflow.length > 0 && (
            <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {overflow.map((item, idx) =>
                renderCard(item, "standard", idx + 4),
              )}
            </section>
          )}
        </section>
      )}
    </div>
  );
};
