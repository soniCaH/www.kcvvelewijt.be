interface FetchClient {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>
}

export interface MatchbalMatchIdContext {
  document?: {_id?: string}
  getClient?: (options: {apiVersion: string}) => FetchClient
}

const API_VERSION = '2024-01-01'

/** Another Matchbal (published or draft) already names the match. */
const DUPLICATE_QUERY = `count(*[_type == "matchbal" && matchId == $matchId && !(_id in [$id, "drafts." + $id])])`

/**
 * Validation for `matchbal.matchId` (#3917): a numeric PSD match id, and one
 * Matchbal per Match. Empty passes: `.required()` stays the field's own call.
 */
export const validateMatchbalMatchId = async (
  value: unknown,
  context: MatchbalMatchIdContext,
): Promise<true | string> => {
  if (typeof value !== 'string' || value.length === 0) return true

  if (!/^[1-9]\d*$/.test(value)) {
    return 'Gebruik het PSD-wedstrijd-id: enkel cijfers, zoals het in de link /wedstrijd/[matchId] staat (bijv. 3414).'
  }

  if (context.getClient) {
    const id = (context.document?._id ?? '').replace(/^drafts\./, '').replace(/^versions\.[^.]+\./, '')
    const taken = await context
      .getClient({apiVersion: API_VERSION})
      .fetch<number>(DUPLICATE_QUERY, {matchId: value, id})
    if (taken > 0) return `Wedstrijd ${value} heeft al een Matchbal. Elke wedstrijd heeft er maar één.`
  }
  return true
}
