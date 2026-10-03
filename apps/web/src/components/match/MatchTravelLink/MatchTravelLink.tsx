"use client";

/**
 * MatchTravelLink — the `<Link>` of a fixture row that opens `/wedstrijd/<id>`,
 * and the source end of the shared-element travel into the match hero (#3397,
 * decided in #2501). `<CalendarAgenda>`, `<TeamAgendaRow>`,
 * `<MatchStripView>`'s phone ledger and `<UpcomingMatchesClient>` use it in
 * place of `<Link>`. The row itself is what travels, so the link is its own
 * target; the logic lives in `<TravelScope>` and friends (`@/components/travel`).
 */

import type { ComponentProps } from "react";
import type Link from "next/link";
import { TravelLink, TravelScope, TravelTarget } from "@/components/travel";

export interface MatchTravelLinkProps extends Omit<
  ComponentProps<typeof Link>,
  "href"
> {
  matchId: number | string;
}

export function MatchTravelLink({ matchId, ...props }: MatchTravelLinkProps) {
  const href = `/wedstrijd/${matchId}`;
  return (
    <TravelScope kind="match" id={matchId} href={href}>
      <TravelTarget>
        <TravelLink {...props} href={href} />
      </TravelTarget>
    </TravelScope>
  );
}
