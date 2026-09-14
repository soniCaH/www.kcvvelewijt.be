import {at, defineMigration, set} from 'sanity/migrate'

/**
 * Repoints (or strips) every legacy `/player/<name-slug>` link stored in a
 * published `article` or `page` body — the Gatsby URL shape, carried over
 * two ways:
 *
 *   - An authored `htmlTable` block's raw `html` string (`<a href="…">`).
 *   - A Portable Text `link` markDef's `href`.
 *
 * Measured on production 2026-09-10 (see #2482): 59 instances across
 * exactly 3 articles, none of it in a `page`. A slug that still resolves to
 * a player gets its `href` rewritten to a **relative** `/spelers/<psdId>` —
 * relative is load-bearing, `<ArticleBody>`'s link serializer treats any
 * `href.startsWith("http")` as external and adds `target="_blank"` plus an
 * external mark. A slug that no longer resolves loses the anchor entirely,
 * keeping its text — a dead end is worse than plain text, not better.
 * Every other link (Facebook permalinks, anything else) is left alone.
 *
 * Logic + tests live here so synthetic documents can exercise every branch
 * without a Sanity dataset; the CLI entry points re-export
 * `repointLegacyPlayerLinksMigration`. Idempotent — a second run over an
 * already-migrated document produces no patch (there is no `/player/` href
 * left to find).
 */

// ─── Slug ↔ psdId resolution ────────────────────────────────────────────────
//
// `nameToSlug` / `resolvePersonPsdId` in `apps/web/src/lib/seo/legacy-redirect.ts`
// already define exactly how a legacy name-slug maps to a `psdId` — the
// `/player/[slug]` resolver route uses them live. `packages/sanity-studio`
// cannot import from `apps/web` (packages don't depend on apps in this
// monorepo), so the same algorithm is duplicated here rather than
// re-derived. Keep the two in lockstep: a drift here means this migration
// and the resolver disagree on which slugs match, which is exactly the bug
// class this migration exists to fix.
function nameToSlug(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/&/g, ' en ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface PlayerRow {
  psdId: string | null
  firstName: string | null
  lastName: string | null
}

/**
 * Resolve a legacy `/player/<slug>` name-slug to a `psdId`. Falls back to
 * treating the slug as a `psdId` directly (mirrors
 * `resolvePersonPsdId`'s `/players/<psdId>` fallback). Returns `null` when
 * no player matches — the slug is dead.
 */
export function resolvePlayerPsdId(
  slug: string,
  rows: readonly PlayerRow[],
): string | null {
  const target = slug.toLowerCase()
  for (const row of rows) {
    if (!row.psdId) continue
    if (nameToSlug(row.firstName ?? '', row.lastName ?? '') === target) {
      return row.psdId
    }
  }
  return rows.some((row) => row.psdId === slug) ? slug : null
}

// ─── Legacy href matching ────────────────────────────────────────────────
//
// Stored hrefs are absolute (`https://www.kcvvelewijt.be/player/<slug>`),
// not relative — matching only the relative form finds nothing (#2482).
// Some carry a trailing slash (`/player/eli-nuyts/`); both shapes occur in
// the same table.
const PLAYER_HREF_RE =
  /^https:\/\/www\.kcvvelewijt\.be\/player\/([^/"]+)\/?$/i

function matchPlayerSlug(href: string): string | null {
  return PLAYER_HREF_RE.exec(href)?.[1] ?? null
}

// ─── htmlTable block: raw HTML string ───────────────────────────────────

const ANCHOR_RE = /<a\b[^>]*>[\s\S]*?<\/a>/gi
const HREF_ATTR_RE = /\shref\s*=\s*"([^"]*)"/i

function extractHref(anchorHtml: string): string | null {
  return HREF_ATTR_RE.exec(anchorHtml)?.[1] ?? null
}

function extractAnchorText(anchorHtml: string): string {
  return anchorHtml.replace(/^<a\b[^>]*>/i, '').replace(/<\/a>\s*$/i, '')
}

/**
 * Rewrites every `<a href="https://www.kcvvelewijt.be/player/<slug>[/]">`
 * anchor in an authored `htmlTable` block's raw HTML: a resolvable slug
 * gets a relative `/spelers/<psdId>` href (stays an anchor); an
 * unresolvable one loses the anchor, keeping only its text. Every other
 * anchor (Facebook permalinks, anything else) passes through untouched —
 * this only ever looks at the `/player/` href shape.
 *
 * Regex-based rather than a full HTML parse: `packages/sanity-studio` has
 * no HTML-parsing dependency, and the authored shape is narrow and known
 * (`<a href="…">text</a>`, no nested anchors, no other attributes on a
 * player link — verified against the two live transfer-overview tables).
 */
export function rewritePlayerLinksInHtml(
  html: string,
  rows: readonly PlayerRow[],
): {html: string; changed: boolean} {
  let changed = false
  const next = html.replace(ANCHOR_RE, (anchorHtml) => {
    const href = extractHref(anchorHtml)
    if (!href) return anchorHtml
    const slug = matchPlayerSlug(href)
    if (!slug) return anchorHtml
    changed = true
    const psdId = resolvePlayerPsdId(slug, rows)
    const text = extractAnchorText(anchorHtml)
    return psdId ? `<a href="/spelers/${psdId}">${text}</a>` : text
  })
  return {html: next, changed}
}

// ─── Portable Text: `link` markDefs ─────────────────────────────────────

