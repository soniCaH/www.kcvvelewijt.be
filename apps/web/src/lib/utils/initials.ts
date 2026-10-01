/**
 * The letters a round avatar sets when it has no photo (#3331, #3304).
 *
 * First + last token of the name when a full name is known; one letter when
 * only a first name is. Empty string when there is nothing to derive from —
 * the caller picks the fallback glyph.
 */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : "";
  return `${first}${last}`.toLocaleUpperCase("nl-BE");
}
