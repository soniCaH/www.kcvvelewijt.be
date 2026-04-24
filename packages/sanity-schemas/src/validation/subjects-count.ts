/**
 * Validates `article.subjects[]` on interview articles: 1–4 subjects, else
 * skipped (non-interview articles don't carry subjects). Returns a plain
 * string on error so Sanity surfaces it as a validation message; returns
 * `true` otherwise.
 */
export interface SubjectsCountContext {
  document?: {articleType?: string}
}

export function validateSubjectsCount(
  subjects: unknown,
  context: SubjectsCountContext,
): true | string {
  if (context.document?.articleType !== 'interview') return true
  const count = Array.isArray(subjects) ? subjects.length : 0
  if (count < 1) return 'Interview articles need at least one subject.'
  if (count > 4)
    return 'Maximum 4 subjects per interview. Lift the cap via a dedicated design pass — not inline.'
  return true
}
