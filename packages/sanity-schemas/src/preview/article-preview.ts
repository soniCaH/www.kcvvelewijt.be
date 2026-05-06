/**
 * Sanity preview select + prepare for article.
 * Formats publishedAt as a localized nl-BE date for the subtitle.
 */

export const articlePreviewSelect = {
  title: 'title',
  media: 'coverImage',
  publishedAt: 'publishedAt',
}

interface PortableTextSpan {
  text?: string
}
interface PortableTextBlock {
  children?: PortableTextSpan[]
}

function flattenTitle(value: unknown): string {
  // Title is now constrained Portable Text (single block, `accent`
  // decorator). Fall back to the legacy string form for any draft
  // surviving the migration window.
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const block = (value as PortableTextBlock[])[0]
    return block?.children?.map((c) => c.text ?? '').join('') ?? ''
  }
  return ''
}

export function prepareArticlePreview(selection: Record<keyof typeof articlePreviewSelect, any>) {
  const {title, media, publishedAt} = selection
  const parsed = typeof publishedAt === 'string' ? new Date(publishedAt) : null
  const subtitle =
    parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString('nl-BE') : 'Geen datum'
  return {title: flattenTitle(title), subtitle, media}
}
