/**
 * The reference shape both the body's `internalLink` mark and
 * `article.callToAction.reference` project: `reference->{ _type, "slug":
 * slug.current, psdId, archived }`.
 */
export interface InternalLinkReference {
  _type: string;
  slug?: string | null;
  psdId?: string | null;
  archived?: boolean | null;
}

/**
 * Resolves an internal reference (player / staffMember / team / article /
 * page) to its public route. Returns `"#"` when the reference can't resolve
 * — the identifier the target route needs (`psdId` or `slug`) is missing, or
 * `_type` isn't one of the five known targets.
 *
 * Shared by the body's `internalLink` mark (`<ArticleBody>`) and the
 * article-foot `<ArticleCtaBand>` so the two never drift on how a reference
 * becomes a URL.
 */
export function resolveInternalLinkHref(ref?: InternalLinkReference): string {
  if (!ref) return "#";
  switch (ref._type) {
    case "player":
      return ref.psdId ? `/spelers/${ref.psdId}` : "#";
    case "staffMember":
      return ref.psdId ? `/staf/${ref.psdId}` : "#";
    case "team":
      return ref.slug ? `/ploegen/${ref.slug}` : "#";
    case "article":
      return ref.slug ? `/nieuws/${ref.slug}` : "#";
    case "page":
      // Page documents are served at /club/[slug].
      return ref.slug ? `/club/${ref.slug}` : "#";
    default:
      return "#";
  }
}
