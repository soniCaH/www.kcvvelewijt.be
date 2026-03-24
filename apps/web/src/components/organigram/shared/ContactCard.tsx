"use client";

/**
 * ContactCard Component
 *
 * Unified member card component used across all organigram prototypes.
 * Provides consistent visual design following KCVV design system.
 *
 * Variants:
 * - compact: Small card for mobile/list views (96px height)
 * - detailed: Full card with all information (140px+ height)
 * - grid: Optimized for grid layouts (square aspect ratio)
 */

import Image from "next/image";
import { ChevronDown, ChevronUp } from "@/lib/icons";
import type { ContactCardProps } from "./types";

/**
 * Render a member contact card with configurable layout, badges, quick actions, and an optional expand/collapse indicator.
 *
 * @param member - Member data to display (name, title, imageUrl, email, phone, department, positionShort, and optional `_children`)
 * @param variant - Layout variant: `"compact"`, `"detailed"`, or `"grid"`; controls sizing and typography
 * @param showQuickActions - If true, show inline email and phone action links when available
 * @param showDepartment - If true, show a department badge when `member.department` is present and not `"algemeen"`
 * @param showExpandIndicator - If true and the member has children, show an expand/collapse indicator
 * @param isExpanded - Current expanded state used to choose the expand/collapse icon and hint text
 * @param onClick - Optional click handler invoked with `member` when the card is activated (click, Enter, or Space)
 * @param className - Additional CSS classes applied to the root element
 * @param testId - Optional `data-testid` applied to the root element for testing
 * @param responsibilityCount - Number of responsibility paths this member is responsible for
 * @returns A React element rendering the contact card for the provided `member`
 */
export function ContactCard({
  member,
  variant = "detailed",
  showQuickActions = false,
  showDepartment = false,
  showExpandIndicator = false,
  isExpanded = false,
  onClick,
  className = "",
  testId,
  responsibilityCount = 0,
}: ContactCardProps) {
  const imageUrl = member.imageUrl || "/images/logo-flat.png";
  const hasChildren = member._children && member._children.length > 0;

  // Variant-specific classes
  const variantClasses = {
    compact: "h-24 flex-row gap-3 p-3",
    detailed: "min-h-[140px] flex-col md:flex-row gap-4 p-4",
    grid: "h-full flex-col gap-3 p-4",
  };

  // Image size by variant
  const imageSize = {
    compact: 64,
    detailed: 96,
    grid: 80,
  };

  return (
    <div
      className={`
        relative overflow-hidden
        bg-white rounded-card border-2 border-gray-200
        shadow-sm ${onClick ? "hover:shadow-card-hover" : "hover:shadow-md"}
        transition-all duration-300 ease-in-out
        ${onClick ? "cursor-pointer hover:border-kcvv-green hover:-translate-y-1" : ""}
        ${variantClasses[variant]}
        ${className}
      `}
      onClick={() => onClick?.(member)}
      data-testid={testId}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(member);
        }
      }}
    >
      {/* Green accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-kcvv-green to-kcvv-green-hover rounded-t-xl" />

      {/* Content wrapper */}
      <div className="flex flex-1 gap-4 mt-1">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <Image
            src={imageUrl}
            alt={member.name}
            width={imageSize[variant]}
            height={imageSize[variant]}
            className="rounded-full object-cover border-2 border-kcvv-green"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/logo-flat.png";
            }}
          />
        </div>

        {/* Text Content */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          {/* Name */}
          <h3
            className={`
              font-bold text-kcvv-gray-blue
              ${variant === "compact" ? "text-sm" : "text-base md:text-lg"}
              truncate
            `}
            style={{
              fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
            }}
          >
            {member.name}
          </h3>

          {/* Title */}
          <p
            className={`
              text-kcvv-gray-dark
              ${variant === "compact" ? "text-xs line-clamp-1" : "text-sm line-clamp-2"}
            `}
          >
            {member.title}
          </p>

          {/* Position Badge */}
          {member.positionShort && variant !== "compact" && (
            <span
              className="inline-block mt-2 px-2 py-1 bg-kcvv-green/10 text-kcvv-green rounded text-xs font-semibold self-start"
              style={{ fontFamily: "ibm-plex-mono, monospace" }}
            >
              {member.positionShort}
            </span>
          )}

          {/* Department Badge */}
          {showDepartment &&
            member.department &&
            member.department !== "algemeen" && (
              <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-kcvv-gray-dark rounded text-xs self-start">
                {member.department === "hoofdbestuur"
                  ? "Hoofdbestuur"
                  : "Jeugdbestuur"}
              </span>
            )}

          {/* Responsibility Indicator */}
          {responsibilityCount > 0 && variant !== "compact" && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-kcvv-green/10 text-kcvv-green rounded text-xs font-medium self-start">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {responsibilityCount}{" "}
                {responsibilityCount === 1 ? "hulpvraag" : "hulpvragen"}
              </span>
            </div>
          )}

          {/* Quick Contact Actions (inline) */}
          {showQuickActions &&
            variant !== "compact" &&
            (member.email || member.phone) && (
              <div className="flex gap-2 mt-3">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-kcvv-green hover:text-kcvv-green-hover hover:underline"
                    aria-label={`Email ${member.name}`}
                  >
                    ✉️ Email
                  </a>
                )}
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-kcvv-green hover:text-kcvv-green-hover hover:underline"
                    aria-label={`Call ${member.name}`}
                  >
                    📞 Bel
                  </a>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Expand/Collapse Indicator */}
      {showExpandIndicator && hasChildren && (
        <div className="absolute bottom-3 right-3">
          <div className="w-8 h-8 bg-kcvv-green rounded-full flex items-center justify-center shadow-md">
            {isExpanded ? (
              <ChevronUp size={20} className="text-white" strokeWidth={2.5} />
            ) : (
              <ChevronDown size={20} className="text-white" strokeWidth={2.5} />
            )}
          </div>
        </div>
      )}

      {/* Click Hint (for cards with expand) */}
      {showExpandIndicator && hasChildren && variant !== "compact" && (
        <p className="absolute bottom-2 left-3 text-[10px] text-kcvv-gray opacity-70 pointer-events-none">
          Klik om {isExpanded ? "in" : "uit"} te klappen
        </p>
      )}
    </div>
  );
}
