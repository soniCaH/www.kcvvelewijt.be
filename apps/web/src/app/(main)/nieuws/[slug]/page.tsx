/**
 * Article Detail Page
 * Displays individual news articles from Sanity
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import { formatArticleDate } from "@/lib/utils/dates";
import { computeReadingTime } from "@/lib/utils/reading-time";
import {
  mapEditorialArticles,
  mapBffRelatedItems,
  mapMentionedPlayers,
  mapMentionedTeams,
  mapMentionedStaff,
} from "@/lib/utils/article-related-items";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildNewsArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildEventJsonLd,
  type PersonAboutInput,
  type EventJsonLdInput,
} from "@/lib/seo/jsonld";
import { AnnouncementTemplate } from "@/components/article/AnnouncementTemplate";
import { InterviewTemplate } from "@/components/article/InterviewTemplate";
import { TransferTemplate } from "@/components/article/TransferTemplate";
import { EventTemplate } from "@/components/article/EventTemplate";
import { ArticleViewTracker } from "@/components/article/ArticleViewTracker";
import { RelatedContentSection } from "@/components/related/RelatedContentSection/RelatedContentSection";
import type { RelatedContentItem } from "@/components/related/types";
import type { PortableTextBlock } from "@portabletext/react";
import type { SubjectValue } from "@/components/article/SubjectAttribution";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Per-type template dispatch. Extracted out of the JSX so the nested
 * ternary (four branches, each with its own prop shape) doesn't bloat
 * the page body. Keyed on `articleType` with a default renderer for
 * missing/unknown types → `AnnouncementTemplate` (the fallback path
 * per PRD §3).
 */
interface RenderTemplateArgs {
  articleType: string | null | undefined;
  articleId: string;
  title: string;
  category?: string;
  coverImageUrl?: string;
  coverImagePortraitUrl?: string | null;
  publishedDate?: string;
  readingTime?: string;
  shareUrl: string;
  body: PortableTextBlock[] | null;
  subject: SubjectValue | null;
}

function renderTemplate(args: RenderTemplateArgs) {
  const shareConfig = { url: args.shareUrl, title: args.title };
  switch (args.articleType) {
    case "interview":
      return (
        <InterviewTemplate
          title={args.title}
          coverImageUrl={args.coverImagePortraitUrl}
          publishedDate={args.publishedDate}
          readingTime={args.readingTime}
          shareConfig={shareConfig}
          body={args.body}
          subject={args.subject}
          articleId={args.articleId}
          articleType={args.articleType}
        />
      );
    case "transfer":
      return (
        <TransferTemplate
          title={args.title}
          coverImageUrl={args.coverImagePortraitUrl}
          publishedDate={args.publishedDate}
          readingTime={args.readingTime}
          shareConfig={shareConfig}
          body={args.body}
          articleId={args.articleId}
          articleType={args.articleType}
        />
      );
    case "event":
      return (
        <EventTemplate
          title={args.title}
          coverImageUrl={args.coverImageUrl}
          publishedDate={args.publishedDate}
          readingTime={args.readingTime}
          shareConfig={shareConfig}
          body={args.body}
          articleId={args.articleId}
          articleType={args.articleType}
        />
      );
    // Missing or unknown articleType falls through to announcement —
    // matches the PRD §3 legacy-article fallback rule.
    default:
      return (
        <AnnouncementTemplate
          title={args.title}
          category={args.category}
          coverImageUrl={args.coverImageUrl}
          publishedDate={args.publishedDate}
          readingTime={args.readingTime}
          shareConfig={shareConfig}
          body={args.body}
          articleId={args.articleId}
          articleType={args.articleType}
        />
      );
  }
}

/**
 * Provides all article slugs for static pre-rendering.
 *
 * Fetches available articles from the Sanity service and returns an array of parameter objects each containing a `slug` property.
 *
 * @returns An array of `{ slug: string }` objects for static route generation; returns an empty array if articles cannot be retrieved.
 */
