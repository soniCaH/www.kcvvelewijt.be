"use client";

/**
 * useMatchTravel — the source side of a tapped fixture row growing into the
 * match hero (#3397, decided in #2501). Used by `<MatchTravelLink>` only.
 *
 * React names an element for the browser's view transition only while a
 * `<ViewTransition name>` boundary around it takes part in a navigation, and
 * a boundary whose class is `none` takes no part: it names nothing and starts
 * no transition. The hero (`<MatchHero>`'s `FullHero`) and the tapped row both
 * opt in on `share` only, under the same name, so a transition starts only
 * when a tapped row meets the hero of its own match. Every other way into or
 * out of a match page is the plain cut.
 *
 * A row opts in only while it is THE tapped row — decided on click, never at
 * render. Two equal names make the browser skip the transition, and the same
 * match can sit in the match strip and in a list at once, so the tapped row is
 * keyed by its own instance (`useId`), never by the match.
 *
 * The tapped key is dropped once the navigation commits (the pathname
 * changes), so nothing outlives the tap it belongs to. There is no reverse
 * travel on back: measured on a production build, React starts no view
 * transition for a browser back/forward (`popstate`).
 *
 * `transition` is `{ default: "none" }` when:
 *  - nothing was tapped, or another row was,
 *  - the row's match is already the page (`/wedstrijd/<id>`): its hero holds
 *    the name (the strip is mounted there too),
 *  - the visitor asked for reduced motion: the tap is never recorded,
 *  - rendering on the server or hydrating: the key lives in client state only,
 *    so no name is set at render.
 */

import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ComponentProps,
  type ViewTransition,
} from "react";
import { usePathname } from "next/navigation";
import { MATCH_TRAVEL_CLASS, matchTravelName } from "@/lib/utils/match-travel";

let tappedKey: string | null = null;
const listeners = new Set<() => void>();

function setTapped(next: string | null) {
  if (next === tappedKey) return;
  tappedKey = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMatchTravel(matchId: number | string): {
  transition: ComponentProps<typeof ViewTransition>;
  onClick: () => void;
} {
  const key = useId();
  const pathname = usePathname();
  const tapped = useSyncExternalStore(
    subscribe,
    () => tappedKey === key,
    () => false,
  );

  // The navigation committed (link, `router.push`, back/forward): the tap is
  // spent. Skips the first run, so a row mounting mid-flight does not clear it.
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    setTapped(null);
  }, [pathname]);

  const named = tapped && pathname !== `/wedstrijd/${matchId}`;

  return {
    transition: named
      ? {
          name: matchTravelName(matchId),
          default: "none",
          share: MATCH_TRAVEL_CLASS,
        }
      : { default: "none" },
    onClick: () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setTapped(key);
    },
  };
}
