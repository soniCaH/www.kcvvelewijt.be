import { HorizontalSlider } from "@/components/design-system/HorizontalSlider/HorizontalSlider";
import { RelatedContentCard } from "../RelatedContentCard";
import type { RelatedContentItem } from "../types";

export interface RelatedContentSliderProps {
  /** Mixed array of related content items */
  items: RelatedContentItem[];
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

export const RelatedContentSlider = ({
  items,
  className,
}: RelatedContentSliderProps) => {
  if (items.length === 0) return null;

  const sorted = sortItems(items);

  return (
    <section className={className}>
      <HorizontalSlider title="Gerelateerd">
        {sorted.map((item) => (
          <RelatedContentCard key={item.id} item={item} />
        ))}
      </HorizontalSlider>
    </section>
  );
};
