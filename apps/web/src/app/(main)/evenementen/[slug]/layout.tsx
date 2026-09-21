import { notFound } from "next/navigation";
import { fetchEventOrNull, isEventNotFound } from "./page";

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Same-segment layout — the existence check that gets a real `404` instead
 * of a soft one (#2968). See `(main)/spelers/[slug]/layout.tsx` for the full
 * mechanism doc. `evenementen/(index)/` (the ticket-wall listing) is a
 * sibling route group, not an ancestor of this `[slug]` segment
 * (#2791/#3037), so there is no boundary above this layout.
 *
 * Calls `page.tsx`'s own `isEventNotFound` rather than repeating its
 * compound condition here — the two used to be two independent
 * `!event || !event.dateStart` copies, which is exactly the kind of
 * duplicate that can drift when one side is tightened later (#2968 review).
 */
export default async function EventLayout({
  children,
  params,
}: EventLayoutProps) {
  const { slug } = await params;
  const event = await fetchEventOrNull(slug);
  if (isEventNotFound(event)) notFound();
  return children;
}
