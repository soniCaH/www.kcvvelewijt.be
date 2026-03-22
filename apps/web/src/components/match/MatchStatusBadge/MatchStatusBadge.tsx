import { Badge } from "@/components/design-system/Badge/Badge";
import { cn } from "@/lib/utils/cn";
import type { MatchStatus } from "../types";

type BadgeStatus = Extract<MatchStatus, "postponed" | "stopped" | "forfeited">;

export interface MatchStatusBadgeProps {
  status: MatchStatus | (string & {});
  /** Dark background variant (e.g. for dark match teasers) */
  isDark?: boolean;
}

const statusConfig: Record<
  BadgeStatus,
  { label: string; variant: "warning" | "default"; darkClass: string }
> = {
  postponed: {
    label: "Uitgesteld",
    variant: "warning",
    darkClass: "bg-orange-900/40 text-orange-300",
  },
  stopped: {
    label: "Gestopt",
    variant: "warning",
    darkClass: "bg-orange-900/40 text-orange-300",
  },
  forfeited: {
    label: "FF",
    variant: "default",
    darkClass: "bg-white/10 text-white/60",
  },
};

function isBadgeStatus(status: string): status is BadgeStatus {
  return status in statusConfig;
}

export function MatchStatusBadge({ status, isDark }: MatchStatusBadgeProps) {
  if (!isBadgeStatus(status)) return null;

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      size="sm"
      className={cn(isDark && config.darkClass)}
    >
      {config.label}
    </Badge>
  );
}
