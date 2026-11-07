/**
 * A redirect target that stays on this site, as a URL resolved once against the
 * real request URL (#3619). `null` for anything else: absolute URLs,
 * `//evil.example`, `/\evil.example` (WHATWG treats `\` as `/`), a bare
 * `nieuws/x`. Redirect to the returned URL object itself: re-resolving its path
 * string would let dot segments such as `/.//evil.example` collapse to
 * `//evil.example` and switch host.
 */
export const toSameOriginUrl = (
  raw: string | null,
  requestUrl: URL,
): URL | null => {
  if (!raw?.startsWith("/")) return null;
  try {
    const resolved = new URL(raw, requestUrl);
    return resolved.origin === requestUrl.origin ? resolved : null;
  } catch {
    return null;
  }
};
