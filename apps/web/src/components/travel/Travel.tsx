"use client";

/**
 * The source side of a list item growing into its detail page (#3405,
 * generalising #3397's fixture row): a fixture row into the match hero, a news
 * card's cover into the article's cover, a squad card's photo into the player's.
 * The detail end is `<TravelDestination>`; the logic lives once, in
 * `useTravel`.
 *
 * Three pieces, because the tapped link and the element that travels are not
 * always the same node (a news card's link is an empty overlay beside its
 * photo):
 * - `<TravelScope>` owns the tap state of one source (kind + id + href) and
 *   offers it to the two below.
 * - `<TravelLink>` is the `<Link>` that records the tap.
 * - `<TravelTarget>` wraps the element that travels (the row itself, or the
 *   photo) in the `<ViewTransition>` the tap names.
 *
 * The `<ViewTransition>` is always mounted (a boundary that appears on click
 * would remount the `<Link>` and drop `<LinkPendingDots>`'s pending state);
 * `useTravel` decides whether it names the element.
 */

import {
  createContext,
  useContext,
  ViewTransition,
  type ComponentProps,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useTravel, type Travel } from "@/hooks/useTravel";
import { TRAVEL_CLASS, type TravelKind } from "@/lib/utils/travel";

const TravelContext = createContext<Travel | null>(null);

export function TravelScope({
  kind,
  id,
  href,
  children,
}: {
  kind: TravelKind;
  id: number | string;
  /** The detail page this source opens. */
  href: string;
  children: ReactNode;
}) {
  return (
    <TravelContext value={useTravel(kind, id, href)}>{children}</TravelContext>
  );
}

export function TravelTarget({ children }: { children: ReactNode }) {
  const travel = useContext(TravelContext);
  return (
    <ViewTransition {...(travel?.transition ?? { default: "none" })}>
      {children}
    </ViewTransition>
  );
}

export function TravelLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const travel = useContext(TravelContext);
  return (
    <Link
      {...props}
      // The transition type `globals.css` keys the page cut on. Harmless on a
      // navigation that starts no view transition.
      transitionTypes={[TRAVEL_CLASS]}
      onClick={(event) => {
        onClick?.(event);
        // Only a click `<Link>` will turn into a navigation is a tap: a
        // modified or non-primary click, or one the consumer cancelled, opens
        // nothing in this tab.
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        travel?.onClick();
      }}
    />
  );
}
