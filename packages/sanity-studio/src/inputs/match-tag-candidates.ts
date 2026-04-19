/**
 * De-duplicate case-insensitively, preserving the first-seen casing of each tag.
 * Ignores non-string entries so a malformed Sanity response can't crash the UI.
 */
function normalizeCanonicalTags(canonicalTags: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const tag of canonicalTags) {
    if (typeof tag !== 'string') continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(tag)
  }
  return result
}

/**
 * Returns canonical tags whose lowercase value starts with the lowercase input,
 * sorted alphabetically. An empty (or whitespace-only) input returns all
 * canonical tags so the autocomplete can show the full list on focus.
 */
export function matchTagCandidates(
  input: string,
  canonicalTags: readonly string[],
): string[] {
  const trimmed = input.trim().toLowerCase()
  const unique = normalizeCanonicalTags(canonicalTags)
  const matches = trimmed === ''
    ? unique
    : unique.filter((tag) => tag.toLowerCase().startsWith(trimmed))
  return [...matches].sort((a, b) => a.localeCompare(b, 'nl-BE'))
}

/**
 * Maps a user-entered value to its canonical casing when an existing tag
 * matches case-insensitively. Otherwise returns the trimmed input unchanged
 * so editors can still create brand-new tags.
 */
export function canonicalizeTagInput(
  input: string,
  canonicalTags: readonly string[],
): string {
  const trimmed = input.trim()
  const needle = trimmed.toLowerCase()
  for (const tag of canonicalTags) {
    if (typeof tag !== 'string') continue
    if (tag.toLowerCase() === needle) return tag
  }
  return trimmed
}
