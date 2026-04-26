import type {
  RelatedArticleItem,
  RelatedPageItem,
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
  RelatedEventItem,
  RelatedContentItem,
} from "@/components/related/types";
import type {
  RelatedArticleRef,
  ArticleDetailVM,
} from "@/lib/repositories/article.repository";
import type { RelatedItem } from "@kcvv/api-contract";

function deduplicateById<T extends { _id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item._id)) return false;
    seen.add(item._id);
    return true;
  });
}

export function mapEditorialArticles(
  articles?: RelatedArticleRef[],
): RelatedArticleItem[] {
  if (!articles?.length) return [];
  return articles.map((a) => ({
    type: "article" as const,
    source: "editorial" as const,
    id: a.id,
    title: a.title,
    slug: a.slug,
    imageUrl: a.coverImageUrl,
    date: a.publishedAt,
    excerpt: null,
  }));
}

export function mapBffRelatedItems(
  items: readonly RelatedItem[],
): RelatedContentItem[] {
  return items.map((item) => {
    if (item.type === "page") {
      return {
        type: "page" as const,
        source: "ai" as const,
        id: item.id,
        title: item.title,
        slug: item.slug,
        imageUrl: null,
        excerpt: item.excerpt,
      } satisfies RelatedPageItem;
    }
    return {
      type: "article" as const,
      source: "ai" as const,
      id: item.id,
      title: item.title,
      slug: item.slug,
      imageUrl: item.imageUrl ?? null,
      date: null,
      excerpt: item.excerpt,
    } satisfies RelatedArticleItem;
  });
}

type MentionedPlayer = NonNullable<
  NonNullable<ArticleDetailVM["mentionedPlayers"]>[number]
>;
type MentionedTeam = NonNullable<
  NonNullable<ArticleDetailVM["mentionedTeams"]>[number]
>;
type MentionedStaff = NonNullable<
  NonNullable<ArticleDetailVM["mentionedStaffMembers"]>[number]
>;

export function mapMentionedPlayers(
  players?: ArticleDetailVM["mentionedPlayers"],
): RelatedPlayerItem[] {
  const valid = (players ?? []).filter((p): p is MentionedPlayer => p != null);
  return deduplicateById(valid)
    .filter((p) => p.psdId != null)
    .map((p) => ({
      type: "player" as const,
      source: "reference" as const,
      id: p._id,
      firstName: p.firstName,
      lastName: p.lastName,
      position: p.position,
      imageUrl: p.imageUrl,
      psdId: p.psdId!,
    }));
}

export function mapMentionedTeams(
  teams?: ArticleDetailVM["mentionedTeams"],
): RelatedTeamItem[] {
  const valid = (teams ?? []).filter((t): t is MentionedTeam => t != null);
  return deduplicateById(valid)
    .filter((t) => t.name != null && t.slug != null)
    .map((t) => ({
      type: "team" as const,
      source: "reference" as const,
      id: t._id,
      name: t.name!,
      slug: t.slug!,
      imageUrl: t.imageUrl,
      tagline: t.tagline,
    }));
}

export function mapMentionedStaff(
  staff?: ArticleDetailVM["mentionedStaffMembers"],
): RelatedStaffItem[] {
  const valid = (staff ?? []).filter((s): s is MentionedStaff => s != null);
  return deduplicateById(valid).map((s) => ({
    type: "staff" as const,
    source: "reference" as const,
    id: s._id,
    firstName: s.firstName,
    lastName: s.lastName,
    role: s.role,
    imageUrl: s.imageUrl,
  }));
}

type CuratedRelatedEntry = NonNullable<
  ArticleDetailVM["relatedContent"]
>[number];

export function mapCuratedRelatedContent(
  items?: ArticleDetailVM["relatedContent"] | null,
): RelatedContentItem[] {
  if (!items?.length) return [];
  const seen = new Set<string>();
  const mapped: RelatedContentItem[] = [];
  for (const item of items) {
    if (seen.has(item._id)) continue;
    seen.add(item._id);
    const result = mapCuratedEntry(item);
    if (result) mapped.push(result);
  }
  return mapped;
}

function mapCuratedEntry(
  entry: CuratedRelatedEntry,
): RelatedContentItem | null {
  switch (entry._type) {
    case "article":
      return {
        type: "article",
        source: "editorial",
        id: entry._id,
        title: entry.title,
        slug: entry.slug,
        imageUrl: entry.coverImageUrl,
        date: entry.publishedAt,
        excerpt: null,
      } satisfies RelatedArticleItem;
    case "player":
      // Player without psdId has no link target — skip.
      if (entry.psdId == null) return null;
      return {
        type: "player",
        source: "editorial",
        id: entry._id,
        firstName: entry.firstName,
        lastName: entry.lastName,
        position: entry.position,
        imageUrl: entry.imageUrl,
        psdId: entry.psdId,
      } satisfies RelatedPlayerItem;
    case "team":
      // Team without name or slug has no card label or route — skip.
      if (entry.name == null || entry.slug == null) return null;
      return {
        type: "team",
        source: "editorial",
        id: entry._id,
        name: entry.name,
        slug: entry.slug,
        imageUrl: entry.imageUrl,
        tagline: entry.tagline,
      } satisfies RelatedTeamItem;
    case "staffMember":
      // No null-guard on firstName/lastName: RelatedStaffItem accepts nulls
      // and the card component falls back to a placeholder. Mirrors
      // mapMentionedStaff above — keep the two paths in lockstep.
      return {
        type: "staff",
        source: "editorial",
        id: entry._id,
        firstName: entry.firstName,
        lastName: entry.lastName,
        role: entry.role,
        imageUrl: entry.imageUrl,
      } satisfies RelatedStaffItem;
    case "event":
      // Event without dateStart has no meaningful card body — skip rather
      // than rendering "Invalid Date". Slug + title are coalesced to "" in
      // GROQ; an empty slug also has no link target, so guard on both.
      if (
        entry.slug == null ||
        entry.slug === "" ||
        entry.dateStart == null ||
        entry.dateStart === ""
      ) {
        return null;
      }
      return {
        type: "event",
        source: "editorial",
        id: entry._id,
        title: entry.title,
        slug: entry.slug,
        dateStart: entry.dateStart,
        dateEnd: entry.dateEnd,
        imageUrl: entry.coverImageUrl,
      } satisfies RelatedEventItem;
    default: {
      // Exhaustiveness guard — adding another _type to the union breaks
      // this never-assignment until a new case is added above.
      const _exhaustive: never = entry;
      void _exhaustive;
      return null;
    }
  }
}

export interface MergeRelatedItemsInput {
  curated: RelatedContentItem[];
  /**
   * Flat list of every auto-derived related item — articles (editorial or
   * BFF), pages (BFF only), and entities (mentioned players/teams/staff).
   * The merge does not care which source produced which item; it only
   * preserves order and drops duplicates by `id`.
   */
  auto: RelatedContentItem[];
}

/**
 * Curated entries appear first and win on id collision — any auto-derived
 * item sharing an id with a curated entry is dropped so the same target
 * never renders twice.
 */
export function mergeRelatedItems(
  input: MergeRelatedItemsInput,
): RelatedContentItem[] {
  const curatedIds = new Set(input.curated.map((c) => c.id));
  return [...input.curated, ...input.auto.filter((i) => !curatedIds.has(i.id))];
}
