import { notFound } from "next/navigation";
import { MatchStripSlot } from "@/components/layout/MatchStrip";
import { fetchPlayerOrNull } from "./page";

interface PlayerLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Same-segment layout — the existence check that gets a real `404` instead
 * of a soft one (#2968).
 *
 * `loading.js` wraps `page.js` and nested `layout.js` files in a `<Suspense>`
 * boundary, but **not** the `layout.js` in its own segment (Next docs,
 * `node_modules/next/dist/docs/.../loading.md`). Running the check here puts
 * it in the render shell, before `page.tsx`'s sibling `loading.tsx` opens
 * that boundary and commits the response to `200`. `loading.tsx` itself is
 * untouched, and — on this route specifically — still has something to
 * cover: `PlayerPage` fetches related articles *after* this existence
 * check, so a slow related-articles read still shows the skeleton. That is
 * not true on every route this pattern was applied to — `/tegenstander`,
 * `/club/[slug]` and `/galerij/[slug]` have no read left after this same
 * check, so their skeletons are effectively retired. See the "Skeleton
 * trade-off" note in PR #3057's body for the full reasoning; not repeated
 * on every file.
 *
 * `fetchPlayerOrNull` is wrapped in React `cache()`, so this call, the
 * page's own `generateMetadata`, and `PlayerPage` itself share one read per
 * request instead of three.
 *
 * It also mounts `<MatchStripSlot />` above the page, for the same reason
 * the check lives here: this layout sits outside the sibling `loading.tsx`,
 * so the strip stays on screen with its real data while the page loads,
 * instead of a stand-in guessing its height (#3027).
 */
export default async function PlayerLayout({
  children,
  params,
}: PlayerLayoutProps) {
  const { slug } = await params;
  const player = await fetchPlayerOrNull(slug);
  if (!player) notFound();
  return (
    <>
      <MatchStripSlot />
      {children}
    </>
  );
}
