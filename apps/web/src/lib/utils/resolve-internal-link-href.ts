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
 * page) to its public route. Returns `null` when the reference can't
 * resolve — the identifier the target route needs (`psdId` or `slug`) is
 * missing, `_type` isn't one of the five known targets, or (a team only) the
 * team is archived: a retired PSD team has no page any more (#3000).
 *
 * Shared by the body's `internalLink` mark (`<ArticleBody>`) and the
 * article-foot `<ArticleCtaBand>` so the two never drift on how a reference
 * becomes a URL, or on when one doesn't.
 */
export function resolveInternalLinkHref(
  ref?: InternalLinkReference,
): string | null {
  if (!ref) return null;
  switch (ref._type) {
    case "player":
      return ref.psdId ? `/spelers/${ref.psdId}` : null;
    case "staffMember":
      return ref.psdId ? `/staf/${ref.psdId}` : null;
    case "team":
      if (ref.archived === true) return null;
      return ref.slug ? `/ploegen/${ref.slug}` : null;
    case "article":
      return ref.slug ? `/nieuws/${ref.slug}` : null;
    case "page":
      // Page documents are served at /club/[slug].
      return ref.slug ? `/club/${ref.slug}` : null;
    default:
      return null;
  }
}
