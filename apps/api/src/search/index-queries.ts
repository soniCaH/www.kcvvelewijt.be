/**
 * GROQ projection for an article's related-card cover image. Baked to a
 * hotspot-aware 16:9 crop (mirrors RELATED_ARTICLES_QUERY in the web app,
 * #2291) so the related-endpoint NewsCards respect the editorial hotspot
 * instead of a centre object-cover that chops heads. Resolves to null when the
 * article has no cover (`null + "…"` is null in GROQ). Shared by the full
 * reindex (sanity-index-sync) and the per-doc webhook so they can't drift.
 *
 * ponytail: 16:9 baked in because handleRelated → NewsCard is the only
 * consumer of this metadata; store separate hotspot fields if a second aspect
 * ratio ever needs it.
 */
const ARTICLE_COVER_IMAGE_PROJECTION = `"imageUrl": coverImage.asset->url + "?w=800&h=450&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(coverImage.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(coverImage.hotspot.y, 0.5))`;

/**
 * The window an article is searchable in. Both index paths share it so a
 * future-dated or expired article cannot enter the index down one path while
 * the other holds it out. The webhook deletes synchronously the moment it
 * next touches the document (`webhooks/index-handler.ts`'s `!doc` branch);
 * `runSanityIndexSync`'s manifest-based reconciliation step (#2831) is the
 * backstop for everything that branch can't reach — an `unpublishAt` simply
 * passing fires no webhook event of its own, so the sweep after it runs is
 * the only thing that ever prunes it.
 */
export const ARTICLE_PUBLISHED_FILTER = `publishedAt <= now() && (!defined(unpublishAt) || unpublishAt > now())`;

/**
 * The one article projection, shared by the nightly reindex
 * (sanity-index-sync) and the per-doc webhook. Both carried their own copy
 * until #2806, and every one of that issue's defects was present in both.
 *
 * What it fixes:
 *
 * - `title` is Portable Text on all 125 published articles, so it is flattened
 *   here. Projected raw it decodes as an array against a declared `string` —
 *   the webhook's `S.decodeUnknownSync` then rejects the document outright and
 *   the article never reaches the index at all.
 * - `pt::text` renders top-level `block` nodes only, so `qaBlock` answers
 *   contributed nothing. That hid roughly 90% of every interview.
 * - `htmlTable` was invisible too, and on the transfer overviews and season
 *   calendars the table *is* the article — 51 words of prose over an 11,000
 *   character table.
 * - `lead` is the editor's standfirst and was indexed nowhere.
 *
 * **Every branch is projected separately and joined in TypeScript, never in
 * GROQ.** GROQ propagates null through both `+` and `array::join`, and the
 * null sources here are not hypothetical: `pt::text(body)` returns null (not
 * `""`) for a body holding no top-level `block`, so a Q&A-only or table-only
 * article would blank out entirely — the exact articles this projection
 * exists to rescue. Composing in TypeScript sidesteps the whole class.
 *
 * The `array::compact` calls are the other half: a `pairs[]` entry with no
 * `question`, or an `htmlTable` with no `html`, leaves a null *element* that
 * the surrounding `coalesce` never sees. Dropping them here is what lets the
 * declared types be plain `string[]`.
 *
 * ponytail: five of the eight non-`block` body types stay out, measured against
 * production in #2806, not guessed. `transferFact` (9 articles) would add only
 * the former club's name — the player is already in the title and the prose.
 * `articleImage` (36) holds `alt`, which is accessibility text, not content.
 * `qaSectionDivider` (1) and `videoBlock` (1) are furniture. `fileAttachment`
 * and `eventFact` have no published articles at all. Re-run that survey if
 * event articles start shipping: `eventFact` carries a title, location,
 * address and note, and would belong here. `fileAttachment` is also a body
 * type on `page` (`packages/sanity-schemas/src/page.ts`) — `page` indexes its
 * labels via `PAGE_INDEX_PROJECTION`'s `fileAttachmentLabels` branch (#2832),
 * article deliberately still does not, for the reason measured above: no
 * published article carries one to lose.
 *
 * `pullQuote` (#2517) is the sixth non-`block` type and is indexed like
 * `qaBlock`'s answers: its own `body` field is Portable Text, so `pt::text`
 * skips it exactly the same way it skips a `qaPairRespondent.answer` — a
 * quote is real editorial content someone said, not furniture like
 * `articleImage`'s alt text.
 */
