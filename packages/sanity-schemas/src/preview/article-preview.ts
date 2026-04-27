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
  return {
    title,
    subtitle: publishedAt ? new Date(publishedAt).toLocaleDateString('nl-BE') : 'No date',
    media,
  }
}
