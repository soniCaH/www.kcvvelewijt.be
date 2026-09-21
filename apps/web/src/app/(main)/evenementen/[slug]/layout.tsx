import { notFound } from "next/navigation";
import { fetchEventOrNull } from "./page";

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
 * Mirrors `page.tsx`'s own not-found condition exactly: an event whose
 * `dateStart` was cleared in Studio renders `Invalid DateTime` downstream,
 * so it 404s here too, not only on a missing document.
 */
export default async function EventLayout({
  children,
  params,
}: EventLayoutProps) {
  const { slug } = await params;
  const event = await fetchEventOrNull(slug);
  if (!event || !event.dateStart) notFound();
  return children;
}
