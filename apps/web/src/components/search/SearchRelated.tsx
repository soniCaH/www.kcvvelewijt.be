/**
 * SearchRelated — the `/zoeken` low-confidence semantic fallback (8s5 / ZOEK-3).
 *
 * Rendered BELOW the lexical results when the top semantic score lands in the
 * 0.35–0.5 band (too weak for an LLM answer). A plain "Gerelateerd" list of
 * related links — deliberately NOT branded as an AI answer (that mark is
 * reserved for the high-confidence `<SearchAnswerCard>`). Links are real and
 * keyboard-focusable with a visible focus ring.
 */

import Link from "next/link";
import { List } from "@/lib/icons.redesign";
import type { SemanticRelatedItem } from "./useSemanticAugment";

const TYPE_LABEL: Record<SemanticRelatedItem["type"], string> = {
  article: "Nieuws",
  page: "Pagina",
  responsibility: "Hulp",
};

export interface SearchRelatedProps {
  items: SemanticRelatedItem[];
}

export function SearchRelated({ items }: SearchRelatedProps) {
  return (
    <section className="border-paper-edge bg-cream-soft border">
      <h2 className="text-ink-muted border-paper-edge flex items-center gap-1.5 border-b px-3 py-2 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase">
        <List size={12} aria-hidden />
        Gerelateerd
      </h2>
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="border-paper-edge text-ink hover:bg-cream focus-visible:outline-jersey-deep block border-b px-3 py-2.5 outline-none last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2"
            >
              <span className="text-jersey-deep font-mono text-[9px] tracking-[0.06em] uppercase">
                {TYPE_LABEL[item.type]}
              </span>
              <span className="mt-0.5 block text-[13px] font-semibold">
                {item.title}
              </span>
              {item.excerpt && (
                <span className="text-ink-muted mt-0.5 line-clamp-1 block text-[11.5px]">
                  {item.excerpt}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