export const ARTICLE_INDEX_PROJECTION = `_id,
  "slug": coalesce(slug.current, ""),
  "title": coalesce(pt::text(title), title, ""),
  "lead": coalesce(lead, ""),
  "tags": coalesce(tags, []),
  "prose": coalesce(pt::text(body), ""),
  "qaQuestions": array::compact(coalesce(body[_type=="qaBlock"].pairs[].question, [])),
  "qaAnswers": coalesce(pt::text(body[_type=="qaBlock"].pairs[].respondents[].answer), ""),
  "tableHtml": array::compact(coalesce(body[_type=="htmlTable"].html, [])),
  "pullQuoteText": coalesce(pt::text(body[_type=="pullQuote"].body), ""),
  ${ARTICLE_COVER_IMAGE_PROJECTION}`;

/**
 * Flattens authored `htmlTable` markup to indexable words. On the transfer
 * overviews and season calendars the table *is* the article — 51 words of
 * prose over an 11,000-character table — so without this every squad list the
 * club has published is unfindable by the names inside it.
 *
 * ponytail: three replaces, no parser and no dependency. Entities become
 * spaces rather than their characters: this text is embedded, never rendered,
 * so a stray `&` would only be a dead token. All three reference forms are
 * matched — named, decimal and hex — because an unmatched `&#x26;` would glue
 * the cells on either side of it into one nonsense token.
 */
