/**
 * (main) route group — detail-page surfaces. The match strip is intentionally
 * absent from *this layout* per Phase 3 Checkpoint C spec
 * (`docs/design/mockups/phase-3-c-header-and-matchstrip/matchstrip-locked.md`).
 * Landing pages (homepage + section indexes) live under (landing) which mounts
 * `<MatchStripSlot />` in its own layout.
 *
 * It is not absent from the *group*: `/ploegen/[slug]`, `/wedstrijd/[matchId]`
 * and `/spelers/[slug]` each mount the slot from their own segment layout
 * (#3027). Any read the strip performs therefore co-renders with those pages — which is why their team-feed reads go
 * through `getTeamMatches` rather than `bff.getMatches` (#2441).
 */
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
