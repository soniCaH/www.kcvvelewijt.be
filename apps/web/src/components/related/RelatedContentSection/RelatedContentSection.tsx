"use client";

import { cn } from "@/lib/utils/cn";
import { NewsCard } from "@/components/article/NewsCard/NewsCard";
import {
  MentionedEntitiesStrip,
  type MentionedEntity,
} from "../MentionedEntitiesStrip/MentionedEntitiesStrip";
import type {
  RelatedArticleItem,
  RelatedContentItem,
  RelatedPageItem,
} from "../types";

export interface RelatedContentSectionProps {
  items: RelatedContentItem[];
  className?: string;
}

type ContentItem = RelatedArticleItem | RelatedPageItem;

const CONTENT_TYPES = new Set(["article", "page"]);
const ENTITY_TYPES = new Set(["player", "team", "staff"]);

const SOURCE_PRIORITY: Record<string, number> = {
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

  content.sort(
    (a, b) =>
      (SOURCE_PRIORITY[a.source] ?? 9) - (SOURCE_PRIORITY[b.source] ?? 9),
  );

  return { content, entities };
}

function getHref(item: ContentItem): string {
  return item.type === "article" ? `/nieuws/${item.slug}` : `/${item.slug}`;
}

function formatDate(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function renderCard(
  item: ContentItem,
  variant: "featured" | "standard" | "listing",
  className?: string,
) {
  return (
    <NewsCard
      key={item.id}
      variant={variant}
      className={className}
      title={item.title}
      href={getHref(item)}
      imageUrl={item.imageUrl ?? undefined}
      imageAlt={item.title}
      badge={TYPE_BADGE[item.type]}
      date={item.type === "article" ? formatDate(item.date) : undefined}
    />
  );
}

export const RelatedContentSection = ({
  items,
  className,
}: RelatedContentSectionProps) => {
  const { content, entities } = partitionItems(items);

  if (content.length === 0 && entities.length === 0) return null;

  const lead = content[0];
  const rightStack = content.slice(1, 3);
  const overflow = content.slice(3, 6);

  return (
    <div
      className={cn(
        "max-w-inner-lg mx-auto px-4 lg:px-0 mt-12 mb-10 space-y-10",
        className,
      )}
    >
      {entities.length > 0 && <MentionedEntitiesStrip entities={entities} />}

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
                {renderCard(lead, "featured")}
              </div>
              {rightStack.length > 0 && (
                <div className="flex flex-col gap-4">
                  {rightStack.map((item) =>
                    renderCard(item, "standard", "md:flex-1 md:aspect-auto"),
                  )}
                </div>
              )}
            </section>
          )}

          {overflow.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {overflow.map((item) => renderCard(item, "standard"))}
            </section>
          )}
        </section>
      )}
    </div>
  );
};
