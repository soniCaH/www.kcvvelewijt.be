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
 *
 * Whitespace and control characters are rejected anywhere: browsers strip
 * tab, CR and LF from a URL, so `/<TAB>/evil.com` would become `//evil.com`.
 * The message names no scheme list: some fields narrow `.uri()` to http/https,
 * and one field must never tell the editor `mailto:` is fine while `.uri()`
 * rejects it.
 */
const hasUnsafeChar = (value: string): boolean =>
  /\s/.test(value) || [...value].some((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127)

const LINK_PATTERN = /^(\/(?![/\\])|#|https?:\/\/|mailto:|tel:)/i

export function validateLink(value: unknown): true | string {
  if (typeof value !== 'string' || value.length === 0) return true
  return LINK_PATTERN.test(value) && !hasUnsafeChar(value)
    ? true
    : 'Dit is geen geldige link. Gebruik een volledige link (https://…) of een pad dat met "/" begint (bijv. /jeugd/visie), zonder spaties.'
}
