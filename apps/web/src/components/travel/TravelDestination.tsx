import { ViewTransition, type ReactNode } from "react";
import { TRAVEL_CLASS, travelName, type TravelKind } from "@/lib/utils/travel";

/**
 * The detail end of a list item growing into its detail page (#3397, #3405):
 * the element a tapped source (`<TravelScope>`) lands on. Opts in on `share`
 * only, so it takes part when a tapped source of the same record is the other
 * end and never on a plain arrival, a leave or a live refresh. No `id`
 * (stories, previews): nothing to pair with, the children render bare.
 *
 * A server component: the detail pages are, and the name is the record's, not
 * the visitor's tap.
 */
export function TravelDestination({
  kind,
  id,
  children,
}: {
  kind: TravelKind;
  id: number | string | undefined;
  children: ReactNode;
}) {
  if (id === undefined) return <>{children}</>;
  return (
    <ViewTransition
      name={travelName(kind, id)}
      default="none"
      share={TRAVEL_CLASS}
    >
      {children}
    </ViewTransition>
  );
}
