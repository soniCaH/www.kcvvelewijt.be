/**
 * Shared, non-hook primitives behind `useRouterFilterParam` /
 * `useHistoryFilterParam` (#2779, split per #2783 review finding 2).
 *
 * These used to live inside one `useFilterParam` hook whose `writeVia`
 * option picked between calling `useSearchParams()`/`useRouter()` or not —
 * safe only while every caller passed a compile-time literal, which nothing
 * enforced, and which needed `eslint-disable-next-line
 * react-hooks/rules-of-hooks` on both conditional calls to get past a lint
 * rule that exists specifically to catch a caller getting this wrong.
 * Splitting into two hooks over these plain functions means each hook calls
 * only the navigation hooks it needs, unconditionally — zero eslint-disables,
 * and picking the wrong mode is a static import choice, not a runtime option
 * whose safety rested on a comment.
 *
 * `writeHistoryFilterParam` is also exported standalone for a caller whose
 * own async orchestration already owns the read side and only needs the
 * write (`NewsListingClient`'s `applyCategory`, #2779) — it was never safe
 * to route that caller through `useHistoryFilterParam`'s own read/mount/
 * popstate machinery for a value nothing renders with (#2783 review
 * finding 5).
 */

/** Narrows `raw` against `values`, falling back to `fallback` on `null` or
 *  any value `values` doesn't recognise — the `isX(value): value is X` type
 *  guard every filter-URL call site in this codebase used to hand-roll once
 *  each. Exported so a caller with its own narrow-or-fallback shape for a
 *  facet these hooks don't own can reuse it instead of reinventing it
 *  (#2783 review finding 9). */
export function narrowParam<T extends string>(
  raw: string | null,
  values: readonly T[],
  fallback: T,
): T {
  return raw !== null && (values as readonly string[]).includes(raw)
    ? (raw as T)
    : fallback;
}

/** Reads one `?<name>=` value from the LIVE `window.location.search` —
 *  history mode's own canonical read source. There is no `useSearchParams()`
 *  subscription to prefer instead here (that's the whole reason history
 *  mode exists — see `useHistoryFilterParam`'s docblock), so this is safe in
 *  a way the equivalent read is not in router mode (#2783 review finding 1). */
export function readParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

export type SetFilterParam<T extends string> = (
  next: T,
  overrides?: { hash?: string; replace?: boolean },
) => void;

/**
 * The pure "history" write: delete-on-default, a live
 * `window.location.search` merge, then `pushState` (or `replaceState` when
 * `options.replace` is set — #2783 review finding 3, previously silently
 * ignored in history mode). Passing the current `window.history.state` (not
 * `{}`) keeps Next's internal `__NA` marker, so its own patched
 * push/replaceState still treats this as an internal write rather than a
 * fresh navigation to re-process — same precedent as
 * `lib/utils/same-page-anchor.ts`.
 */
export function writeHistoryFilterParam<T extends string>(
  name: string,
  next: T,
  fallback: T,
  options: { route: string; hash?: string; replace?: boolean },
): void {
  const params = new URLSearchParams(window.location.search);
  if (next === fallback) params.delete(name);
  else params.set(name, next);
  const qs = params.toString();
  const path = `${options.route}${qs ? `?${qs}` : ""}${options.hash ? `#${options.hash}` : ""}`;
  const historyMethod = options.replace
    ? window.history.replaceState
    : window.history.pushState;
  historyMethod.call(window.history, window.history.state, "", path);
}
