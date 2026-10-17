/**
 * Shared check for editor-entered link fields (#3478). A link is one of:
 * a root-relative path (`/jeugd/visie`), an anchor (`#top`), `http(s)://…`,
 * `mailto:` or `tel:`.
 *
 * It rejects a scheme-less host (`www.example.be` would resolve as a broken
 * relative link) and both protocol-relative spellings: `//evil.com` and
 * `/\evil.com`, which browsers read as `//evil.com` and follow as an open
 * redirect. Keep each field's own `.uri()` next to this: `.uri()` narrows the
 * allowed schemes per field (some stay http/https only); this adds the shape
 * check `.uri({allowRelative: true})` lets through. Empty passes, so
 * `.required()` stays the field's own call.
 */
const LINK_PATTERN = /^(\/(?![/\\])|#|https?:\/\/|mailto:|tel:)/i

export function validateLink(value: unknown): true | string {
  if (typeof value !== 'string' || value.length === 0) return true
  return LINK_PATTERN.test(value)
    ? true
    : 'Gebruik een link die begint met https://, een pad dat begint met "/" (bijv. /jeugd/visie), een anker (#), mailto: of tel:.'
}
