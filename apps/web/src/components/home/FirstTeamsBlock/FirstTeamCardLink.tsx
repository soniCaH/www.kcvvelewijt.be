"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { PRESS_DOWN_CLASSES } from "@/components/design-system";
import {
  trackFirstTeamsCardClick,
  type FirstTeamsCardKind,
} from "./first-teams-analytics";

export interface FirstTeamCardLinkProps {
  href: string;
  teamSlug: string;
  matchId: number;
  kind: FirstTeamsCardKind;
  ariaLabel: string;
  /** Per-card chrome (bg / border / text / shadow) — the card supplies its own offset shadow so the press-down can collapse it. */
  className?: string;
  children: ReactNode;
}

/**
 * Client wrapper for one "Eerste ploegen" card: a press-down `<Link>` to the
 * match detail that fires `match_card_click` on navigation. The visuals are
 * passed as server-rendered children — only the link + analytics are client.
 */
export function FirstTeamCardLink({
  href,
  teamSlug,
  matchId,
  kind,
  ariaLabel,
  className,
  children,
}: FirstTeamCardLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      onClick={() => trackFirstTeamsCardClick({ teamSlug, matchId, kind })}
      className={cn("block border-2", PRESS_DOWN_CLASSES, className)}
    >
      {children}
    </Link>
  );
}
