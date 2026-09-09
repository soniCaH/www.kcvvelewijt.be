import type {
  RelatedArticleItem,
  RelatedPageItem,
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
  RelatedEventItem,
  RelatedGalleryItem,
  RelatedContentItem,
  RelatedRowItem,
} from "@/components/related/types";
import { formatArticleDate } from "@/lib/utils/dates";
import type {
  RelatedArticleRef,
  ArticleDetailVM,
  ArticleVM,
  MatchArticleVM,
} from "@/lib/repositories/article.repository";
import type { GalleryCardVM } from "@/lib/repositories/photoGallery.repository";
import type { EventVM } from "@/lib/repositories/event.repository";
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
    // Editorial photo wins over the sync-owned psdImage when both are
    // present (#2895 review) — same ?? chain the other repositories use.
    imageUrl: s.imageUrl ?? s.psdImageUrl ?? null,
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
        // Editorial photo wins over the sync-owned psdImage when both are
        // present (#2895 review) — mirrors mapMentionedStaff above.
        imageUrl: entry.imageUrl ?? entry.psdImageUrl ?? null,
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

/**
 * Adapt `ArticleVM[]` — the `ArticleRepository.findRelated()` output rendered
 * on the player / staff / team detail pages — to `<RelatedRow>` cards.
 *
 * Builds `reference`-source article items (the query behind `findRelated`,
 * `RELATED_ARTICLES_QUERY`, matches on `references($documentId)` — an
 * explicit in-body mention, the same relation `mapMentionedPlayers` etc.
 * represent for the article page) and delegates to `mapRelatedToRelatedRow`,
 * so the cards are shaped identically to every other route AND the
 * `related_content_*` analytics keep firing with `source: "reference"` /
 * `target_type: "article"` — preserving the contract of the retired
 * `<RelatedArticlesSection>`. Shared so the detail pages don't each
 * hand-roll the mapping.
 */
export function articleVMsToRelatedRowItems(
  articles: ArticleVM[],
): RelatedRowItem[] {
  const related: RelatedArticleItem[] = articles.map((article) => ({
    type: "article",
    source: "reference",
    id: article.id,
    title: article.title,
    slug: article.slug,
    imageUrl: article.coverImageUrl ?? null,
    date: article.publishedAt ?? null,
    excerpt: null,
  }));
  return mapRelatedToRelatedRow(related);
}

/**
 * Adapt `GalleryCardVM[]` — galleries linked to an event or a match — to
 * `<RelatedRow>` cards, `source: "domain"` (#2443 rule 4: a match/event's own
 * photo galleries are bounded and defining). Shared between `/evenementen/[slug]`
 * and `/wedstrijd/[matchId]`, the two former `<GallerySection>` consumers.
 */
export function mapGalleriesToRelatedRow(
  galleries: readonly GalleryCardVM[],
): RelatedRowItem[] {
  const items: RelatedGalleryItem[] = galleries.map((g) => ({
    type: "gallery",
    source: "domain",
    id: g.id,
    title: g.title,
    slug: g.slug,
    imageUrl: g.coverUrl ?? null,
  }));
  return mapRelatedToRelatedRow(items);
}

/**
 * Adapt `EventVM[]` — other upcoming events — to `<RelatedRow>` cards for the
 * siblings tier on `/evenementen/[slug]` (the former `<AndereEvents>` list).
 * `source: "domain"`: like every siblings-tier item, this is a structural
 * relation (same document type as the host page), never editorial, AI, or an
 * in-body mention.
 */
export function eventVMsToSiblingItems(
  events: readonly EventVM[],
): RelatedRowItem[] {
  const items: RelatedEventItem[] = events
    .filter((e) => e.dateStart !== "")
    .map((e) => ({
      type: "event",
      source: "domain",
      id: e.id,
      title: e.title,
      slug: e.slug,
      dateStart: e.dateStart,
      dateEnd: e.dateEnd,
      imageUrl: e.coverImageUrl,
    }));
  return mapRelatedToRelatedRow(items);
}

/**
 * Adapt `MatchArticleVM[]` — the `matchPreview`/`matchRecap` article(s)
 * linked to this specific match (`ArticleRepository.findByLinkedMatch`) — to
 * `<RelatedRow>` cards for `/wedstrijd/[matchId]`'s domain tier. `source:
 * "domain"`: the link is a structural field match (`linkedMatch ===
 * matchId`), not an editorial pick, an AI score, or a body-text mention.
 * Replaces `<MatchArticleLinkCard>` + `selectMatchArticle`'s recap-vs-preview
 * truth table (#2443 resolution) — both linked articles simply become two
 * items in the merged list rather than one hero card plus an inline
 * secondary link.
 *
 * Built directly as `RelatedRowItem`s rather than routed through
 * `mapRelatedItem`'s generic `"article"` case, which hardcodes `badge:
 * "NIEUWS"` — a finished match with both a preview and a recap would
 * otherwise render two identical "NIEUWS" cards with no way to tell them
 * apart (review round 1, #2788). Mirrors the retired `selectMatchArticle`'s
 * `RECAP_KICKER` / `PREVIEW_KICKER` distinction.
 */