export async function generateStaticParams() {
  try {
    const articles = await runPromise(
      Effect.gen(function* () {
        const repo = yield* ArticleRepository;
        return yield* repo.findAll();
      }),
    );
    return articles.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

/**
 * Produce page and Open Graph metadata for the article identified by the route params.
 *
 * @param params - Route parameters (resolve to obtain the article slug) used to locate the article
 * @returns A metadata object with `title`, `description`, and an `openGraph` object containing `title`, `description`, `type`, optional `publishedTime`, `authors`, and `images`. If the article cannot be found, returns a title indicating the article was not found.
 */
export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await runPromise(
    Effect.gen(function* () {
      const repo = yield* ArticleRepository;
      return yield* repo.findBySlug(slug);
    }),
  );
  if (!article) return { title: "Artikel niet gevonden | KCVV Elewijt" };

  const description = `${article.title} — Nieuws van KCVV Elewijt`;

  return {
    title: `${article.title} | KCVV Elewijt`,
    description,
    alternates: { canonical: `${SITE_CONFIG.siteUrl}/nieuws/${slug}` },
    openGraph: {
      title: article.title,
      description,
      type: "article" as const,
      publishedTime: article.publishedAt ?? undefined,
      authors: ["KCVV Elewijt"],
      images: article.coverImageUrl
        ? [{ url: article.coverImageUrl, alt: article.title }]
        : [DEFAULT_OG_IMAGE],
    },
  };
}

/**
 * Render the article detail page for the provided route slug.
 *
 * Fetches the article by slug and renders hero header, metadata bar, body, and related content.
 * Single-column layout with no sidebar.
 *
 * @param params - Route parameters object whose `slug` resolves to the article's slug string
 * @returns A JSX element representing the complete article page (or causes a 404 when the article is missing)
 */
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  const article = await runPromise(
    Effect.gen(function* () {
      const repo = yield* ArticleRepository;
      return yield* repo.findBySlug(slug);
    }),
  );

  if (!article) notFound();

  const tags = article.tags;
  const primaryCategory = tags[0]
    ? {
        name: tags[0],
        href: `/nieuws?categorie=${encodeURIComponent(tags[0])}`,
      }
    : undefined;

  const shareConfig = {
    url: `${SITE_CONFIG.siteUrl}/nieuws/${article.slug}`,
  };

  const readingTime = computeReadingTime(article.body ?? null);

  const hasEditorialArticles =
    article.relatedArticles && article.relatedArticles.length > 0;

  let articleRelatedItems: RelatedContentItem[];
  if (hasEditorialArticles) {
    articleRelatedItems = mapEditorialArticles(
      article.relatedArticles ?? undefined,
    );
  } else {
    articleRelatedItems = await runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getRelated(article.id);
      }).pipe(
        Effect.map(mapBffRelatedItems),
        // Broad catch is intentional: this route uses generateStaticParams,
        // so the BFF is called at build time for every article. Build
        // workers (local dev, CI, Vercel) may not reach the Worker, and
        // rendering must still succeed without a related-items block.
        // Related content is editorial polish, not load-bearing — falling
        // back to [] is preferable to failing the article page render.
        Effect.catchAll(() => Effect.succeed([])),
      ),
    );
  }

  const relatedItems: RelatedContentItem[] = [
    ...articleRelatedItems,
    ...mapMentionedPlayers(article.mentionedPlayers ?? undefined),
    ...mapMentionedStaff(article.mentionedStaffMembers ?? undefined),
    ...mapMentionedTeams(article.mentionedTeams ?? undefined),
  ];

  // Interview branch (§12): emit the baseline NewsArticle with `about:
  // Person` so Google can resolve the subject of the article. schema.org
  // has no canonical Interview type — NewsArticle + about:Person is the
  // fallback Google's Rich Results Test accepts. Only player + staff
  // subjects produce a Person; custom names resolve without a profile URL
  // so the `about.url` may be absent.
  const about: PersonAboutInput | undefined = (() => {
    if (article.articleType !== "interview") return undefined;
    const subject = article.subject;
    if (!subject?.kind) return undefined;
    if (subject.kind === "player") {
      const p = subject.playerRef;
      if (!p) return undefined;
      const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
      if (!name) return undefined;
      return {
        name,
        url: p.psdId ? `${SITE_CONFIG.siteUrl}/spelers/${p.psdId}` : undefined,
        image: p.transparentImageUrl ?? p.psdImageUrl ?? undefined,
        jobTitle: p.position ?? undefined,
      };
    }
    if (subject.kind === "staff") {
      const s = subject.staffRef;
      if (!s) return undefined;
      const name = [s.firstName, s.lastName].filter(Boolean).join(" ").trim();
      if (!name) return undefined;
      return {
        name,
        image: s.photoUrl ?? undefined,
        jobTitle: s.functionTitle ?? undefined,
      };
    }
    if (subject.kind === "custom") {
      const name = subject.customName?.trim() ?? "";
      if (!name) return undefined;
      return {
        name,
        image: subject.customPhotoUrl ?? undefined,
        jobTitle: subject.customRole ?? undefined,
      };
    }
    // Unknown discriminator — do not silently fall through to a branch.
    return undefined;
  })();

  // Event branch (§12): pull the first `eventFact` block out of the body
  // and map it to schema.org Event. Distinct from SportsEvent (matches).
  // Keeps the article page independent of block-renderer internals —
  // only a `.find(_type === "eventFact")` dispatch is needed here.
  const eventJsonLd: EventJsonLdInput | undefined = (() => {
    if (article.articleType !== "event") return undefined;
    const body = article.body as Array<
      PortableTextBlock & { _type?: string }
    > | null;
    if (!Array.isArray(body)) return undefined;
    const ev = body.find(
      (
        b,
      ): b is PortableTextBlock & {
        _type: "eventFact";
        title?: string;
        date?: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
        location?: string;
        address?: string;
      } => b._type === "eventFact",
    );
    if (!ev) return undefined;
    if (!ev.date) return undefined;
    const name = ev.title?.trim() || article.title;
    // Combine date (YYYY-MM-DD) with HH:MM time when present. Without
    // the time, Google resolves bare dates to 00:00 UTC and misrepresents
    // the event. Europe/Brussels is +01:00 in winter, +02:00 in summer —
    // we don't know which applies at the time the page renders, so we
    // emit a local-floating ISO (no TZ suffix) which Google accepts and
    // renders in the viewer's locale.
    const withTime = (date?: string, time?: string): string | undefined => {
      if (!date) return undefined;
      const cleanTime = time?.trim();
      if (!cleanTime) return date;
      return `${date}T${cleanTime}:00`;
    };
    // Only emit endDate when the editor explicitly set endDate or endTime.
    // Synthesising a bare-date endDate alongside a timed startDate causes
    // Google to resolve the end to 00:00 on that day → "ends before it
    // starts" — same-day events with only startTime would show as negative
    // duration in rich results. Schema.org treats an absent endDate as
    // "unknown end / full day" which is safer.
    const endDate =
      ev.endDate || ev.endTime
        ? withTime(ev.endDate ?? ev.date, ev.endTime)
        : undefined;
    return {
      name,
      startDate: withTime(ev.date, ev.startTime) ?? ev.date,
      endDate,
      location: ev.location,
      address: ev.address,
      url: shareConfig.url,
      image: article.coverImageUrl ?? undefined,
    };
  })();

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Nieuws", url: `${SITE_CONFIG.siteUrl}/nieuws` },
          { name: article.title, url: shareConfig.url },
        ])}
      />
      {article.publishedAt && (
        <JsonLd
          data={buildNewsArticleJsonLd({
            headline: article.title,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt ?? undefined,
            author: "KCVV Elewijt",
            image: article.coverImageUrl ?? undefined,
            url: shareConfig.url,
            about,
          })}
        />
      )}
      {eventJsonLd && <JsonLd data={buildEventJsonLd(eventJsonLd)} />}
      <ArticleViewTracker
        articleId={article.id}
        articleType={article.articleType}
        hasSubject={about !== undefined}
        subjectKind={about ? (article.subject?.kind ?? undefined) : undefined}
      />
      {renderTemplate({
        articleType: article.articleType,
        articleId: article.id,
        title: article.title,
        category: primaryCategory?.name,
        // Pass both projections separately — each template picks the
        // aspect it needs (Interview + Transfer take the 4:5 portrait,
        // Announcement takes the 16:9 wide). No cross-fallback: if a
        // template's preferred projection is null the template renders
        // without an image rather than cropping the wrong aspect.
        coverImageUrl: article.coverImageUrl ?? undefined,
        coverImagePortraitUrl: article.coverImagePortraitUrl ?? undefined,
        publishedDate: article.publishedAt
          ? formatArticleDate(new Date(article.publishedAt))
          : undefined,
        readingTime,
        shareUrl: shareConfig.url,
        body: (article.body as PortableTextBlock[] | null) ?? null,
        subject: article.subject ?? null,
      })}

      <RelatedContentSection
        items={relatedItems}
        pageType="article"
        pageSlug={article.slug}
        sourceArticleType={article.articleType}
      />
    </>
  );
}

export const revalidate = 3600;
