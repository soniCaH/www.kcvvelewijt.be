/**
 * `decodeURIComponent` that never throws: a stray `%` in a URL hash (`#100%`,
 * `#%E0`) is not an escape, so the raw string is kept. Plain module, no
 * `"use client"`: server and client code both import it.
 */
export function safeDecodeURIComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
