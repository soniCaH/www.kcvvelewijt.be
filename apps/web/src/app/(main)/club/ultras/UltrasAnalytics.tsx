"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useUltrasAnalytics } from "@/hooks/useUltrasAnalytics";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";

export interface UltrasAnalyticsProps {
  children: ReactNode;
}

/**
 * Client analytics shell for `/club/ultras`. Fires `ultras_view` once on mount
 * and delegates clicks on any `[data-ultras-join]` element (the hero stamp +
 * the "Lid worden" Facebook link) to `ultras_join_click` — so the hero and
 * body stay server-rendered. A native listener on the container catches the
 * bubbled click from mouse and keyboard activation alike.
 */
export function UltrasAnalytics({ children }: UltrasAnalyticsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { trackUltrasView, trackUltrasJoinClick } = useUltrasAnalytics();

  useEffect(() => {
    trackUltrasView();
  }, [trackUltrasView]);

  useDelegatedClick(ref, {
    selector: "[data-ultras-join]",
    onMatch: () => trackUltrasJoinClick(),
  });

  return <div ref={ref}>{children}</div>;
}
