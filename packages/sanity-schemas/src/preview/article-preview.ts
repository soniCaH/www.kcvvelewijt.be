/**
 * Sanity preview select + prepare for article.
 * Formats publishedAt as a localized nl-BE date for the subtitle.
 */

export const articlePreviewSelect = {
  title: 'title',
  media: 'coverImage',
  publishedAt: 'publishedAt',
}

export function prepareArticlePreview(selection: Record<keyof typeof articlePreviewSelect, any>) {
  const {title, media, publishedAt} = selection
  const parsed = typeof publishedAt === 'string' ? new Date(publishedAt) : null
  const subtitle =
    parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString('nl-BE') : 'Geen datum'
  return {title, subtitle, media}
}
