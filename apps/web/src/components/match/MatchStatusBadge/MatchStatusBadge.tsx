import type { BadgeVariant } from "@/components/design-system/Badge/Badge";
import { Badge } from "@/components/design-system/Badge/Badge";
import { cn } from "@/lib/utils/cn";
import { getStatusColor } from "@/lib/utils/match-display";
import type { MatchStatus } from "../types";

type BadgeStatus = Extract<MatchStatus, "postponed" | "stopped" | "forfeited">;

export interface MatchStatusBadgeProps {
  status: MatchStatus | (string & {});
  /** Dark background variant (e.g. for dark match teasers) */
  isDark?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const statusLabels: Record<BadgeStatus, string> = {
  postponed: "Uitgesteld",
  stopped: "Gestopt",
  forfeited: "FF",
};

const colorToVariant: Record<string, BadgeVariant> = {
  orange: "warning",
  gray: "default",
};

const darkClasses: Record<string, string> = {
  orange: "bg-orange-900/40 text-orange-300",
  gray: "bg-white/10 text-white/60",
};

function isBadgeStatus(status: string): status is BadgeStatus {
  return status in statusLabels;
}

export function MatchStatusBadge({
  status,
  isDark,
  className,
}: MatchStatusBadgeProps) {
  if (!isBadgeStatus(status)) return null;

  const color = getStatusColor(status);
  const variant = colorToVariant[color] ?? "default";

  return (
    <Badge
      variant={variant}
      size="sm"
      className={cn(isDark && darkClasses[color], className)}
    >
      {statusLabels[status]}
    </Badge>
  );
}
