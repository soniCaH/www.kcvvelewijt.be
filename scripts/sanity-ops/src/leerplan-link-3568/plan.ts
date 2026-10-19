/**
 * The leerplan article links to a Drupal file path that 404s on the new site
 * (#3568, part of #3547). Pure: finds the link and builds the patch, so the
 * dry run and the write judge the same data and a test can pin it.
 */
export const ARTICLE_ID = "article-drupal-94acfa51-797f-445f-8192-d1d7600346f9";
export const OLD_HREF =
  "/sites/default/files/uploads/LEERPLAN_KCVVE_Versie22072019_digitaal.pdf";
export const NEW_HREF = "/downloads/leerplan-jeugdopleiding-2019.pdf";

export interface ArticleDoc {
  _id: string;
  _rev: string;
  body?:
    | {
        _key: string;
        _type: string;
        markDefs?: { _key: string; _type: string; href?: string }[];
      }[]
    | null;
}

export interface LinkPatch {
  id: string;
  rev: string;
  /** One `set` path per link, e.g. `body[_key=="b"].markDefs[_key=="m"].href`. */
  paths: string[];
}

/**
 * Every link in the body whose href is the dead Drupal path. `null` when none
 * is left and the new href is there (a re-run); throws when neither is found,
 * since the article was edited and the script no longer knows what to change.
 */
export function buildLinkPatch(doc: ArticleDoc): LinkPatch | null {
  const defs = (doc.body ?? []).flatMap((b) =>
    (b.markDefs ?? []).map((d) => ({ block: b._key, def: d })),
  );
  const paths = defs
    .filter(({ def }) => def._type === "link" && def.href === OLD_HREF)
    .map(
      ({ block, def }) =>
        `body[_key=="${block}"].markDefs[_key=="${def._key}"].href`,
    );
  if (paths.length > 0) return { id: doc._id, rev: doc._rev, paths };
  if (defs.some(({ def }) => def.href === NEW_HREF)) return null;
  throw new Error(
    `${doc._id}: no link points at ${OLD_HREF} or ${NEW_HREF} — the article was edited; update the script.`,
  );
}

/** What the read found, so `preflight` can refuse before anything is planned. */
export interface Snapshot {
  article: ArticleDoc | null;
  /** `drafts.*` and `versions.*` copies of the article. */
  drafts: string[];
}

export function preflight(snap: Snapshot): string[] {
  const errors: string[] = [];
  if (!snap.article) {
    errors.push(
      `${ARTICLE_ID} not found — wrong dataset, or a tokenless read of a private dataset (returns nothing, no error).`,
    );
  }
  if (snap.drafts.length > 0) {
    errors.push(
      `Draft copies exist (${snap.drafts.join(", ")}) — publish or discard them first, a draft would be published over this write.`,
    );
  }
  return errors;
}
