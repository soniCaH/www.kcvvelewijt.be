import sanitizeHtml from "sanitize-html";
import { HtmlTableView } from "./HtmlTableView";

const TABLE_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
    "colgroup",
    "col",
    "strong",
    "a",
  ],
  // `class` is deliberately absent here (from both `*` and `a`) — stored
  // HTML can never populate it, full stop. `.prose-link` is spliced onto
  // the *sanitized* output afterward by `addProseLinkClassToAnchors`
  // below, never accepted as input.
  allowedAttributes: {
    "*": ["colspan", "rowspan", "scope"],
    a: ["href", "target", "rel"],
  },
  // Default `allowedSchemes` is left untouched — it already blocks
  // `javascript:` on `href`. Hand-rolling a scheme guard here would be
  // invisible to CodeQL, which recognises the library's own barrier but
  // not a bespoke one (#2482).
  transformTags: {
    // `target`/`rel` aren't scheme-checked (`naughtyHref` only runs against
    // `href`), so unlike `href` they're final by the time this hook sees
    // them — safe to decide here. Force `rel="noopener noreferrer"` on
    // *any* `target`, not just an exact `target="_blank"`: a case-varied
    // `target="_BLANK"` or a named target (`target="foo"`) both open a new
    // browsing context with a live `window.opener` back-reference, and a
    // strict `=== "_blank"` check let both slip through with no `rel` at
    // all (review finding #2482). 53 Facebook permalinks carry `target`
    // today and none carries `rel`; drop any authored `rel` on an anchor
    // with no `target` so nothing un-vetted survives.
    a: (tagName, attribs) => {
      const nextAttribs: Record<string, string> = { ...attribs };
      if (nextAttribs.target) {
        nextAttribs.rel = "noopener noreferrer";
      } else {
        delete nextAttribs.rel;
      }
      return { tagName, attribs: nextAttribs };
    },
  },
};

const SANITIZED_ANCHOR_OPEN_TAG_RE = /<a\b([^>]*)>/gi;

/**
 * Adds `.prose-link` to every anchor that still carries an `href` **after**
 * `sanitizeHtml` has already run — never before, and never as a scheme
 * check of our own. `transformTags.a` above runs *before*
 * `allowedSchemes` strips a disallowed `href` (e.g. `javascript:…`), so
 * deciding the class inside that hook would see the href that is about to
 * be removed, not the href that survives — the exact bug this function
 * fixes (#2482 review). Operating on sanitize-html's own output instead
 * means this only ever has to ask "does the tag that came out the other
 * end still have an `href`", never "is this href's scheme allowed" — the
 * library already answered that. A `<a>` with no surviving `href` (a
 * stripped `javascript:` scheme, or a legacy `<a name="…">` that never had
 * one) is left as a bare, unstyled `<a>` rather than dressed up as a live
 * link that goes nowhere.
 */
function addProseLinkClassToAnchors(sanitizedHtml: string): string {
  return sanitizedHtml.replace(
    SANITIZED_ANCHOR_OPEN_TAG_RE,
    (tag, attrs: string) => {
      if (!/(?:^|\s)href="/.test(attrs)) return tag;
      return `<a class="prose-link"${attrs}>`;
    },
  );
}

export interface HtmlTableBlockProps {
  /** Raw HTML — sanitized through `TABLE_SANITIZE_OPTIONS` before render. */
  html: string;
  className?: string;
}

/**
 * <HtmlTableBlock> — sanitizes authored table HTML on the server, then hands
 * it to `<HtmlTableView>` (the quiet skin lives there; see its docblock).
 * Not a client component (#3480): `sanitize-html`, `postcss` and
 * `htmlparser2` stay out of the browser bundle, and the HTML is sanitized
 * once instead of again during hydration. `<HtmlTableView>` is a separate
 * file so `<ContactPage>` (a client component) can render its static table
 * without importing the sanitizer.
 */
export function HtmlTableBlock({ html, className }: HtmlTableBlockProps) {
  const trimmed = typeof html === "string" ? html.trim() : "";
  if (trimmed.length === 0) return null;

  return (
    <HtmlTableView
      trustedHtml={addProseLinkClassToAnchors(
        sanitizeHtml(trimmed, TABLE_SANITIZE_OPTIONS),
      )}
      className={className}
    />
  );
}
