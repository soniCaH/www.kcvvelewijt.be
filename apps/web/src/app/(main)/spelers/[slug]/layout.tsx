import { notFound } from "next/navigation";
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
 * untouched — the skeleton still shows on a slow read, it just no longer
 * decides the status code.
 *
 * `fetchPlayerOrNull` is wrapped in React `cache()`, so this call, the
 * page's own `generateMetadata`, and `PlayerPage` itself share one read per
 * request instead of three.
 */
export default async function PlayerLayout({
  children,
  params,
}: PlayerLayoutProps) {
  const { slug } = await params;
  const player = await fetchPlayerOrNull(slug);
  if (!player) notFound();
  return children;
}
