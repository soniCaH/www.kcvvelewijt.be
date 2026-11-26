/**
 * Sanity preview select + prepare for photoGallery.
 *
 * Two previews: the `galleryImage` array member (caption/credit, thumbnail
 * from the flattened image's own `asset` — #2363) and the document (title +
 * photo count + date, first image as cover). The document select reads the
 * raw `images` array to count it — plain path select, no array deref (see
 * organigramNode-preview.ts for why derefs by index stall the preview).
 */

export const galleryImagePreviewSelect = {
  title: 'caption',
  subtitle: 'credit',
  media: 'asset',
}

export const prepareGalleryImagePreview = (
  selection: Record<keyof typeof galleryImagePreviewSelect, any>,
) => {
  const {title, subtitle, media} = selection
  return {title: title || 'Foto', subtitle, media}
}

export const photoGalleryPreviewSelect = {
  title: 'title',
  media: 'images.0',
  publishedAt: 'publishedAt',
  images: 'images',
}

export const preparePhotoGalleryPreview = (
  selection: Record<keyof typeof photoGalleryPreviewSelect, any>,
) => {
  const {title, media, publishedAt, images} = selection
  const count = Array.isArray(images) ? images.length : 0
  const parsed = typeof publishedAt === 'string' ? new Date(publishedAt) : null
  const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString('nl-BE') : ''
  const subtitle = [count ? `${count} foto's` : '', date].filter(Boolean).join(' · ')
  return {title, subtitle, media}
}
