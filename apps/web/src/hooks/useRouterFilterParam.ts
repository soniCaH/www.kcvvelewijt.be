"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { narrowParam } from "./filterParam";

export interface UseRouterFilterParamOptions<T extends string> {
  /** The value that means "no filter" — deleted from the querystring rather
   *  than round-tripped as an explicit param, and this hook's return value
   *  whenever the param is absent or fails to narrow against `values`. */
  fallback: T;
  /** Pathname this hook reads/writes, e.g. `"/kalender"`. */
  route: string;
}

/**
 * `useRouterFilterParam` — one `[value, setValue]` pair for a single-select
 * filter chip row whose active facet lives in a `?<name>=` URL param, driven
 * by `next/navigation`'s router (#2779, split from `useFilterParam` per
 * #2783 review finding 2).
 *
 * `value` is a pure, stateless derivation of `useSearchParams()` — already
 * reactive to `router.push`/`replace` and browser back/forward, so this
 * needs no local state, no mount effect, no `popstate` listener. Only
 * correct on a route that already accepts calling `useSearchParams()` for
 * this facet: wrapped in its own local `<Suspense>`, or
 * `force-dynamic` (`/kalender`, where it resolves during the per-request
 * server render with no bailout and no `<Suspense>` needed at all). A
 * static/ISR route that must stay prerendered needs `useHistoryFilterParam`
 * instead — merely calling `useSearchParams()`, whether or not the result is
 * used, opts the whole subtree into client-side rendering.
 *
 * **Two different questions, two different correct sources (#2783 review,
 * round 1 finding 1 + round 2).** `value` — and the setter's dedup guard,
 * which compares against `value` — comes from `useSearchParams()`: the
 * source that's actually reactive to `router.push`/`replace` and browser
 * back/forward, so the guard stays consistent with what the hook just
 * rendered. The setter's merge base for building the NEXT url is the live
 * `window.location.search` instead: `useSearchParams()` cannot see a param
 * written via a raw `history.replaceState` outside Next's router (e.g. a
 * panel's `?member=` deep-link on the same route) — merging from
 * `useSearchParams()` would silently drop it from every filter write for as
 * long as that panel stayed open. The live URL has the opposite gap:
 * it cannot see a `router.push` this hook itself already issued but that
 * hasn't landed yet, so merging from it risks reverting an in-flight write
 * to a sibling param on the SAME route (e.g. `/kalender`'s `?view=` versus
 * `?type=`, both driven by `CalendarWidget`) — a narrow, same-widget race,
 * and exactly what this write already did on `main` before #2779. Losing
 * `?member=` deterministically for the panel's entire open duration is
 * strictly worse than that race, so this hook accepts the race and keeps
 * the live-URL merge.
 */
export function useRouterFilterParam<T extends string>(
  name: string,
  values: readonly T[],
  options: UseRouterFilterParamOptions<T>,
): [T, (next: T) => void] {
  const { fallback, route } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = narrowParam(searchParams.get(name), values, fallback);

  const setValue = useCallback(
    (next: T) => {
      if (next === value) return; // dedup guard — compares against the useSearchParams()-derived value above
      // Merge base is the LIVE window.location.search, not `searchParams` —
      // it's the only source that can see a param written via a raw
      // history.replaceState outside Next's router (see docblock).
      const params = new URLSearchParams(window.location.search);
      if (next === fallback) params.delete(name);
      else params.set(name, next);
      const qs = params.toString();
      router.push(`${route}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [value, fallback, name, route, router],
  );

  return [value, setValue];
}
