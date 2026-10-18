/**
 * Split a display value into the name rhythm: the first whitespace token is
 * the semibold "lead", the remainder is the italic "rest". A single-token value
 * has an empty rest and renders bold-only.
 */
export function splitDisplayName(value: string): {
  lead: string;
  rest: string;
} {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lead: "", rest: "" };
  const [lead, ...others] = parts;
  return { lead: lead ?? "", rest: others.join(" ") };
}
