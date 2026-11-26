import {at, defineMigration, set} from 'sanity/migrate'

/**
 * Collapse case-variant duplicates in `article.tags[]` onto one canonical
 * spelling per tag.
 *
 * Production held both `A-Ploeg` (76 articles) and `A-ploeg` (1). GROQ's `in`
 * operator is case-sensitive, so `"A-Ploeg" in tags` silently skipped that one
 * article — it was invisible to every correctly-cased filter, tag listing and
 * related-content query.
 *
 * The canonical form is an **explicit per-tag decision**, not a derived rule.
 * Two kinds of change are folded in here, and they are different in kind:
 *
 * 1. **Casing collisions — a bug.** `A-ploeg` and `A-Ploeg` are the same tag
 *    spelled two ways, and the odd one out is unreachable.
 * 2. **Cross-tag inconsistency — an editorial decision.** `A-Ploeg` capitalised
 *    the P while `B-ploeg` did not. That is not a bug (nothing breaks), but the
 *    club chose consistency, so `B-ploeg` → `B-Ploeg` is included deliberately.
 *
 * The distinction is recorded because it governs future entries: a new casing
 * collision should simply be added, while a cross-tag rename needs a decision
 * first. The map is the record of those decisions.
 *
 * Matching is on the lowercased form, so variants that do not exist yet
 * (`a-PLOEG`, `jeugd`) are caught too. A tag whose lowercase form is absent
 * from the map passes through untouched — the migration never invents a rename.
 *
 * Idempotent: a document already on canonical spellings produces no patch.
 *
 * Exported separately from `defineMigration` so unit tests can exercise the
 * branching without a Sanity dataset.
 */
export interface TaggedArticleDoc {
  _id?: string
  _type?: string
  tags?: unknown
}

type Patch = ReturnType<typeof at>

/**
 * Canonical spelling per tag. Keyed by lowercase form.
 *
 * Add a row when a new casing collision appears. Changing an existing value is
 * a content decision, not a fix — it renames the tag everywhere.
 */
export const CANONICAL_TAGS: Readonly<Record<string, string>> = {
  'a-ploeg': 'A-Ploeg',
  // Was `B-ploeg` in production; capitalised to match `A-Ploeg` by club decision.
  'b-ploeg': 'B-Ploeg',
  jeugd: 'Jeugd',
  evenement: 'Evenement',
  corona: 'Corona',
  transfernieuws: 'Transfernieuws',
  clubinfo: 'Clubinfo',
  sponsor: 'Sponsor',
  'beker van zemst': 'Beker Van Zemst',
  'beker van brabant': 'Beker Van Brabant',
  'football manager': 'Football Manager',
}

/**
 * Canonicalise one tag list: rewrite known case-variants, drop entries that
 * collapse onto an already-present canonical value, preserve original order.
 *
 * Returns `null` when nothing changes, so callers can skip the patch entirely.
 */
export const canonicaliseTags = (tags: readonly string[]): string[] | null => {
  const canonical = tags.map((tag) => CANONICAL_TAGS[tag.toLowerCase()] ?? tag)
  // A doc carrying both `A-Ploeg` and `A-ploeg` collapses to a single entry
  // (a Set keeps first-seen order).
  const out = [...new Set(canonical)]
  const changed =
    out.length !== canonical.length || canonical.some((c, i) => c !== tags[i])

  return changed ? out : null
}

export const migrateNormalizeArticleTagCasing = (
  doc: TaggedArticleDoc,
): Patch[] | undefined => {
  if (!Array.isArray(doc.tags)) return undefined
  if (doc.tags.length === 0) return undefined

  // Bail on malformed entries rather than coercing them: a non-string in
  // tags[] is a data problem for a human to look at, not something a migration
  // should quietly rewrite.
  const tags = doc.tags.filter((t): t is string => typeof t === 'string')
  if (tags.length !== doc.tags.length) return undefined

  const next = canonicaliseTags(tags)
  if (next === null) return undefined

  return [at('tags', set(next))]
}

export default defineMigration({
  title: 'Collapse case-variant article tags onto one canonical spelling',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      return migrateNormalizeArticleTagCasing(doc as TaggedArticleDoc)
    },
  },
})
