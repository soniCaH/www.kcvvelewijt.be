import type {ValidationContext} from 'sanity'

/**
 * Cycle guards for `organigramNode.parentNode` (#3478). A node inside a parent
 * cycle never reaches the root, so it vanishes from the organigram with its
 * whole subtree. Two layers live here: the picker filter (never offer a bad
 * parent) and the validation rule (reject a save that would close a cycle).
 * The web tree builder carries a third guard (`buildSpotlightTree`).
 */

interface ParentRow {
  _id: string
  parent?: string
}

interface FetchClient {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>
}

type GetClient = (options: {apiVersion: string}) => FetchClient

const API_VERSION = '2024-01-01'

const ALL_NODES_QUERY = `*[_type == "organigramNode"]{_id, "parent": parentNode._ref}`
const PUBLISHED_NODES_QUERY = `*[_type == "organigramNode" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{_id, "parent": parentNode._ref}`

/** `drafts.x` / `versions.<release>.x` → `x`. */
export function normalizeOrganigramId(id: string): string {
  return id.replace(/^drafts\./, '').replace(/^versions\.[^.]+\./, '')
}

/** Normalised child → parent map. Later rows win, so a draft (sorted last) overrides its published twin. */
function parentMap(rows: ParentRow[]): Map<string, string | undefined> {
  const isDraft = (row: ParentRow) => row._id.startsWith('drafts.') || row._id.startsWith('versions.')
  const map = new Map<string, string | undefined>()
  for (const row of [...rows].sort((a, b) => Number(isDraft(a)) - Number(isDraft(b)))) {
    map.set(normalizeOrganigramId(row._id), row.parent ? normalizeOrganigramId(row.parent) : undefined)
  }
  return map
}

/**
 * Every `_id` the parent picker must hide for `selfId`: the node itself, its
 * draft twin and all descendants, each in published and `drafts.` form (a
 * reference search returns whichever form exists). Terminates on stored cycles.
 */
export function collectOrganigramExcludedIds(selfId: string, rows: ParentRow[]): string[] {
  const parents = parentMap(rows)
  const self = normalizeOrganigramId(selfId)
  const childrenOf = new Map<string, string[]>()
  for (const [id, parent] of parents) {
    if (!parent) continue
    const bucket = childrenOf.get(parent)
    if (bucket) bucket.push(id)
    else childrenOf.set(parent, [id])
  }
  const excluded = new Set<string>([self])
  const queue = [self]
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    for (const child of childrenOf.get(id) ?? []) {
      if (!excluded.has(child)) {
        excluded.add(child)
        queue.push(child)
      }
    }
  }
  const ids = [...excluded]
  return [...ids, ...ids.map((id) => `drafts.${id}`)]
}

/** `options.filter` for `organigramNode.parentNode`. */
export async function organigramParentFilter({
  document,
  getClient,
}: {
  document?: {_id?: string}
  getClient: GetClient
}): Promise<{filter: string; params: {excluded: string[]}}> {
  const selfId = document?._id
  if (!selfId) return {filter: 'true', params: {excluded: []}}
  const rows = await getClient({apiVersion: API_VERSION}).fetch<ParentRow[]>(ALL_NODES_QUERY)
  return {filter: '!(_id in $excluded)', params: {excluded: collectOrganigramExcludedIds(selfId, rows)}}
}

/**
 * Walks the PUBLISHED parent chain upward from the picked parent. Fails when
 * the walk reaches this node (A→A, A→B→A, longer). A chain that runs into an
 * existing loop NOT including this node is not this save's doing: the walk
 * stops there and passes. Ids are compared with `drafts.` / `versions.`
 * stripped.
 */
export async function validateOrganigramParent(
  ref: {_ref?: string} | undefined,
  context: ValidationContext,
): Promise<true | string> {
  const selfId = (context.document as {_id?: string} | undefined)?._id
  if (!ref?._ref || !selfId) return true

  const rows = await context.getClient({apiVersion: API_VERSION}).fetch<ParentRow[]>(PUBLISHED_NODES_QUERY)
  const parents = new Map(rows.map((row) => [normalizeOrganigramId(row._id), row.parent && normalizeOrganigramId(row.parent)]))
  const self = normalizeOrganigramId(selfId)

  const seen = new Set<string>()
  let current: string | undefined = normalizeOrganigramId(ref._ref)
  while (current) {
    if (current === self) {
      return 'Dit zou een kringverwijzing maken: een positie kan niet (indirect) aan zichzelf rapporteren.'
    }
    if (seen.has(current)) return true
    seen.add(current)
    current = parents.get(current) || undefined
  }
  return true
}
