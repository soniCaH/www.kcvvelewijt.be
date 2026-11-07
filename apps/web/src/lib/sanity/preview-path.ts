/**
 * A redirect target that stays on this site: a path with a leading single
 * `/`, returned as `pathname + search + hash`. `null` for anything else —
 * absolute URLs, `//evil.example`, `/\evil.example` (WHATWG treats `\` as
 * `/`), a bare `nieuws/x`. Parsing against a throwaway origin and requiring it
 * to survive is what catches every host-switching spelling at once.
 */
export const toSamePath = (raw: string | null): string | null => {
  if (!raw?.startsWith("/")) return null;
  try {
    const base = "http://same-origin.invalid";
    const url = new URL(raw, base);
    return url.origin === base
      ? `${url.pathname}${url.search}${url.hash}`
      : null;
  } catch {
    return null;
  }
};
