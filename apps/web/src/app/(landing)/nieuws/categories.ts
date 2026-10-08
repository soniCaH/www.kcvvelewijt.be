import type { TagCount } from "@/lib/repositories/article.repository";

/** A tag needs this many published articles to get a filter chip (#3432). */
export const MIN_ARTICLES_PER_CHIP = 3;

/**
 * The /nieuws filter chips: most articles first, ties alphabetical, tags
 * below `MIN_ARTICLES_PER_CHIP` left out. A left-out tag still filters
 * through `?categorie=` — the page passes every tag to the client for that.
 */
export function toCategoryChips(tags: TagCount[]) {
  return tags
    .filter((t) => t.count >= MIN_ARTICLES_PER_CHIP)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .map(({ name }) => ({ id: name, attributes: { name, slug: name } }));
}
