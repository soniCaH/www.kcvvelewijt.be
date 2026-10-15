/**
 * Validates `article.unpublishAt`: it must fall after `publishedAt`, otherwise
 * the article is never visible. Skipped when either side is empty.
 */
export interface UnpublishAtContext {
  document?: {publishedAt?: string}
}

export function validateUnpublishAt(
  unpublishAt: string | undefined,
  context: UnpublishAtContext,
): true | string {
  const publishedAt = context.document?.publishedAt
  if (!unpublishAt || !publishedAt) return true
  if (Date.parse(unpublishAt) <= Date.parse(publishedAt))
    return 'Het offline-moment moet na het publicatiemoment liggen. Anders is het artikel nooit zichtbaar.'
  return true
}
