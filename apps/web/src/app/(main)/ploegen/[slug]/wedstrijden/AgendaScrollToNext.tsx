"use client";

import { useEffect } from "react";
import { scrollIntoViewMotionSafe } from "@/lib/utils/scroll-into-view";

interface AgendaScrollToNextProps {
  /** data-next-match attribute value to find in the DOM */
  nextMatchId: number | null;
}

/**
 * Invisible client component that auto-scrolls to the next match on mount.
 * Runs only when nextMatchId is non-null. Respects prefers-reduced-motion.
 */
export function AgendaScrollToNext({ nextMatchId }: AgendaScrollToNextProps) {
  useEffect(() => {
    if (nextMatchId === null) return;
    const anchor = document.querySelector(`[data-match-id="${nextMatchId}"]`);
    if (!anchor) return;
    scrollIntoViewMotionSafe(anchor, { block: "center" });
  }, [nextMatchId]);

  return null;
}
