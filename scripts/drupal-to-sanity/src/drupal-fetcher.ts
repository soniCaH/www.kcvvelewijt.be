const DRUPAL_BASE = process.env.DRUPAL_BASE_URL!;

/**
 * Fetches all items from a paginated Drupal JSON:API endpoint by following `links.next.href` until no next link remains.
 *
 * @param url - The initial JSON:API URL to start fetching pages from.
 * @returns An array containing all `data` items aggregated from each fetched page.
 * @throws Error if a fetch response is not OK; the error message includes the HTTP status and the request URL.
 */
export async function fetchAllPages<T>(url: string): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = url;
  while (next) {
    const res = await fetch(next);
    if (!res.ok) throw new Error(`Drupal fetch failed: ${res.status} ${next}`);
    const json = (await res.json()) as {
      data: T[];
      links?: { next?: { href: string } };
    };
    results.push(...json.data);
    next = json.links?.next?.href ?? null;
  }
  return results;
}

/**
 * Construct a Drupal JSON:API endpoint URL for the given resource path.
 *
 * @param path - The JSON:API resource path (for example, `node/article` or `taxonomy_term/tags`)
 * @returns The full URL to the JSON:API endpoint (e.g. `https://example.com/jsonapi/node/article`)
 */
export function drupalUrl(path: string) {
  return `${DRUPAL_BASE}/jsonapi/${path}`;
}
