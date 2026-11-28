import {normalizeDocumentId} from './document-id'

interface FetchClient {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>
}

/** What a Studio `custom()` validator gets that a uniqueness check needs. */
export interface UniqueFieldContext {
  document?: {_id?: string}
  getClient?: (options: {apiVersion: string}) => FetchClient
}

const API_VERSION = '2024-01-01'

/**
 * True when another document of `type` (published or draft) already has
 * `value` in `field`; this document's draft, published and release copies
 * are ignored. `false` without a client (outside the Studio). `field` is a code
 * constant, never user input: it is written into the query.
 */
export const isTakenElsewhere = async (
  context: UniqueFieldContext,
  type: string,
  field: string,
  value: string,
): Promise<boolean> => {
  if (!context.getClient) return false
  const id = normalizeDocumentId(context.document?._id ?? '')
  const taken = await context
    .getClient({apiVersion: API_VERSION})
    .fetch<number>(
      `count(*[_type == $type && ${field} == $value && !(_id in [$id, "drafts." + $id]) && !(_id in path("versions.*." + $id))])`,
      {
        type,
        value,
        id,
      },
    )
  return taken > 0
}
