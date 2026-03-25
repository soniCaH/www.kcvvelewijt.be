import { defineQuery } from "groq";

export const SPONSORS_QUERY =
  defineQuery(`*[_type == "sponsor" && active == true] | order(name asc) {
  _id, name, url, type, tier, featured, "logoUrl": logo.asset->url + "?w=400&q=80&fm=webp&fit=max"
}`);
