export const SPONSORS_QUERY = `*[_type == "sponsor" && active == true] | order(name asc) {
  _id, name, url, type, "logoUrl": logo.asset->url
}`;
