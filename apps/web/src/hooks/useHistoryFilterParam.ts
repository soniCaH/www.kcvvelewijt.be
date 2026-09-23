"use client";

import { useCallback, useEffect, useState } from "react";
import {
  narrowParam,
  readParam,
  writeHistoryFilterParam,
  type SetFilterParam,
} from "./filterParam";

export interface UseHistoryFilterParamOptions<T extends string> {
  /** The value that means "no filter" — deleted from the querystring rather
   *  than round-tripped as an explicit param, and this hook's return value
   *  whenever the param is absent or fails to narrow against `values`. */
  fallback: T;
  /** Pathname this hook reads/writes, e.g. `"/evenementen"`. */
  route: string;
  /** Hash appended on every write, unless a call to the setter overrides it. */
  hash?: string;
}

/**
 * `useHistoryFilterParam` — one `[value, setValue]` pair for a single-select
 * filter chip row whose active facet lives in a `?<name>=` URL param,
 * written via `window.history.pushState` + a `popstate` listener instead of
 * the router (#2779, split from `useFilterParam` per #2783 review finding 2).
 *
 * Never calls `useSearchParams()` — merely calling that hook, whether or not
 * its value is read, opts the WHOLE subtree into client-side rendering,
 * throwing away prerendered HTML for every visitor (#2564 finding 1). This
 * is the mode a static/ISR route that must stay prerendered needs
 * (`/evenementen`, `/hulp`); a route that already accepts `useSearchParams()`'s cost
 * for this facet should use `useRouterFilterParam` instead, which is simpler
 * (no local state at all) precisely because `useSearchParams()` already
 * does the reactive tracking this hook has to do by hand.
 *
 * `value` is local state, seeded once on mount from the live URL (a
 * one-time deep-link restore that costs one extra render only for a visitor
 * who arrives on one, never for anyone else — the seed is a no-op guard, not
 * an unconditional write) and re-synced whenever the URL moves under it
 * (back/forward, or a same-route `<Link>`).
 *
 * A caller whose own async orchestration already owns the read side (e.g.
 * `NewsListingClient`'s fetch-then-write `applyCategory`) should call
 * `writeHistoryFilterParam` directly instead of this hook — routing a
 * discarded read through this hook's state/mount effect/`popstate` listener
 * for a value nothing renders with was exactly the redundant-work bug
 * #2783's review flagged (finding 5).
 */
export function useHistoryFilterParam<T extends string>(
  name: string,
  values: readonly T[],
  options: UseHistoryFilterParamOptions<T>,
): [T, SetFilterParam<T>] {
  const { fallback, route, hash } = options;
  const [value, setLocalValue] = useState<T>(fallback);

  // Deep-link restore on first mount: a one-time read of the URL (an
  // external system). Only writes when the URL actually implies a
  // non-default facet — re-seeding the same `fallback` this state already
  // holds would be a no-op React bails on anyway, but the guard also keeps
  // this hook's own claim true: a visitor who did NOT arrive on a deep link
  // costs nothing beyond the initial render (#2783 review finding 8).
  useEffect(() => {
    const fromUrl = narrowParam(readParam(name), values, fallback);
    if (fromUrl !== fallback) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time URL deep-link seed, not a sync loop
      setLocalValue(fromUrl);
    }
    // Run once on mount — the initial URL is the only deep-link source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-read the URL, WITHOUT writing it again, whenever it moves under us:
  // browser back/forward (`popstate`), and a Next `<Link>` to this same route
  // (the header's "Hulp" while already on `/hulp?categorie=…`). Next keeps the
  // page mounted for that one and fires no `popstate`, so only the Navigation
  // API's `currententrychange` sees it; where that API is missing, the facet
  // stays stale until the next write, as it did before.
  useEffect(() => {
    const resync = () => {
      setLocalValue(narrowParam(readParam(name), values, fallback));
    };
    window.addEventListener("popstate", resync);
    window.navigation?.addEventListener("currententrychange", resync);
    return () => {
      window.removeEventListener("popstate", resync);
      window.navigation?.removeEventListener("currententrychange", resync);
    };
  }, [name, values, fallback]);

  const setValue = useCallback<SetFilterParam<T>>(
    (next, overrides) => {
      if (next === value) return; // dedup guard
      setLocalValue(next);
      writeHistoryFilterParam(name, next, fallback, {
        route,
        hash: overrides?.hash ?? hash,
        replace: overrides?.replace,
      });
    },
    [value, name, fallback, route, hash],
  );

  return [value, setValue];
}
