import { cn } from "@/lib/utils/cn";
import type { MatchStatus } from "../types";

type BadgeStatus = Extract<
  MatchStatus,
  "finished" | "forfeited" | "postponed" | "cancelled" | "stopped"
>;

interface BadgeSpec {
  abbreviation: string;
  longForm: string;
  tintClass: string;
}

const BADGE_SPECS: Record<BadgeStatus, BadgeSpec> = {
  finished: {
    abbreviation: "FT",
    longForm: "Voltijd",
    tintClass: "bg-cream text-ink",
  },
  forfeited: {
    abbreviation: "FF",
    longForm: "Forfait",
    tintClass: "bg-cream-deep text-ink",
  },
  postponed: {
    abbreviation: "PP",
    longForm: "Uitgesteld",
    tintClass: "bg-cream-deep text-ink",
  },
  stopped: {
    abbreviation: "STOP",
    longForm: "Gestopt",
    tintClass: "bg-warm text-ink",
  },
  cancelled: {
    abbreviation: "CANC",
    longForm: "Geannuleerd",
    tintClass: "bg-card-red text-cream",
  },
};

// Direction-D paper-chrome base (Phase 2 lock — see redesign-phase-2.md §6.5).
// Sharp corners, 2px ink border, 4px ink offset shadow, mono caps at the
// canonical label size with widened tracking. Tint class is appended per status.
const BASE_CLASS =
  "inline-block border-2 border-ink shadow-paper-sm px-2 py-[5px] " +
  "font-mono font-bold uppercase leading-none " +
  "text-[10px] tracking-[0.16em]";

export interface MatchStatusBadgeProps {
  status: MatchStatus | (string & {});
  className?: string;
}

const isBadgeStatus = (status: string): status is BadgeStatus => {
  return Object.hasOwn(BADGE_SPECS, status);
};

/**
 * The wording for a status, without the badge chrome. Lets tighter surfaces
 * (`<TeamAgendaRow>`'s 9px caption line) name a status in their own register
 * while still drawing the words from this one table — "Forfait" must not be
 * spelled differently on the match hero and on an agenda row (#2423).
 *
 * Returns `null` for a status with nothing to say (`scheduled`).
 */
export const matchStatusWording = (
  status: MatchStatus | (string & {}),
): { abbreviation: string; longForm: string } | null => {
  if (!isBadgeStatus(status)) return null;
  const { abbreviation, longForm } = BADGE_SPECS[status];
  return { abbreviation, longForm };
};

export const MatchStatusBadge = ({
  status,
  className,
}: MatchStatusBadgeProps) => {
  if (!isBadgeStatus(status)) return null;

  const spec = BADGE_SPECS[status];

  return (
    <span
      data-status={status}
      title={spec.longForm}
      className={cn(BASE_CLASS, spec.tintClass, className)}
    >
      {spec.abbreviation}
    </span>
  );
};
