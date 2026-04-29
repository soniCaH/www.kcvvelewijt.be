import {
  MonoLabel,
  type MonoLabelProps,
} from "@/components/design-system/MonoLabel";
import { cn } from "@/lib/utils/cn";
import { getStatusColor } from "@/lib/utils/match-display";
import type { MatchStatus } from "../types";

type BadgeStatus = Extract<MatchStatus, "postponed" | "stopped" | "forfeited">;

export interface MatchStatusBadgeProps {
  status: MatchStatus | (string & {});
  /**
   * Dark background variant. Kept for call-site API compatibility but no
   * longer drives custom dark-mode classes — MonoLabel pill variants are
   * legible on both cream and ink surfaces.
   */
  isDark?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const statusLabels: Record<BadgeStatus, string> = {
  postponed: "Uitgesteld",
  stopped: "Gestopt",
  forfeited: "FF",
};

// Phase 1 migration: map the legacy match-status colour names to the
// redesign's MonoLabel pill variants. "orange" was used for warning-style
// statuses (postponed/stopped) — rendered as the jersey-green brand
// accent now. "gray" was the neutral fallback — rendered as a cream pill.
const colorToVariant: Record<string, MonoLabelProps["variant"]> = {
  orange: "pill-jersey",
  gray: "pill-cream",
};

function isBadgeStatus(status: string): status is BadgeStatus {
  return Object.hasOwn(statusLabels, status);
}

export function MatchStatusBadge({ status, className }: MatchStatusBadgeProps) {
  if (!isBadgeStatus(status)) return null;

  const color = getStatusColor(status);
  const variant = colorToVariant[color] ?? "pill-cream";

  return (
    <span className={cn(className)}>
      <MonoLabel variant={variant} size="sm">
        {statusLabels[status]}
      </MonoLabel>
    </span>
  );
}
