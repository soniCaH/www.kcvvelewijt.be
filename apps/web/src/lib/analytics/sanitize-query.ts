const MAX_QUERY_LENGTH = 50;
const REDACTED = "[redacted]";

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
// 9+ digits with spaces, dots, dashes or slashes between them and an optional
// leading `+`. 9, not 8, so a date like `05/10/2026` (8 digits) passes.
const PHONE = /\+?\d(?:[\s.\-/]*\d){8,}/g;

/**
 * Redact email addresses and phone-shaped digit runs, then lowercase and
 * truncate, for privacy-safe analytics of user-typed search input. Redaction
 * runs FIRST so the 50-character cut can never leave half a phone number.
 *
 * Names are not detected: a first name still passes through.
 */
export function sanitizeQuery(query: string): string {
  return query
    .replace(EMAIL, REDACTED)
    .replace(PHONE, REDACTED)
    .toLowerCase()
    .slice(0, MAX_QUERY_LENGTH);
}
