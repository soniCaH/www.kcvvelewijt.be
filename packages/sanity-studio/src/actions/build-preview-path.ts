/**
 * The public path of a document, per schema type. One table for the whole
 * Voorbeeld feature: the Studio action uses it now, and Slice B's Presentation
 * locations (#3619) will too, so Studio and site cannot disagree about URLs.
 */
const PREVIEW_PREFIX: Record<string, string> = {
  article: '/nieuws',
  event: '/evenementen',
  page: '/club',
  photoGallery: '/galerij',
}

/** Whether documents of this schema type have a public page to preview. */
export const hasPreviewPath = (type: string): boolean =>
  Object.prototype.hasOwnProperty.call(PREVIEW_PREFIX, type)

/** `undefined` for an unsupported type or a missing slug (the action then stays disabled). */
export const buildPreviewPath = (type: string, slug: string | undefined): string | undefined => {
  const prefix = hasPreviewPath(type) ? PREVIEW_PREFIX[type] : undefined
  const trimmed = slug?.trim()
  if (!prefix || !trimmed) return undefined
  return `${prefix}/${encodeURIComponent(trimmed)}`
}
