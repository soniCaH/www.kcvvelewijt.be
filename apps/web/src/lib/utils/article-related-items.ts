import type {
  RelatedArticleItem,
  RelatedPageItem,
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
  RelatedContentItem,
} from "@/components/related/types";
import type {
  SanityArticle,
  SanityMentionedPlayer,
  SanityMentionedTeam,
  SanityMentionedStaffMember,
} from "@/lib/effect/services/SanityService";
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
  articles?: SanityArticle[],
): RelatedArticleItem[] {
  if (!articles?.length) return [];
  return articles.map((a) => ({
    type: "article" as const,
    id: a._id,
    title: a.title,
    slug: a.slug.current,
    imageUrl: a.coverImageUrl,
    date: a.publishAt,
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
        id: item.id,
        title: item.title,
        slug: item.slug,
        imageUrl: null,
        excerpt: item.excerpt,
      } satisfies RelatedPageItem;
    }
    return {
      type: "article" as const,
      id: item.id,
      title: item.title,
      slug: item.slug,
      imageUrl: null,
      date: null,
      excerpt: item.excerpt,
    } satisfies RelatedArticleItem;
  });
}

export function mapMentionedPlayers(
  players?: Array<SanityMentionedPlayer | null>,
): RelatedPlayerItem[] {
  const valid = (players ?? []).filter(
    (p): p is SanityMentionedPlayer => p != null,
  );
  return deduplicateById(valid).map((p) => ({
    type: "player" as const,
    id: p._id,
    firstName: p.firstName,
    lastName: p.lastName,
    position: p.position,
    imageUrl: p.imageUrl,
    psdId: p.psdId,
  }));
}

export function mapMentionedTeams(
  teams?: Array<SanityMentionedTeam | null>,
): RelatedTeamItem[] {
  const valid = (teams ?? []).filter(
    (t): t is SanityMentionedTeam => t != null,
  );
  return deduplicateById(valid).map((t) => ({
    type: "team" as const,
    id: t._id,
    name: t.name,
    slug: t.slug,
    imageUrl: t.imageUrl,
    tagline: null,
  }));
}

export function mapMentionedStaff(
  staff?: Array<SanityMentionedStaffMember | null>,
): RelatedStaffItem[] {
  const valid = (staff ?? []).filter(
    (s): s is SanityMentionedStaffMember => s != null,
  );
  return deduplicateById(valid).map((s) => ({
    type: "staff" as const,
    id: s._id,
    firstName: s.firstName,
    lastName: s.lastName,
    role: s.positionTitle,
    imageUrl: s.imageUrl,
  }));
}