export function matchArticlesToRelatedRow(
  articles: readonly MatchArticleVM[],
): RelatedRowItem[] {
  return articles.map((a) => ({
    title: a.title,
    href: `/nieuws/${a.slug}`,
    imageUrl: a.coverImageUrl ?? undefined,
    badge: a.articleType === "matchRecap" ? "VERSLAG" : "VOORBESCHOUWING",
    date: a.publishedAt ? formatArticleDate(a.publishedAt) : undefined,
    analyticsId: a.id,
    analyticsSource: "domain",
    analyticsType: "article",
    analyticsTargetSlug: a.slug,
  }));
}

/**
 * Adapt the discriminated `RelatedContentItem` union to the flat
 * `<RelatedRow>` card shape. Each variant maps to a card with the
 * appropriate badge, href, image, and (where applicable) display date.
 *
 * Items that can't yield a clickable card (e.g. player without a
 * `psdId`, staff without a name) are silently dropped — the upstream
 * mappers already null-guard the resolvable fields, this layer just
 * picks the fallback labels and routes.
 */
export function mapRelatedToRelatedRow(
  items: RelatedContentItem[],
): RelatedRowItem[] {
  const out: RelatedRowItem[] = [];
  for (const item of items) {
    const mapped = mapRelatedItem(item);
    if (mapped) out.push(mapped);
  }
  return out;
}

function mapRelatedItem(item: RelatedContentItem): RelatedRowItem | null {
  switch (item.type) {
    case "article":
      return {
        title: item.title,
        href: `/nieuws/${item.slug}`,
        imageUrl: item.imageUrl ?? undefined,
        badge: "NIEUWS",
        date: item.date ? formatArticleDate(item.date) : undefined,
        // RelatedArticleItem doesn't currently carry the linked
        // article's own articleType; the card defaults to cream bg.
        // Plumbing articleType through is tracked alongside #1829.
        analyticsId: item.id,
        analyticsSource: item.source,
        analyticsType: "article",
        analyticsTargetSlug: item.slug,
      };
    case "page":
      return {
        title: item.title,
        href: `/club/${item.slug}`,
        imageUrl: item.imageUrl ?? undefined,
        badge: "PAGINA",
        analyticsId: item.id,
        analyticsSource: item.source,
        analyticsType: "page",
        analyticsTargetSlug: item.slug,
      };
    case "player": {
      const name = [item.firstName, item.lastName]
        .filter((n): n is string => typeof n === "string" && n.length > 0)
        .join(" ");
      if (!name) return null;
      return {
        title: name,
        href: `/spelers/${item.psdId}`,
        imageUrl: item.imageUrl ?? undefined,
        artefact: item.imageUrl
          ? undefined
          : { kind: "person", personType: "player", id: item.id },
        badge: item.position?.toUpperCase() ?? "SPELER",
        analyticsId: item.id,
        analyticsSource: item.source,
        analyticsType: "player",
        // GA4 contract: players use `psdId` as the routing identifier
        // (locked at #1832 to preserve report dimensions).
        analyticsTargetSlug: item.psdId,
      };
    }
    case "team":
      return {
        title: item.name,
        href: `/ploegen/${item.slug}`,
        imageUrl: item.imageUrl ?? undefined,
        artefact: item.imageUrl ? undefined : { kind: "team" },
        badge: "PLOEG",
        analyticsId: item.id,
        analyticsSource: item.source,
        analyticsType: "team",
        analyticsTargetSlug: item.slug,
      };
    case "staff":
      // Staff has no resolvable detail-page route from THIS union member:
      // the mentioned/curated-staff GROQ projections
      // (apps/web/src/lib/repositories/article.repository.ts) don't select
      // a `psdId`, so there is no `/staf/[psdId]` target to link to.
      // Dropping the card rather than rendering a broken `href: "#"`.
      // Restoring staff mentions in the row (and their analytics) is
      // tracked at #1831 — needs the projection field. This does NOT
      // affect `/staf/[slug]`'s own domain-tier "teams" cards
      // (`team.repository.ts`'s `findByMemberId`), which link the other
      // direction (a staff member's own team, not a mentioned staff member).
      return null;
    case "event":
      return {
        title: item.title,
        href: `/evenementen/${item.slug}`,
        imageUrl: item.imageUrl ?? undefined,
        badge: "EVENEMENT",
        date: formatArticleDate(item.dateStart),
        analyticsId: item.id,
        analyticsSource: item.source,
        analyticsType: "event",
        analyticsTargetSlug: item.slug,
      };
    case "gallery":
      return {
        title: item.title,
        href: `/galerij/${item.slug}`,
        imageUrl: item.imageUrl ?? undefined,
        badge: "BEELDEN",
        analyticsId: item.id,
        analyticsSource: item.source,
        analyticsType: "gallery",
        analyticsTargetSlug: item.slug,
      };
  }
}
