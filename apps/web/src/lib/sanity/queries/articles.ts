export const ARTICLES_QUERY = `*[_type == "article"] | order(publishAt desc) {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url,
  body[]{ ..., "fileUrl": file.asset->url, "asset": select(_type == "image" => asset->{ url }) }
}`;

export const ARTICLE_BY_SLUG_QUERY = `*[_type == "article" && slug.current == $slug][0] {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url,
  body[]{ ..., "fileUrl": file.asset->url, "asset": select(_type == "image" => asset->{ url }) },
  relatedArticles[]-> { _id, title, slug, publishAt, "coverImageUrl": coverImage.asset->url }
}`;
