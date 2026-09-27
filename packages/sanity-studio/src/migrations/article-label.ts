/**
 * `slug — "title"` label the audit migrations print per offender. The title
 * may still be a plain string or already Portable Text (first block's spans).
 */
export interface LabelledArticleDoc {
  title?: unknown
  slug?: {current?: string}
}

export function articleLabel(doc: LabelledArticleDoc): string {
  const {title} = doc
  const titleText =
    typeof title === 'string'
      ? title
      : Array.isArray(title)
        ? ((title as {children?: {text?: string}[]}[])[0]?.children
            ?.map((c) => c.text ?? '')
            .join('') ?? '(geen titel)')
        : '(geen titel)'
  const slug = doc.slug?.current ?? '(geen slug)'
  return `${slug} — "${titleText}"`
}
