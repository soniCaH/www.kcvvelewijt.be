const MAX_QUERY_LENGTH = 50;
// Bounds the regex work: the EMAIL pattern backtracks quadratically (~660 ms
// at 20 000 chars) and the query can arrive untruncated from `/zoeken?q=`.
// Far above MAX_QUERY_LENGTH, so redaction still sees everything that survives.
const MAX_SCAN_LENGTH = 256;
const REDACTED = "[redacted]";

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
// 9+ digits with spaces, dots, dashes, slashes or parentheses between them
// (`+32 (0)15 61 12 34`, `(015) 61 12 34`) and an optional leading `+` or `(`. 9, not 8, so a date like `05/10/2026` (8 digits) passes.
const PHONE = /[+(]?\d(?:[\s.\-/()]*\d){8,}/g;

/**
 * Redact email addresses and phone-shaped digit runs, then lowercase and
 * truncate, for privacy-safe analytics of user-typed search input. Redaction
 * runs FIRST so the 50-character cut can never leave half a phone number.
 *
 * Names are not detected: a first name still passes through.
 */
export function sanitizeQuery(query: string): string {
  return query
    .slice(0, MAX_SCAN_LENGTH)
    .replace(EMAIL, REDACTED)
    .replace(PHONE, REDACTED)
    .toLowerCase()
    .slice(0, MAX_QUERY_LENGTH);
}
