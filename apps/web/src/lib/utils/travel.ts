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

/**
 * `id` may be a raw href segment or a Next route param: decode first so a
 * percent-encoded `caf%C3%A9` and a decoded `café` name the same pair.
 */
const decode = (id: string): string => {
  try {
    return decodeURIComponent(id);
  } catch {
    return id; // a stray `%`: not an escape, keep it as it is
  }
};

export const travelName = (kind: TravelKind, id: number | string): string =>
  // `view-transition-name` is a CSS identifier: a slug is safe, an id with a
  // dot or a space would drop the whole declaration and the end would not pair.
  `${kind}-travel-${decode(String(id)).replace(/[^\w-]/g, "_")}`;

const DETAIL_ROUTE = {
  match: "/wedstrijd/",
  article: "/nieuws/",
  player: "/spelers/",
} as const;

/**
 * The id of the detail page `href` opens, or `undefined` when `href` is not
 * exactly that kind's detail route (a listing, a query, a sibling route, an
 * absolute URL): only a link to the detail page travels.
 */
export function travelId(
  kind: TravelKind,
  href: string | undefined,
): string | undefined {
  const prefix = DETAIL_ROUTE[kind];
  if (!href?.startsWith(prefix)) return undefined;
  const id = href.slice(prefix.length);
  return /^[^/?#]+$/.test(id) ? id : undefined;
}
