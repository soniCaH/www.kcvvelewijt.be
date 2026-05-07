/**
 * (main) route group — detail-page surfaces. The match strip is intentionally
 * absent here per Phase 3 Checkpoint C spec
 * (`docs/design/mockups/phase-3-c-header-and-matchstrip/matchstrip-locked.md`).
 * Landing pages (homepage + section indexes) live under (landing) which mounts
 * `<MatchStrip />` in its own layout.
 */
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
