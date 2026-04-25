import {at, defineMigration, set} from 'sanity/migrate'

/**
 * Backfills `event.slug` for documents that have a `title` but no slug yet.
 * Runs after the `slug` field is added to the event schema (Phase 3 of the
 * related-content extension, #1318). Idempotent — events that already carry
 * a non-empty `slug.current` are skipped.
 *
 * Logic + tests live here so synthetic documents can exercise the patch
 * shape without a Sanity dataset; the CLI entry point re-exports
 * `backfillEventSlugMigration`.
 */
export interface SanitySlug {
  _type?: 'slug'
  current?: string
}

export interface EventDoc {
  _id?: string
  _type?: string
  title?: string
  slug?: SanitySlug
}

type Patch = ReturnType<typeof at>

const SLUG_MAX_LENGTH = 96

/**
 * Approximates Sanity Studio's default `slugify` (Studio uses `speakingurl`)
 * for the subset of input we actually see on this site: Dutch/French/English
 * editorial titles. Diacritics are stripped via NFKD; the ampersand is
 * mapped to "en" because Dutch event titles use "&" as "en" much more often
 * than they expect transliteration to the English "and" that `speakingurl`
 * would produce.
 *
 * If an editor cares about an exact slug, they should set it manually in
 * Studio after the migration runs — this helper is best-effort, not 1:1
 * with Studio's input.
 */
export function slugifyTitle(title: string, maxLength = SLUG_MAX_LENGTH): string {
  const normalized = title
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/&/g, ' en ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized.slice(0, maxLength).replace(/-+$/, '')
}

/**
 * Pure variant for unit tests — `seenSlugs` lets the test pre-populate
 * collisions deterministically. The real CLI entry uses a fresh `Set` on
 * every migration run (see `defineMigration` below).
 */
export function migrateBackfillEventSlug(
  doc: EventDoc,
  seenSlugs: Set<string> = new Set(),
): Patch[] | undefined {
  const existing = doc.slug?.current
  if (typeof existing === 'string' && existing.length > 0) {
    seenSlugs.add(existing)
    return undefined
  }

  const title = doc.title
  if (typeof title !== 'string' || title.trim().length === 0) return undefined

  const base = slugifyTitle(title)
  if (base.length === 0) return undefined

  // Deduplicate within a single migration run. `migrate.document` is invoked
  // sequentially per doc, so a module-scoped Set is safe; we still pass the
  // Set in for testability. Two events titled "Spaghetti-avond" yield slugs
  // `spaghetti-avond` and `spaghetti-avond-2` — Sanity's slug input has no
  // server-side uniqueness guarantee, so collisions would otherwise leave
  // one event unreachable from `/events/[slug]`.
  let candidate = base
  let suffix = 2
  while (seenSlugs.has(candidate)) {
    candidate = `${base}-${suffix++}`
  }
  seenSlugs.add(candidate)

  return [at('slug', set({_type: 'slug', current: candidate}))]
}

const runScopedSeenSlugs = new Set<string>()

export default defineMigration({
  title: 'Backfill event.slug from title (#1318 — Phase 3)',
  documentTypes: ['event'],

  migrate: {
    document(doc) {
      return migrateBackfillEventSlug(doc as EventDoc, runScopedSeenSlugs)
    },
  },
})
