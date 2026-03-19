export const ARTICLES_QUERY = `*[_type == "article" && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now())] | order(publishAt desc) {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  body[]{ ..., "fileUrl": file.asset->url, "asset": select(_type == "image" => asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max" }) }
}`;

export const ARTICLE_BY_SLUG_QUERY = `*[_type == "article" && slug.current == $slug && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now())][0] {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  body[]{ ..., "fileUrl": file.asset->url, "asset": select(_type == "image" => asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max" }) },
  relatedArticles[]-> { _id, title, slug, publishAt, "coverImageUrl": coverImage.asset->url + "?w=800&q=80&fm=webp&fit=max" }
}`;
