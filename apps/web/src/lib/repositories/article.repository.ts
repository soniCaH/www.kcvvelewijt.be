import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type {
  ARTICLES_QUERY_RESULT,
  ARTICLE_TAGS_QUERY_RESULT,
  ARTICLE_BY_SLUG_QUERY_RESULT,
  RELATED_ARTICLES_QUERY_RESULT,
} from "../sanity/sanity.types";
import { formatArticleDate } from "../utils/dates";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const ARTICLES_QUERY =
  defineQuery(`*[_type == "article" && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now())] | order(publishAt desc) {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  body[]{ ..., "fileUrl": file.asset->url, "fileSize": file.asset->size, "fileMimeType": file.asset->mimeType, "fileOriginalFilename": file.asset->originalFilename, "asset": select(_type == "image" => asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max" }, _type == "articleImage" => image.asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max" }), markDefs[]{ ..., _type == "internalLink" => { ..., "reference": reference->{ _type, "slug": slug.current, psdId } } } }
}`);

export const ARTICLE_TAGS_QUERY = defineQuery(
  `array::unique(*[_type == "article" && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now())].tags[])`,
);

export const ARTICLES_PAGINATED_QUERY =
  defineQuery(`*[_type == "article" && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now()) && select($category == "" => true, $category in tags)] | order(publishAt desc) [$offset...$end] {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
}`);

export const RELATED_ARTICLES_QUERY =
  defineQuery(`*[_type == "article" && references($documentId) && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now())] | order(publishAt desc) {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url + "?w=800&q=80&fm=webp&fit=max"
}`);

export const ARTICLE_BY_SLUG_QUERY =
  defineQuery(`*[_type == "article" && slug.current == $slug && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now())][0] {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  body[]{ ..., "fileUrl": file.asset->url, "fileSize": file.asset->size, "fileMimeType": file.asset->mimeType, "fileOriginalFilename": file.asset->originalFilename, "asset": select(_type == "image" => asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max" }, _type == "articleImage" => image.asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max" }), markDefs[]{ ..., _type == "internalLink" => { ..., "reference": reference->{ _type, "slug": slug.current, psdId } } } },
  relatedArticles[]-> { _id, title, slug, publishAt, unpublishAt, "coverImageUrl": coverImage.asset->url + "?w=800&q=80&fm=webp&fit=max" },
  "mentionedPlayers": body[].markDefs[_type == "internalLink" && reference->_type == "player"].reference-> {
    _id, firstName, lastName, position,
    "imageUrl": psdImage.asset->url + "?w=400&q=80&fm=webp&fit=max",
    psdId
  },
  "mentionedTeams": body[].markDefs[_type == "internalLink" && reference->_type == "team"].reference-> {
    _id, name,
    "imageUrl": teamImage.asset->url + "?w=400&q=80&fm=webp&fit=max",
    "slug": slug.current
  },
  "mentionedStaffMembers": body[].markDefs[_type == "internalLink" && reference->_type == "staffMember"].reference-> {
    _id, firstName, lastName, positionTitle,
    "imageUrl": photo.asset->url + "?w=400&q=80&fm=webp&fit=max"
  }
}`);

// ─── View Models ─────────────────────────────────────────────────────────────

export interface ArticleVM {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  featured: boolean;
  coverImageUrl?: string;
  tags: string[];
}

export interface ArticleDetailVM extends ArticleVM {
  body: NonNullable<ARTICLE_BY_SLUG_DETAIL>["body"];
  relatedArticles?: RelatedArticleRef[];
  mentionedPlayers?: ARTICLE_BY_SLUG_DETAIL["mentionedPlayers"];
  mentionedTeams?: ARTICLE_BY_SLUG_DETAIL["mentionedTeams"];
  mentionedStaffMembers?: ARTICLE_BY_SLUG_DETAIL["mentionedStaffMembers"];
}

export interface RelatedArticleRef {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  coverImageUrl: string | null;
}

export interface HomepageArticle {
  href: string;
  title: string;
  description?: string;
  imageUrl?: string;
  imageAlt: string;
  date: string;
  dateIso: string;
  tags: Array<{ name: string }>;
}

type ARTICLE_BY_SLUG_DETAIL = NonNullable<ARTICLE_BY_SLUG_QUERY_RESULT>;

// ─── Transforms ──────────────────────────────────────────────────────────────

