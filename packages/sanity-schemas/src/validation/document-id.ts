/** The published id of a document: strips a `drafts.` or `versions.<release>.` prefix. */
export const normalizeDocumentId = (id: string): string =>
  id.replace(/^drafts\./, '').replace(/^versions\.[^.]+\./, '')
