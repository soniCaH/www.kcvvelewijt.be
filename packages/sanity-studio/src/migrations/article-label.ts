/**
 * `slug — "title"` label the audit migrations print per offender. The title
 * may still be a plain string or already Portable Text (first block's spans).
 */
export interface LabelledArticleDoc {
  title?: unknown
  slug?: {current?: string}
}

/** Joined span text of a Portable Text title's first block, if it has children. */
export const firstBlockText = (title: unknown[]): string | undefined => {
  return (title as {children?: {text?: string}[]}[])[0]?.children?.map((c) => c.text ?? '').join('')
}

const titleLabel = (title: unknown): string => {
  if (typeof title === 'string') return title
  if (Array.isArray(title)) return firstBlockText(title) ?? '(geen titel)'
  return '(geen titel)'
}

export const articleLabel = (doc: LabelledArticleDoc): string => {
  const {title} = doc
  const titleText = titleLabel(title)
  const slug = doc.slug?.current ?? '(geen slug)'
  return `${slug} — "${titleText}"`
}
