export const PAGE_BY_SLUG_QUERY = `*[_type == "page" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  body[]{ ..., "fileUrl": file.asset->url, "asset": select(_type == "image" => asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max" }) }
}`;
