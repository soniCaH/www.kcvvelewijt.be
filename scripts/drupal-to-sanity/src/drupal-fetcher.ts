const DRUPAL_BASE = process.env.DRUPAL_BASE_URL!;

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

export function drupalUrl(path: string) {
  return `${DRUPAL_BASE}/jsonapi/${path}`;
}
