import { MatchStripSlot } from "@/components/layout/MatchStrip";

/**
 * Mounts `<MatchStripSlot />` above the team page. A same-segment layout sits
 * outside the sibling `loading.tsx`, so the strip stays on screen with its
 * real data while the page loads, instead of a stand-in guessing its height
 * (#3027). Lives in `(detail)`, not `ploegen/[slug]/layout.tsx`, so the
 * `wedstrijden` sibling stays strip-less; the existence check stays one level
 * up, where it covers both.
 */
export default function TeamDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MatchStripSlot />
      {children}
    </>
  );
}
