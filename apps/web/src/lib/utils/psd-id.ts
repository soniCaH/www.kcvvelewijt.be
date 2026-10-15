/**
 * A PSD id from a URL segment or query value: 1–9 plain digits, else `null`.
 *
 * Strict on purpose (#3486). `parseInt("123abc")` is `123`, so a loose parse
 * turns every junk suffix into a fresh ISR / `unstable_cache` entry for the
 * same id — and every fresh entry is a round of PSD calls. Nine digits keeps
 * the value well inside a 32-bit int.
 */
export function parsePsdId(raw: string): number | null {
  return /^\d{1,9}$/.test(raw) ? Number(raw) : null;
}
