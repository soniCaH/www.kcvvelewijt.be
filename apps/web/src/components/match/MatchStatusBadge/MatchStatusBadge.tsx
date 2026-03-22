import { Badge } from "@/components/design-system/Badge/Badge";
import { cn } from "@/lib/utils/cn";
export interface MatchStatusBadgeProps {
  status: string;
  /** Dark background variant (e.g. for dark match teasers) */
  isDark?: boolean;
}

const statusConfig: Record<
  string,
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

export function MatchStatusBadge({ status, isDark }: MatchStatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

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
