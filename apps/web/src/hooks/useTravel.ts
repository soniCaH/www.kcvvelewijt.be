"use client";

/**
 * useTravel — the source side of a tapped list item growing into its detail
 * page: a fixture row into the match hero (#3397, decided in #2501), a news
 * card's cover and a squad card's photo into the same photo on the detail
 * page (#3405, decided in #3400). Used by `<TravelScope>` only.
 *
 * React names an element for the browser's view transition only while a
 * `<ViewTransition name>` boundary around it takes part in a navigation, and
 * a boundary whose class is `none` takes no part: it names nothing and starts
 * no transition. The detail end (`<TravelDestination>`) and the tapped source
 * both opt in on `share` only, under the same name, so a transition starts
 * only when a tapped item meets the detail of its own record. Every other way
 * into or out of a detail page is the plain cut.
 *
 * A source opts in only while it is THE tapped one — decided on click, never at
 * render. Two equal names make the browser skip the transition, and the same
 * record can sit in the match strip and in a list at once, or in a news grid
 * and a related row, so the tapped source is keyed by its own instance
 * (`useId`), never by the record.
 *
 * The tapped key is dropped once the navigation commits (the pathname
 * changes), so nothing outlives the tap it belongs to. There is no reverse
 * travel on back: measured on a production build, React starts no view
 * transition for a browser back/forward (`popstate`), and #3406 decided back
 * stays a cut.
 *
 * `transition` is `{ default: "none" }` when:
 *  - nothing was tapped, or another source was,
 *  - the source's record is already the page (`href`): its detail holds the
 *    name (the strip is mounted there too),
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
import { TRAVEL_CLASS, travelName, type TravelKind } from "@/lib/utils/travel";

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

export interface Travel {
  transition: ComponentProps<typeof ViewTransition>;
  onClick: () => void;
}

/**
 * @param href The detail page the source opens: while it is the current page,
 *   the source takes no name (its detail end holds it).
 */
export function useTravel(
  kind: TravelKind,
  id: number | string,
  href: string,
): Travel {
  const key = useId();
  const pathname = usePathname();
  const tapped = useSyncExternalStore(
    subscribe,
    () => tappedKey === key,
    () => false,
  );

  // The navigation committed (link, `router.push`, back/forward): the tap is
  // spent. Skips the first run, so a source mounting mid-flight does not clear
  // it.
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    setTapped(null);
  }, [pathname]);

  const named = tapped && pathname !== href;

  return {
    transition: named
      ? {
          name: travelName(kind, id),
          default: "none",
          share: TRAVEL_CLASS,
        }
      : { default: "none" },
    onClick: () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setTapped(key);
    },
  };
}
