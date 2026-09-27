/**
 * `slug — "title"` label the audit migrations print per offender. The title
 * may still be a plain string or already Portable Text (first block's spans).
 */
export interface LabelledArticleDoc {
  title?: unknown
  slug?: {current?: string}
}

/** Joined span text of a Portable Text title's first block, if it has children. */
export function firstBlockText(title: unknown[]): string | undefined {
  return (title as {children?: {text?: string}[]}[])[0]?.children?.map((c) => c.text ?? '').join('')
}

export function articleLabel(doc: LabelledArticleDoc): string {
  const {title} = doc
  const titleText =
    typeof title === 'string'
      ? title
      : Array.isArray(title)
        ? (firstBlockText(title) ?? '(geen titel)')
        : '(geen titel)'
  const slug = doc.slug?.current ?? '(geen slug)'
  return `${slug} — "${titleText}"`
}
