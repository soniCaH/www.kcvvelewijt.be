const BODY_PROJECTION = `body[]{ ..., "fileUrl": file.asset->url, "asset": select(_type == "image" => asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max" }, _type == "articleImage" => image.asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max" }), markDefs[]{ ..., _type == "internalLink" => { ..., "reference": reference->{ _type, "slug": slug.current, psdId } } } }`;

export const ARTICLES_QUERY = `*[_type == "article" && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now())] | order(publishAt desc) {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  ${BODY_PROJECTION}
}`;

export const ARTICLE_TAGS_QUERY = `array::unique(*[_type == "article" && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now())].tags[])`;

export const ARTICLES_PAGINATED_QUERY = `*[_type == "article" && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now()) && select($category == "" => true, $category in tags)] | order(publishAt desc) [$offset...$offset + $limit] {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url
}`;

export const ARTICLE_BY_SLUG_QUERY = `*[_type == "article" && slug.current == $slug && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now())][0] {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  ${BODY_PROJECTION},
  relatedArticles[]-> { _id, title, slug, publishAt, "coverImageUrl": coverImage.asset->url + "?w=800&q=80&fm=webp&fit=max" }
}`;
