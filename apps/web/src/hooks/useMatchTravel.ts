"use client";

/**
 * useMatchTravel — the source side of a tapped fixture row growing into the
 * match hero (#3397, decided in #2501). Used by `<MatchTravelLink>` only.
 *
 * React names an element for the browser's view transition only while a
 * `<ViewTransition name>` boundary around it is part of a navigation. The hero
 * (`<MatchHero>`'s `FullHero`) always carries `MATCH_TRAVEL_NAME`; a source row
 * carries it only while it is THE tapped row — decided on click, never at
 * render. Two equal names make the browser skip the transition, and the same
 * match can sit in the match strip and in a list at once, so the tapped row is
 * keyed by its own instance (`useId`), never by the match.
 *
 * The tapped key stays set after the navigation, so a row that is still on the
 * page (the strip lives in the layout) is named again when the visitor comes
 * back, ready for a reversed travel. Measured on a production build: React
 * starts no view transition for a browser back/forward (`popstate`), so that
 * reverse travel does not run today. Tapping any other link drops the key (a
 * stale name would pair the old row with an unrelated hero).
 *
 * `transition` is `{ default: "none" }` (the boundary opts out of every
 * animation and takes no name) when:
 *  - nothing was tapped, or another row was,
 *  - the page is a `/wedstrijd/…` page: its hero holds the name already (the
 *    strip is mounted there too),
 *  - the visitor asked for reduced motion: the tap is never recorded, the page
 *    cuts,
 *  - rendering on the server or hydrating: the key lives in client state only,
 *    so server HTML is unchanged.
 */

import {
  useId,
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

/** Capture phase: runs before the tapped row's own `onClick` sets its key. */
function dropOnLinkClick(event: MouseEvent) {
  if ((event.target as Element | null)?.closest?.("a")) setTapped(null);
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    document.addEventListener("click", dropOnLinkClick, true);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      document.removeEventListener("click", dropOnLinkClick, true);
    }
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

  const named = tapped && pathname !== `/wedstrijd/${matchId}`;

  return {
    transition: named
      ? {
          name: matchTravelName(matchId),
          default: MATCH_TRAVEL_CLASS,
          update: "none",
        }
      : { default: "none" },
    onClick: () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setTapped(key);
    },
  };
}
