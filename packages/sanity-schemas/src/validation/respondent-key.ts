/**
 * Validates `qaPair.respondentKey` against the parent document's
 * `subjects[]`. Rules:
 *
 * - Skipped when the pair's `tag` is not `key` or `quote` (no attribution
 *   renders on standard/rapid-fire, so no enforcement makes sense).
 * - Skipped on non-interview articles.
 * - Skipped when `subjects.length < 2` — single-subject interviews
 *   auto-resolve to `subjects[0]` at the runtime boundary.
 * - On N≥2, returns a Dutch error message if the value is unset
 *   ("Kies wie dit gezegd heeft").
 * - Also returns an error if the value doesn't match any existing
 *   `subjects[]._key` (guards against subject deletion after the
 *   pair was authored).
 *
 * Extracted from the inline validator on `qaPair.respondentKey` so it can
 * be unit-tested against synthetic contexts without the Sanity Studio
 * runtime.
 */
export interface RespondentKeyContext {
  parent?: {tag?: string}
  document?: {
    articleType?: string
    subjects?: Array<{_key?: string}>
  }
}

export function validateRespondentKey(
  value: unknown,
  context: RespondentKeyContext,
): true | string {
  const tag = context.parent?.tag ?? 'standard'
  if (!['key', 'quote'].includes(tag)) return true

  if (context.document?.articleType !== 'interview') return true

  const subjects = Array.isArray(context.document?.subjects)
    ? context.document.subjects
    : []
  if (subjects.length < 2) return true

  if (typeof value !== 'string' || value === '') return 'Kies wie dit gezegd heeft'
  if (!subjects.some((s) => s?._key === value))
    return 'Deze respondent staat niet meer in de lijst van subjects'
  return true
}
