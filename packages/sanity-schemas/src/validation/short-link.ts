import {RESERVED_SHORT_LINK_NAMES} from '../reserved-short-link-names'

/** One lowercase URL-safe word: the whole short link is `/<name>`. */
export const SHORT_LINK_NAME_PATTERN = /^[a-z0-9-]+$/

interface FetchClient {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>
}

export interface ShortLinkNameContext {
  document?: {_id?: string}
  getClient?: (options: {apiVersion: string}) => FetchClient
}

const API_VERSION = '2024-01-01'

/** Another short link (published or draft) already uses the name. */
const DUPLICATE_QUERY = `count(*[_type == "shortLink" && name == $name && !(_id in [$id, "drafts." + $id])])`

/**
 * Validation for `shortLink.name` (#3573). Shape first, then the clash guard
 * (a real top-level route always wins, so the name would never be served), then
 * uniqueness across `shortLink` documents. Empty passes: `.required()` stays
 * the field's own call.
 */
export async function validateShortLinkName(
  value: unknown,
  context: ShortLinkNameContext,
): Promise<true | string> {
  if (typeof value !== 'string' || value.length === 0) return true

  if (!SHORT_LINK_NAME_PATTERN.test(value)) {
    return 'Gebruik één woord met enkel kleine letters, cijfers en koppeltekens (bijv. "stage" of "kampioenenfeest"). Geen hoofdletters, spaties of schuine strepen.'
  }
  if (RESERVED_SHORT_LINK_NAMES.includes(value)) {
    return `"${value}" is al een pagina van de site. Een echte pagina wint altijd van een korte link, dus deze naam zou nooit werken. Kies een andere naam.`
  }

  if (context.getClient) {
    const id = (context.document?._id ?? '').replace(/^drafts\./, '').replace(/^versions\.[^.]+\./, '')
    const taken = await context
      .getClient({apiVersion: API_VERSION})
      .fetch<number>(DUPLICATE_QUERY, {name: value, id})
    if (taken > 0) return `Er bestaat al een korte link "${value}". Elke naam kan maar één keer gebruikt worden.`
  }
  return true
}

/**
 * Validation for `shortLink.target` (#3573): a full `https://` URL or an
 * own-site path starting with a single `/`. Stricter than `validateLink`: no
 * `http://`, `mailto:`, `tel:` or `#anchor`, because a short link is an HTTP
 * redirect. Rejects `//host` and `/\host` (protocol-relative, an open redirect)
 * and any whitespace or control character.
 *
 * An own-site target must be a real page: its first path segment (before any
 * `/`, `?` or `#`) is empty (`/`) or a reserved top-level name. A target that
 * is itself a short link (`stage` → `/stage`, or `a` → `/b` and `b` → `/a`)
 * would redirect forever. Real pages never redirect back into the catch-all,
 * so no chain can loop.
 *
 * Empty passes (`.required()` is the field's own call).
 */
const TARGET_PATTERN = /^(https:\/\/[^/\s]|\/(?![/\\]))/

export function validateShortLinkTarget(value: unknown): true | string {
  if (typeof value !== 'string' || value.length === 0) return true
  const unsafe = /\s/.test(value) || [...value].some((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127)
  if (!TARGET_PATTERN.test(value) || unsafe) {
    return 'Dit is geen geldige bestemming. Gebruik een volledige link die met "https://" begint (bijv. https://www.tournify.nl/live/kcvvelewijt2025) of een pad op deze site dat met "/" begint (bijv. /nieuws/herfststage-2026), zonder spaties.'
  }
  const ownPath = value.startsWith('/') ? value : ownSitePath(value)
  if (ownPath !== null) {
    const first = ownPath.slice(1).split(/[/?#]/)[0].toLowerCase()
    if (first !== '' && !RESERVED_SHORT_LINK_NAMES.includes(first)) {
      return 'Een korte link moet naar een echte pagina van de site wijzen, niet naar een andere korte link. Kies een pad dat met een bestaande pagina begint (bijv. /nieuws/herfststage-2026), of een volledige https://-link.'
    }
  }
  return true
}

/** The club's own host, any case, optional port; the lookahead stops `kcvvelewijt.be.evil.com` and `kcvvelewijt.be@evil.com`. */
const OWN_SITE_URL = /^https:\/\/(?:www\.)?kcvvelewijt\.be\.?(?::\d*)?(?=[/?#]|$)([^?#]*)/i

/** The path of an `https://` URL on the club's own host, else `null`: `https://www.kcvvelewijt.be/stage` loops like `/stage`. */
function ownSitePath(value: string): string | null {
  const match = OWN_SITE_URL.exec(value)
  return match ? match[1] || '/' : null
}
