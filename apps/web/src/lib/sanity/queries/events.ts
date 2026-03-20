export const EVENTS_QUERY = `*[_type == "event"] | order(dateStart asc) {
  _id, title, dateStart, dateEnd, externalLink,
  "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
}`;

// Returns the next event with featuredOnHome=true, or the earliest upcoming event,
// or null if none exist. $now must be current ISO datetime.
export const NEXT_FEATURED_EVENT_QUERY = `
  coalesce(
    *[_type == "event" && featuredOnHome == true && dateStart > $now] | order(dateStart asc) [0] {
      _id, title, dateStart, dateEnd, featuredOnHome, externalLink,
      "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
    },
    *[_type == "event" && dateStart > $now] | order(dateStart asc) [0] {
      _id, title, dateStart, dateEnd, featuredOnHome, externalLink,
      "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
    }
  )
`;
