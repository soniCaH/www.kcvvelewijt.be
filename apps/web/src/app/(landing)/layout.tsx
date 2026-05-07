import { MatchStripSlot } from "@/components/layout/MatchStrip";

/**
 * (landing) route group — homepage + section index pages. Mounts the shared
 * `<MatchStripSlot />` once per Phase 3 Checkpoint C spec
 * (`docs/design/mockups/phase-3-c-header-and-matchstrip/matchstrip-locked.md`).
 * Detail-page surfaces live under (main) which omits the strip.
 */
export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <MatchStripSlot />
      {children}
    </>
  );
}
