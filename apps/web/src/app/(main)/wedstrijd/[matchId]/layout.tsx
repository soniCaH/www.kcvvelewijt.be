import { notFound } from "next/navigation";
import { MatchStripSlot } from "@/components/layout/MatchStrip";
import { fetchMatchOrNotFound } from "./page";

interface MatchLayoutProps {
  children: React.ReactNode;
  params: Promise<{ matchId: string }>;
}

/**
 * Same-segment layout — the existence check that gets a real `404` instead
 * of a soft one (#2968). See `(main)/spelers/[slug]/layout.tsx` for the full
 * mechanism doc.
 *
 * `fetchMatchOrNotFound` already converts the BFF's `HttpNotFound` tag into
 * `notFound()` internally (`Effect.catchTag`), and #3034 fixed that call to
 * survive `ManagedRuntime.runPromise` with `notFound()`'s own digest intact
 * — so awaiting it here, in the shell, is what actually gets the 404 onto
 * the wire; the page's later `await` of the same `cache()`-memoized promise
 * only re-observes it. A non-numeric `matchId` never reaches the BFF at all.
 *
 * It also mounts `<MatchStripSlot />` above the page, for the same reason
 * the check lives here: this layout sits outside the sibling `loading.tsx`,
 * so the strip stays on screen with its real data while the page loads,
 * instead of a stand-in guessing its height (#3027).
 */
export default async function MatchLayout({
  children,
  params,
}: MatchLayoutProps) {
  const { matchId } = await params;
  const numericId = parseInt(matchId, 10);
  if (isNaN(numericId)) notFound();

  await fetchMatchOrNotFound(numericId);
  return (
    <>
      <MatchStripSlot />
      {children}
    </>
  );
}
