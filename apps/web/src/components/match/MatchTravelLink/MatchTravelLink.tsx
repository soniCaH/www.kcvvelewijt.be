"use client";

/**
 * MatchTravelLink — the `<Link>` of a fixture row that opens `/wedstrijd/<id>`,
 * and the source end of the shared-element travel into the match hero (#3397,
 * decided in #2501). `<CalendarAgenda>`, `<TeamAgendaRow>` and
 * `<MatchStripView>` use it in place of `<Link>`; the transition logic lives
 * here once (and in `useMatchTravel`).
 *
 * The `<ViewTransition>` is always mounted around the link (a boundary that
 * appears on click would remount the `<Link>` and drop `<LinkPendingDots>`'s
 * pending state); `useMatchTravel` decides whether it names the link.
 */

import { ViewTransition } from "react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useMatchTravel } from "@/hooks/useMatchTravel";

export interface MatchTravelLinkProps extends Omit<
  ComponentProps<typeof Link>,
  "href"
> {
  matchId: number | string;
}

export function MatchTravelLink({
  matchId,
  onClick,
  ...props
}: MatchTravelLinkProps) {
  const travel = useMatchTravel(matchId);
  return (
    <ViewTransition {...travel.transition}>
      <Link
        {...props}
        href={`/wedstrijd/${matchId}`}
        onClick={(event) => {
          travel.onClick();
          onClick?.(event);
        }}
      />
    </ViewTransition>
  );
}
