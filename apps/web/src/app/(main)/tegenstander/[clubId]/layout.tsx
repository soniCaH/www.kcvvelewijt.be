import { notFound } from "next/navigation";
import { fetchOpponentData } from "./page";

interface OpponentLayoutProps {
  children: React.ReactNode;
  params: Promise<{ clubId: string }>;
}

/**
 * Same-segment layout — the existence check that gets a real `404` instead
 * of a soft one (#2968). See `(main)/spelers/[slug]/layout.tsx` for the full
 * mechanism doc. Mirrors `page.tsx`'s own two-part not-found condition: a
 * non-numeric `clubId` never reaches `fetchOpponentData` at all, and a
 * numeric one that resolves no data (no senior squad, or the squad fan-out
 * came back empty) 404s the same way the page does.
 *
 * **Skeleton trade-off (recorded decision, PR #3057 body):**
 * `fetchOpponentData` already IS the page's entire read — one PSD
 * opponent-history call per senior squad — and `OpponentPage` only renders
 * from its result, so this segment's `loading.tsx` no longer has anything
 * to suspend on and is effectively retired for a server-rendered
 * navigation (it still fires on a prefetched client-side one). A cold
 * render now sends no bytes until every squad's history call returns,
 * which is unchanged work moved earlier — this route's 429 exposure to PSD
 * is identical to before, only *when* the response header leaves changes.
 * The file is kept, not deleted.
 */
export default async function OpponentLayout({
  children,
  params,
}: OpponentLayoutProps) {
  const { clubId: clubIdStr } = await params;
  const clubId = parseInt(clubIdStr, 10);
  if (isNaN(clubId)) notFound();

  const data = await fetchOpponentData(clubId);
  if (!data) notFound();
  return children;
}
