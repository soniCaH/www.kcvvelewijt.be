const MAX_QUERY_LENGTH = 50;

/** Truncate + lowercase for privacy-safe analytics — strips PII from user-generated search input */
export function sanitizeQuery(query: string): string {
  return query.toLowerCase().slice(0, MAX_QUERY_LENGTH);
}
