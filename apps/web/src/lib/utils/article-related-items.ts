import type {
  RelatedArticleItem,
  RelatedPageItem,
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
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
      tagline: null,
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
    role: s.positionTitle,
    imageUrl: s.imageUrl,
  }));
}
