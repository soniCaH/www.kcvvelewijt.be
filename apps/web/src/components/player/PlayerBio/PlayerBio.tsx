/**
 * PlayerBio Component
 *
 * Player biography and personal information section.
 * Displays key facts about the player.
 */

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { Calendar } from "@/lib/icons";

export interface PlayerBioProps extends HTMLAttributes<HTMLDivElement> {
  /** Birth date (YYYY-MM-DD or display format) */
  birthDate?: string;
  /** Date player joined the club (YYYY-MM-DD or display format) */
  joinDate?: string;
  /** Date player left the club (if applicable) */
  leaveDate?: string;
  /** Biography text */
  biography?: string;
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: string): number | null {
  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  } catch {
    return null;
  }
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString("nl-BE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Player biography and information section
 */
export const PlayerBio = forwardRef<HTMLDivElement, PlayerBioProps>(
  ({ birthDate, joinDate, leaveDate, biography, className, ...props }, ref) => {
    const age = birthDate ? calculateAge(birthDate) : null;
    const formattedBirthDate = birthDate ? formatDate(birthDate) : null;
    const formattedJoinDate = joinDate ? formatDate(joinDate) : null;
    const formattedLeaveDate = leaveDate ? formatDate(leaveDate) : null;
    const isCurrentPlayer = !leaveDate;
    const hasAnyInfo = birthDate || joinDate;

    // Empty state
    if (!hasAnyInfo && !biography) {
      return (
        <div
          ref={ref}
          className={cn(
            "bg-foundation-gray-light text-kcvv-gray rounded-lg p-6 text-center",
            className,
          )}
          {...props}
        >
          <p className="text-sm">Geen biografie beschikbaar.</p>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("space-y-6", className)} {...props}>
        {/* Info grid */}
        {hasAnyInfo && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Birth date */}
            {birthDate && (
              <div className="border-foundation-gray-light rounded-lg border bg-white p-4">
                <div className="text-kcvv-green-bright mb-1 flex items-center gap-2">
                  <Calendar size={16} />
                  <span className="text-kcvv-gray text-xs font-medium tracking-wide uppercase">
                    Geboortedatum
                  </span>
                </div>
                <div className="text-kcvv-gray-dark font-semibold">
                  {formattedBirthDate}
                </div>
                {age !== null && (
                  <div className="text-kcvv-gray text-sm">{age} jaar</div>
                )}
              </div>
            )}

            {/* Membership period */}
            {joinDate && (
              <div className="border-foundation-gray-light rounded-lg border bg-white p-4">
                <div className="text-kcvv-green-bright mb-1 flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-kcvv-gray text-xs font-medium tracking-wide uppercase">
                    {isCurrentPlayer ? "Bij KCVV sinds" : "Periode bij KCVV"}
                  </span>
                </div>
                <div className="text-kcvv-gray-dark font-semibold">
                  {formattedJoinDate}
                  {!isCurrentPlayer && formattedLeaveDate && (
                    <span className="text-kcvv-gray font-normal">
                      {" — "}
                      {formattedLeaveDate}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Biography text */}
        {biography && (
          <div className="border-foundation-gray-light rounded-lg border bg-white p-6">
            <h3
              className="text-kcvv-gray-blue mb-3 text-lg font-semibold"
              style={{ fontFamily: "var(--font-family-title)" }}
            >
              Over de speler
            </h3>
            <div className="prose prose-sm text-kcvv-gray-dark max-w-none">
              {biography.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-3 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

PlayerBio.displayName = "PlayerBio";
