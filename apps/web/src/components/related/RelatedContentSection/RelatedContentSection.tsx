"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { NewsCard } from "@/components/article/NewsCard/NewsCard";
import { trackEvent } from "@/lib/analytics/track-event";
import {
  MentionedEntitiesStrip,
  type MentionedEntity,
} from "../MentionedEntitiesStrip/MentionedEntitiesStrip";
import type {
  RelatedArticleItem,
  RelatedContentItem,
  RelatedContentSource,
  RelatedPageItem,
  RelatedPageType,
} from "../types";

export interface RelatedContentSectionProps {
  items: RelatedContentItem[];
  pageType: RelatedPageType;
  pageSlug: string;
  className?: string;
}

type ContentItem = RelatedArticleItem | RelatedPageItem;

const CONTENT_TYPES = new Set<RelatedContentItem["type"]>(["article", "page"]);
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
  return item.type === "article" ? `/nieuws/${item.slug}` : `/${item.slug}`;
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
  className,
}: RelatedContentSectionProps) => {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current || items.length === 0) return;
    hasFired.current = true;

    const contentTypes = [...new Set(items.map((i) => i.type))].join(",");

    trackEvent("related_content_shown", {
      source: deriveImpressionSource(items),
      count: items.length,
      content_types: contentTypes,
      page_type: pageType,
      page_slug: pageSlug,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { content, entities } = partitionItems(items);

  if (content.length === 0 && entities.length === 0) return null;

  const lead = content[0];
  const rightStack = content.slice(1, 3);
  const overflow = content.slice(3, 6);

  const handleContentClick = (item: ContentItem, position: number) => {
    trackEvent("related_content_click", {
      source: item.source,
      target_type: item.type,
      target_slug: item.slug,
      position,
      page_type: pageType,
      page_slug: pageSlug,
    });
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
    <div
      key={item.id}
      onClick={() => handleContentClick(item, position)}
      data-related-card={item.type}
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
      />
    </div>
  );

  return (
    <div
      className={cn(
        "max-w-inner-lg mx-auto px-4 lg:px-0 mt-12 mb-10 space-y-10",
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
          <header className="flex items-baseline gap-3 mb-3">
            <h2 className="text-2xl md:text-3xl font-bold text-kcvv-black tracking-tight">
              Gerelateerd
            </h2>
            <span className="text-sm text-kcvv-gray font-medium">
              {content.length}{" "}
              {content.length === 1 ? "onderwerp" : "onderwerpen"}
            </span>
          </header>
          <div
            className="h-[3px] w-12 bg-kcvv-green-bright mb-6"
            aria-hidden="true"
          />

          {lead && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
