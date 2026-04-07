"use client";

/**
 * QuestionCard — clickable card for a single ResponsibilityPath question
 *
 * Renders the category icon (with accent color), the question, and a
 * one-line summary. Used both inside `CategorySection` (browse view) and
 * `SearchResults` (filtered list).
 */

import { ChevronRight } from "@/lib/icons";
import type { ResponsibilityPath } from "@/types/responsibility";
import { CATEGORY_META } from "./categoryMeta";

export interface QuestionCardProps {
  path: ResponsibilityPath;
  onClick: (id: string) => void;
}

export function QuestionCard({ path, onClick }: QuestionCardProps) {
  const meta = CATEGORY_META[path.category];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(path.id)}
      className="group flex w-full items-start gap-4 rounded-sm border border-gray-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-kcvv-green-bright hover:shadow-card-hover"
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-gray-50 ${meta.color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-title text-base font-bold leading-tight text-kcvv-black">
          {path.question}
        </h4>
        <p className="mt-1 text-sm leading-snug text-kcvv-gray">
          {path.summary}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 flex-shrink-0 self-center text-kcvv-gray transition-transform group-hover:translate-x-1 group-hover:text-kcvv-green-bright" />
    </button>
  );
}
