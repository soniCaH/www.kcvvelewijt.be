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
 * - `<TravelScope>` owns the tap state of one source. It is told the one
 *   `href` the source opens and reads kind + id off it: an href that is not
 *   that kind's detail route (a listing, a staff page) makes the scope inert.
 * - `<TravelLink>` is the `<Link>` to that `href` and records the tap.
 * - `<TravelTarget>` wraps the element that travels, the PHOTO and nothing
 *   around it (no badge, overlay, tape or text), in the `<ViewTransition>` the
 *   tap names.
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

// Next reads `transitionTypes` once per click, from the props of the render
// that last ran, so state cannot carry "this click recorded a tap" into it.
// The list is filled in the click handler instead (which runs first): the
// consumer's types, plus `travel` (the type `globals.css` keys the page cut on)
// only when this click recorded a tap. One list serves every link: it is
// rebuilt on each click and read synchronously by the same click.
const clickTypes: string[] = [];

const TravelContext = createContext<{
  href: string | undefined;
  travel: Travel;
} | null>(null);

export function TravelScope({
  kind,
  href,
  children,
}: {
  /** The kind of detail page this source may open; absent: never travels. */
  kind?: TravelKind;
  /** Where the source goes. Absent: a card without a link. */
  href: string | undefined;
  children: ReactNode;
}) {
  const travel = useTravel(kind, href);
  return <TravelContext value={{ href, travel }}>{children}</TravelContext>;
}

export function TravelTarget({ children }: { children: ReactNode }) {
  const scope = useContext(TravelContext);
  return (
    <ViewTransition {...(scope?.travel.transition ?? { default: "none" })}>
      {children}
    </ViewTransition>
  );
}

export function TravelLink({
  onClick,
  transitionTypes,
  ...props
}: Omit<ComponentProps<typeof Link>, "href">) {
  const scope = useContext(TravelContext);
  if (scope?.href === undefined) {
    throw new Error("<TravelLink> needs a <TravelScope> with an href");
  }
  return (
    <Link
      {...props}
      href={scope.href}
      transitionTypes={clickTypes}
      onClick={(event) => {
        onClick?.(event);
        clickTypes.length = 0;
        clickTypes.push(...(transitionTypes ?? []));
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
        if (scope.travel.onClick()) clickTypes.push(TRAVEL_CLASS);
      }}
    />
  );
}
