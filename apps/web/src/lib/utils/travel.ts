/**
 * The shared-element names of a list item growing into its detail page: a
 * fixture row into the match hero (#3397), a news card's cover into the
 * article's cover, a squad card's photo into the player's (#3405). Plain
 * module, no `"use client"`: the detail pages are server components and read
 * it too.
 *
 * The name carries the kind and the id: an item pairs with the detail of its
 * OWN record only, so one match page leaving for another never pairs hero with
 * hero. `TRAVEL_CLASS` is the `view-transition-class` every end carries, which
 * `globals.css` styles (300 ms, the site's curve) without naming each record.
 */
export type TravelKind = "match" | "article" | "player";

export const TRAVEL_CLASS = "travel";

export const travelName = (kind: TravelKind, id: number | string): string =>
  // `view-transition-name` is a CSS identifier: a slug is safe, an id with a
  // dot or a space would drop the whole declaration and the end would not pair.
  `${kind}-travel-${String(id).replace(/[^\w-]/g, "_")}`;

const DETAIL_ROUTE = { article: "/nieuws/", player: "/spelers/" } as const;

/**
 * The slug of the detail page `href` opens, or `undefined` when `href` is not
 * exactly that kind's detail route (a listing, a query, a sibling route, an
 * absolute URL): only a link to the detail page travels.
 */
export function travelSlug(
  kind: keyof typeof DETAIL_ROUTE,
  href: string | undefined,
): string | undefined {
  const prefix = DETAIL_ROUTE[kind];
  if (!href?.startsWith(prefix)) return undefined;
  const slug = href.slice(prefix.length);
  return /^[^/?#]+$/.test(slug) ? slug : undefined;
}
