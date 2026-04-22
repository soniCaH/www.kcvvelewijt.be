"use client";

/**
 * CategorySection — section header + grid of QuestionCards for a single category
 *
 * Renders nothing when the category has no paths (callers don't need to
 * pre-filter empty categories).
 */

import type { ResponsibilityPath } from "@/types/responsibility";
import { CATEGORY_META, type CategoryKey } from "./categoryMeta";
import { QuestionCard } from "./QuestionCard";

export interface CategorySectionProps {
  category: CategoryKey;
  paths: ReadonlyArray<ResponsibilityPath>;
  onPathClick: (id: string) => void;
}

export function CategorySection({
  category,
  paths,
  onPathClick,
}: CategorySectionProps) {
  if (paths.length === 0) return null;

  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  return (
    <section>
      <div className="border-kcvv-green-bright mb-6 flex items-center gap-3 border-l-4 pl-4">
        <Icon className={`h-7 w-7 shrink-0 ${meta.color}`} />
        {/* `!` modifiers force the size + font over the global h1-h6 cascade
            in globals.css (which sets h3 to 24px / font-title /
            kcvv-gray-blue by default). Same pattern as SectionHeader. */}
        <h3 className="font-body! text-kcvv-black! mb-0! text-xl! leading-none! font-black! tracking-tight! uppercase">
          {meta.label}
        </h3>
        <span className="text-kcvv-gray text-sm font-normal">
          ({paths.length})
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {paths.map((path) => (
          <QuestionCard key={path.id} path={path} onClick={onPathClick} />
        ))}
      </div>
    </section>
  );
}