export function toArticleVM(row: ARTICLES_QUERY_RESULT[number]): ArticleVM {
  return {
    id: row._id,
    title: row.title ?? "",
    slug: row.slug?.current ?? "",
    publishedAt: row.publishAt,
    featured: row.featured ?? false,
    coverImageUrl: row.coverImageUrl ?? undefined,
    tags: row.tags ?? [],
  };
}

function toArticleDetailVM(row: ARTICLE_BY_SLUG_DETAIL): ArticleDetailVM {
  return {
    id: row._id,
    title: row.title ?? "",
    slug: row.slug?.current ?? "",
    publishedAt: row.publishAt,
    featured: row.featured ?? false,
    coverImageUrl: row.coverImageUrl ?? undefined,
    tags: row.tags ?? [],
    body: row.body,
    relatedArticles: (() => {
      const now = new Date().toISOString();
      return (
        row.relatedArticles
          ?.filter((a) => {
            if (a.publishAt && a.publishAt > now) return false;
            if (a.unpublishAt && a.unpublishAt <= now) return false;
            return true;
          })
          .map((a) => ({
            id: a._id,
            title: a.title ?? "",
            slug: a.slug?.current ?? "",
            publishedAt: a.publishAt,
            coverImageUrl: a.coverImageUrl,
          })) ?? undefined
      );
    })(),
    mentionedPlayers: row.mentionedPlayers ?? undefined,
    mentionedTeams: row.mentionedTeams ?? undefined,
    mentionedStaffMembers: row.mentionedStaffMembers ?? undefined,
  };
}

export function toHomepageArticle(article: ArticleVM): HomepageArticle {
  return {
    href: `/nieuws/${article.slug}`,
    title: article.title,
    imageUrl: article.coverImageUrl,
    imageAlt: article.title,
    date: article.publishedAt ? formatArticleDate(article.publishedAt) : "",
    dateIso: article.publishedAt ?? "",
    tags: article.tags.map((t) => ({ name: t })),
  };
}

export function toHomepageArticles(
  articles: readonly ArticleVM[],
): HomepageArticle[] {
  return articles.map((a) => toHomepageArticle(a));
}

// ─── Service ─────────────────────────────────────────────────────────────────

/** The list item type returned by the paginated query (no typegen for variable slicing) */
export type ArticleListRow = {
  _id: string;
  title: string | null;
  slug: { _type: "slug"; current?: string } | null;
  publishAt: string | null;
  featured: boolean | null;
  tags: string[] | null;
  coverImageUrl: string | null;
};

export interface ArticleRepositoryInterface {
  readonly findAll: () => Effect.Effect<ArticleVM[]>;
  readonly findBySlug: (slug: string) => Effect.Effect<ArticleDetailVM | null>;
  readonly findPaginated: (params: {
    offset: number;
    limit: number;
    category?: string;
  }) => Effect.Effect<ArticleVM[]>;
  readonly findTags: () => Effect.Effect<ARTICLE_TAGS_QUERY_RESULT>;
  readonly findRelated: (documentId: string) => Effect.Effect<ArticleVM[]>;
}

export class ArticleRepository extends Context.Tag("ArticleRepository")<
  ArticleRepository,
  ArticleRepositoryInterface
>() {}

export const ArticleRepositoryLive = Layer.succeed(ArticleRepository, {
  findAll: () =>
    fetchGroq<ARTICLES_QUERY_RESULT>(ARTICLES_QUERY).pipe(
      Effect.map((rows) => rows.map(toArticleVM)),
    ),
  findBySlug: (slug) =>
    fetchGroq<ARTICLE_BY_SLUG_QUERY_RESULT>(ARTICLE_BY_SLUG_QUERY, {
      slug,
    }).pipe(Effect.map((row) => (row ? toArticleDetailVM(row) : null))),
  findPaginated: ({ offset, limit, category }) =>
    fetchGroq<ArticleListRow[]>(ARTICLES_PAGINATED_QUERY, {
      offset,
      end: offset + limit,
      category: category ?? "",
    }).pipe(
      Effect.map((rows) =>
        rows.map((row) => toArticleVM(row as ARTICLES_QUERY_RESULT[number])),
      ),
    ),
  findTags: () => fetchGroq<ARTICLE_TAGS_QUERY_RESULT>(ARTICLE_TAGS_QUERY),
  findRelated: (documentId) =>
    fetchGroq<RELATED_ARTICLES_QUERY_RESULT>(RELATED_ARTICLES_QUERY, {
      documentId,
    }).pipe(
      Effect.map((rows) =>
        rows.map((row) => toArticleVM(row as ARTICLES_QUERY_RESULT[number])),
      ),
    ),
});