export function stripTableHtml(html: string): string {
  return html
    .replace(/&[a-z]+;|&#\d+;|&#x[0-9a-f]+;/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Whether a responsibility is currently visible on `/hulp`
 * (`active: false` is "tijdelijk verbergen" —
 * packages/sanity-schemas/src/responsibility.ts). Both index paths share it
 * so deactivating one cannot leave it MORE findable than before. Composed
 * into each path's query the same way `ARTICLE_PUBLISHED_FILTER` is: as part
 * of the `*[_id == $id && …][0]` clause, so a document the filter now
 * excludes projects `null` and falls into the existing `!doc` delete branch
 * — deactivating a responsibility evicts its vector synchronously, the same
 * way an article leaving its publish window does. Without this filter at
 * write time, a webhook edit on a hidden responsibility would keep
 * re-upserting its vector between sweeps, and `/hulp`'s own finder
 * (`RESPONSIBILITY_PATHS_QUERY`) already filters it out — a semantic-search
 * hit would then point at a slug the finder never renders. (The nightly
 * sweep's manifest-based reconciliation, #2831, would eventually catch a
 * stray re-upserted vector too, but only on the sweep after the mistake —
 * this filter is what stops it happening in the first place.)
 */
export const RESPONSIBILITY_ACTIVE_FILTER = `active == true`;

/**
 * The one responsibility projection, shared by the nightly reindex
 * (sanity-index-sync) and the per-doc webhook. Both carried their own copy
 * until #2832.
 *
 * None of these fields are Portable Text, so there is no `pt::text` null to
 * guard against — but `title` and `question` are coalesced here like every
 * other field, because `ResponsibilityDoc`
 * (apps/api/src/webhooks/index-handler.ts) declares both as required,
 * non-nullable `S.String`. A responsibility written without one — a script
 * `createOrReplace` bypasses Studio's own `Rule.required()` — projects
 * `null` for that field, `S.decodeUnknownSync` throws on it, and that maps
 * to `invalid_document` → a 500 Sanity retries indefinitely. Coalescing to
 * `""` is the plain-string equivalent of `ARTICLE_INDEX_PROJECTION`
 * coalescing every branch so the declared shape is what GROQ actually
 * returns.
 */
export const RESPONSIBILITY_INDEX_PROJECTION = `_id,
  "slug": coalesce(slug.current, ""),
  "title": coalesce(title, ""),
  "question": coalesce(question, ""),
  "keywords": coalesce(keywords, []),
  "summary": coalesce(summary, "")`;

export function buildResponsibilityIndexText(doc: {
  title: string;
  question: string;
  keywords: readonly string[];
  summary: string;
}): string {
  return [doc.title, doc.question, doc.keywords.join(" "), doc.summary]
    .filter(Boolean)
    .join(". ");
}

/**
 * The vector metadata for a responsibility, built once for both index paths.
 * Mirrors `buildArticleMetadata` — the two paths hand-assembled this record
 * before #2832.
 */
export function buildResponsibilityMetadata(doc: {
  slug: string;
  title: string;
  summary: string;
}): Record<string, string> {
  return {
    slug: doc.slug,
    type: "responsibility",
    title: doc.title,
    excerpt: doc.summary.slice(0, 200),
  };
}

/** The text an article is embedded from. */
export function buildArticleIndexText(doc: {
  title: string;
  tags: readonly string[];
  lead: string;
  prose: string;
  qaQuestions: readonly string[];
  qaAnswers: string;
  tableHtml: readonly string[];
  pullQuoteText: string;
}): string {
  return (
    [
      doc.title,
      doc.tags.join(" "),
      doc.lead,
      doc.prose,
      doc.pullQuoteText,
      doc.qaQuestions.join(" "),
      doc.qaAnswers,
      stripTableHtml(doc.tableHtml.join(" ")),
    ]
      // An absent branch must not leave a bare ". " separator behind.
      .filter(Boolean)
      .join(". ")
  );
}

/**
 * The article's search-card summary — display only. It is the grey line under
 * a result, the context handed to the AI answer, and the related-card blurb;
 * it never affects what matches.
 *
 * Drawn from the editor's `lead`, falling back to the article's prose. Neither
 * the Q&A text nor the table text can reach it: an interview whose lead is
 * empty should show its opening paragraph, not "Hoe ging het? Uitstekend", and
 * a transfer overview should not show a run of table cells.
 */
export function buildArticleExcerpt(doc: {
  lead: string;
  prose: string;
}): string {
  return (doc.lead || doc.prose).slice(0, 200);
}

/**
 * The vector metadata for an article, built once for both index paths.
 *
 * Sharing the projection was only half the drift: the two paths still hand-
 * assembled this record, and it had already diverged — the nightly sweep wrote
 * `tags` and the webhook did not, so an article's tag metadata depended on
 * which path last touched it.
 */
export function buildArticleMetadata(doc: {
  slug: string;
  title: string;
  lead: string;
  prose: string;
  tags: readonly string[];
  imageUrl?: string | null;
}): Record<string, string> {
  return {
    slug: doc.slug,
    type: "article",
    title: doc.title,
    excerpt: buildArticleExcerpt(doc),
    tags: doc.tags.join(","),
    ...(doc.imageUrl ? { imageUrl: doc.imageUrl } : {}),
  };
}

/**
 * The one page projection, shared by the nightly reindex
 * (sanity-index-sync) and the per-doc webhook. Both carried their own copy
 * of the same four fields until #2832.
 *
 * `pt::text(body)` returns null (not `""`) for a body holding no top-level
 * `block` — the same defect class `ARTICLE_INDEX_PROJECTION` exists to
 * rescue (#2806), and it is not hypothetical here either: `downloads` is a
 * published page whose body carries `fileAttachment` items alongside its
 * `block`s, and a page built from `fileAttachment`s alone would project a
 * null `bodyText`.
 *
 * **`page` was never blanked out by that null**, unlike article before
 * #2806, because of two things this projection depends on rather than
 * fixes: `buildPageIndexText` composes `bodyText` with `doc.bodyText ?? ""`
 * in TypeScript — never joined with `+` in GROQ — and
 * `page.title` (`packages/sanity-schemas/src/page.ts`) is a required plain
 * `string` field, never Portable Text, so it can never itself be empty or
 * decode as an array. A null `bodyText` therefore still leaves a non-empty
 * composed text from the title alone.
 *
 * What a null `bodyText` *did* cost: `downloads`'s three `fileAttachment`
 * labels ("Ongevalsaangifte", "Reglement van Inwendige Orde", "De 'ideale'
 * voetbal(groot)ouders") reached no field at all — the page was findable
 * only by semantic proximity to its section headings, not by the document
 * names themselves. The coalesced `fileAttachmentLabels` branch below closes
 * that, composed in TypeScript like every other branch here.
 */
export const PAGE_INDEX_PROJECTION = `_id,
  "slug": coalesce(slug.current, ""),
  "title": coalesce(title, ""),
  "bodyText": pt::text(body),
  "fileAttachmentLabels": array::compact(coalesce(body[_type == "fileAttachment"].label, []))`;

export function buildPageIndexText(doc: {
  title: string;
  bodyText: string | null;
  fileAttachmentLabels: readonly string[];
}): string {
  return [doc.title, doc.bodyText ?? "", doc.fileAttachmentLabels.join(" ")]
    .filter(Boolean)
    .join(". ");
}

/**
 * The vector metadata for a page, built once for both index paths. Mirrors
 * `buildArticleMetadata` — the two paths hand-assembled this record before
 * #2832.
 *
 * The excerpt prefers the body prose, falling back to the joined
 * `fileAttachmentLabels` only when there is none — the same page a null
 * `bodyText` makes findable by its attachment names (`downloads`) would
 * otherwise render a search-result card with a title over a blank line, and
 * hand `search-handler.ts`'s AI-answer context nothing but `"Downloads: "`.
 * A page with both prose and attachments still shows its prose, matching
 * the existing contract: fileAttachment labels are a fallback, not
 * preferred summary text.
 */
export function buildPageMetadata(doc: {
  slug: string;
  title: string;
  bodyText: string | null;
  fileAttachmentLabels: readonly string[];
}): Record<string, string> {
  return {
    slug: doc.slug,
    type: "page",
    title: doc.title,
    excerpt: (doc.bodyText || doc.fileAttachmentLabels.join(", ")).slice(
      0,
      200,
    ),
  };
}