export interface PortableTextSpan {
  _type?: string
  _key?: string
  marks?: string[]
  [k: string]: unknown
}

export interface PortableTextMarkDef {
  _type?: string
  _key?: string
  href?: string
  [k: string]: unknown
}

export interface PortableTextBlockLike {
  _type?: string
  _key?: string
  markDefs?: PortableTextMarkDef[]
  children?: PortableTextSpan[]
  [k: string]: unknown
}

/**
 * Rewrites a single Portable Text block's `link` markDefs whose `href` is a
 * legacy `/player/` URL. A resolvable slug gets its `href` rewritten in
 * place to a relative `/spelers/<psdId>` — the mark stays type `link`;
 * converting to `internalLink` is a content-model change out of scope here
 * (#2482). An unresolvable slug drops the markDef *and* its key from every
 * span's `marks[]` that referenced it, unwrapping the link while keeping
 * the span's text untouched.
 */
export function rewritePlayerLinksInBlock(
  block: PortableTextBlockLike,
  rows: readonly PlayerRow[],
): {block: PortableTextBlockLike; changed: boolean} {
  const markDefs = block.markDefs
  if (!Array.isArray(markDefs) || markDefs.length === 0) {
    return {block, changed: false}
  }

  let changed = false
  const keysToUnwrap = new Set<string>()
  const nextMarkDefs: PortableTextMarkDef[] = []

  for (const markDef of markDefs) {
    const slug =
      markDef?._type === 'link' && typeof markDef.href === 'string'
        ? matchPlayerSlug(markDef.href)
        : null
    if (!slug) {
      nextMarkDefs.push(markDef)
      continue
    }
    changed = true
    const psdId = resolvePlayerPsdId(slug, rows)
    if (psdId) {
      nextMarkDefs.push({...markDef, href: `/spelers/${psdId}`})
      continue
    }
    if (typeof markDef._key === 'string') {
      keysToUnwrap.add(markDef._key)
    }
    // Dead slug, no _key to unwrap by: drop the markDef anyway rather than
    // leave a dead /player/ href behind — it just can't be un-marked from
    // a span (shouldn't happen; every markDef Sanity writes carries a key).
  }

  if (!changed) return {block, changed: false}

  const children = Array.isArray(block.children)
    ? block.children.map((span) => {
        if (!Array.isArray(span.marks) || keysToUnwrap.size === 0) return span
        const marks = span.marks.filter((key) => !keysToUnwrap.has(key))
        return marks.length === span.marks.length ? span : {...span, marks}
      })
    : block.children

  return {block: {...block, markDefs: nextMarkDefs, children}, changed: true}
}

// ─── Per-document transform ──────────────────────────────────────────────

export interface ArticleOrPageDoc {
  _id?: string
  _type?: string
  body?: unknown
}

type Patch = ReturnType<typeof at>

function isHtmlTableBlock(
  value: unknown,
): value is {_type: 'htmlTable'; html?: unknown; [k: string]: unknown} {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as {_type?: unknown})._type === 'htmlTable'
  )
}

function isPortableTextBlock(value: unknown): value is PortableTextBlockLike {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as {_type?: unknown})._type === 'block'
  )
}

export function migrateRepointLegacyPlayerLinks(
  doc: ArticleOrPageDoc,
  rows: readonly PlayerRow[],
): Patch[] | undefined {
  const body = doc.body
  if (!Array.isArray(body) || body.length === 0) return undefined

  let changed = false
  const nextBody = body.map((item) => {
    if (isHtmlTableBlock(item) && typeof item.html === 'string') {
      const {html, changed: htmlChanged} = rewritePlayerLinksInHtml(
        item.html,
        rows,
      )
      if (!htmlChanged) return item
      changed = true
      return {...item, html}
    }
    if (isPortableTextBlock(item)) {
      const {block, changed: blockChanged} = rewritePlayerLinksInBlock(
        item,
        rows,
      )
      if (!blockChanged) return item
      changed = true
      return block
    }
    return item
  })

  if (!changed) return undefined
  return [at('body', set(nextBody))]
}

// ─── CLI wiring ──────────────────────────────────────────────────────────

const PLAYER_ROWS_QUERY = `*[_type == "player" && defined(psdId) && psdId != ""]{psdId, firstName, lastName}`

interface MigrationFetchClient {
  fetch<T>(query: string): Promise<T>
}

// Fetched once per migration run (the CLI runs this module fresh in its own
// process) and reused across every document() invocation — mirrors the
// run-scoped `Set` in `backfill-event-slug.ts`.
let cachedPlayerRows: Promise<PlayerRow[]> | undefined

function fetchPlayerRows(client: MigrationFetchClient): Promise<PlayerRow[]> {
  cachedPlayerRows ??= client.fetch<PlayerRow[]>(PLAYER_ROWS_QUERY)
  return cachedPlayerRows
}

export default defineMigration({
  title:
    'Repoint legacy /player/ links to /spelers/<psdId>, or strip them (#2482)',
  documentTypes: ['article', 'page'],

  migrate: {
    async document(doc, context) {
      const rows = await fetchPlayerRows(context.client)
      // `Migration.migrate.document`'s async return type has no `undefined`
      // member (unlike its sync one, which allows `void`) — `[]` is the
      // async-safe "no patch" value, applied identically to no mutation.
      return migrateRepointLegacyPlayerLinks(doc as ArticleOrPageDoc, rows) ?? []
    },
  },
})
