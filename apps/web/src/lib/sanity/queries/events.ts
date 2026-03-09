export const EVENTS_QUERY = `*[_type == "event"] | order(dateStart asc) {
  _id, title, dateStart, dateEnd, externalLink,
  "coverImageUrl": coverImage.asset->url
}`;
