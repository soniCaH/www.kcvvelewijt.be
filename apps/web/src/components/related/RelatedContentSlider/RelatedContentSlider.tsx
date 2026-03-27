"use client";

import { useEffect, useRef } from "react";
import { HorizontalSlider } from "@/components/design-system/HorizontalSlider/HorizontalSlider";
import { trackEvent } from "@/lib/analytics/track-event";
import { RelatedContentCard } from "../RelatedContentCard";
import type {
  RelatedContentItem,
  RelatedContentSource,
  RelatedPageType,
} from "../types";

export interface RelatedContentSliderProps {
  /** Mixed array of related content items */
  items: RelatedContentItem[];
  /** Type of the page displaying the slider */
  pageType: RelatedPageType;
  /** Slug of the page displaying the slider */
  pageSlug: string;
  /** Additional CSS classes */
  className?: string;
}

const TYPE_ORDER: Record<RelatedContentItem["type"], number> = {
  article: 0,
  page: 1,
  player: 2,
  staff: 3,
  team: 4,
};

function sortItems(items: RelatedContentItem[]): RelatedContentItem[] {
  return [...items].sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
}

function deriveImpressionSource(
  items: RelatedContentItem[],
): RelatedContentSource | "mixed" {
  const sources = new Set(items.map((item) => item.source));
  if (sources.size === 1) return [...sources][0] as RelatedContentSource;
  return "mixed";
}

export const RelatedContentSlider = ({
  items,
  pageType,
  pageSlug,
  className,
}: RelatedContentSliderProps) => {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current || items.length === 0) return;
    hasFired.current = true;

    const contentTypes = [...new Set(items.map((item) => item.type))].join(",");

    trackEvent("related_content_shown", {
      source: deriveImpressionSource(items),
      count: items.length,
      content_types: contentTypes,
      page_type: pageType,
      page_slug: pageSlug,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) return null;

  const sorted = sortItems(items);

  return (
    <section className={className}>
      <HorizontalSlider title="Gerelateerd">
        {sorted.map((item, index) => (
          <RelatedContentCard
            key={item.id}
            item={item}
            position={index + 1}
            pageType={pageType}
            pageSlug={pageSlug}
          />
        ))}
      </HorizontalSlider>
    </section>
  );
};
