"use client";

/**
 * ExpandableCard Component (Option A: Card Hierarchy)
 *
 * Single expandable/collapsible card showing a member with their direct reports.
 * Uses ContactCard for display with expand/collapse controls.
 *
 * Features:
 * - Expand/collapse animation (smooth height transition)
 * - Visual hierarchy indicators (indentation, connectors)
 * - Nested children rendering
 * - Click to open details modal
 * - Keyboard accessible (Enter/Space to toggle)
 * - Touch-friendly controls
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "@/lib/icons";
import { ContactCard } from "../shared/ContactCard";
import { findMemberResponsibilities } from "@/lib/responsibility-utils";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";

export interface ExpandableCardProps {
  member: OrgChartNode;
  directReports?: OrgChartNode[];
  depth?: number;
  isExpanded?: boolean;
  onToggle?: (memberId: string, isExpanded: boolean) => void;
  onMemberClick?: (member: OrgChartNode) => void;
  renderChildren?: (
    directReports: OrgChartNode[],
    depth: number,
  ) => React.ReactNode;
  className?: string;
  responsibilityPaths?: ResponsibilityPath[];
}

/**
 * Render a depth-indented member card with an optional expand/collapse control and nested direct reports.
 *
 * @param member - The OrgChartNode to display
 * @param directReports - Direct report nodes to render when expanded
 * @param depth - Nesting level (0 = root) that affects indentation and background
 * @param isExpanded - Controlled expanded state (used when `onToggle` is provided)
 * @param onToggle - Handler invoked as `(memberId, newState)` when expansion is toggled; presence of this prop enables controlled mode
 * @param onMemberClick - Click handler forwarded to the ContactCard
 * @param renderChildren - Optional custom renderer `(children, nextDepth) => ReactNode` for nested direct reports
 * @param className - Optional CSS classes applied to the root container
 * @param responsibilityPaths - Optional responsibility paths used to compute a responsibility count shown on the ContactCard
 * @returns A JSX element containing the member card and its optionally rendered nested children
 */
export function ExpandableCard({
  member,
  directReports = [],
  depth = 0,
  isExpanded = false,
  onToggle,
  onMemberClick,
  renderChildren,
  className = "",
  responsibilityPaths = [],
}: ExpandableCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Use controlled or uncontrolled state
  const expanded = onToggle !== undefined ? isExpanded : internalExpanded;
  const hasChildren = directReports.length > 0;

  // Calculate responsibility count
  const responsibilityCount =
    responsibilityPaths.length > 0
      ? findMemberResponsibilities(member.id, responsibilityPaths).length
      : 0;

  // Handle toggle
  const handleToggle = () => {
    const newState = !expanded;
    if (onToggle) {
      onToggle(member.id, newState);
    } else {
      setInternalExpanded(newState);
    }
  };

  // Calculate indentation based on depth
  const indentClass =
    {
      0: "ml-0",
      1: "ml-6",
      2: "ml-12",
      3: "ml-18",
      4: "ml-24",
    }[Math.min(depth, 4)] || "ml-24";

  // Background color for depth levels - subtle gradient.
  // Depth 0 is transparent so top-level cards float on the section bg
  // (no nested-card-on-card look). Deeper levels still get a subtle
  // tint to indicate hierarchy.
  const depthBackground =
    {
      0: "bg-transparent",
      1: "bg-gray-50/30",
      2: "bg-gray-50/50",
      3: "bg-gray-50/70",
      4: "bg-gray-100/50",
    }[Math.min(depth, 4)] || "bg-gray-100/50";

  return (
    <div className={`${className}`}>
      {/* Card with expand button */}
      <div className={`relative ${indentClass}`}>
        {/* Card container with depth-based background */}
        <div
          className={`flex items-start gap-2 rounded-xl ${depthBackground} p-1`}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={handleToggle}
              className="text-kcvv-gray-dark hover:bg-kcvv-green hover:border-kcvv-green focus:ring-kcvv-green mt-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white transition-all duration-200 hover:text-white focus:ring-2 focus:ring-offset-2 focus:outline-none"
              aria-label={
                expanded
                  ? `Inklappen: ${member.members[0]?.name ?? member.title}`
                  : `Uitklappen: ${member.members[0]?.name ?? member.title}`
              }
              aria-expanded={expanded}
            >
              {expanded ? (
                <ChevronUp size={16} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={16} strokeWidth={2.5} />
              )}
            </button>
          )}

          {/* Spacer if no children */}
          {!hasChildren && <div className="w-8" aria-hidden="true" />}

          {/* Member Card */}
          <div className="min-w-0 flex-1">
            <ContactCard
              member={member}
              variant="detailed"
              showQuickActions={true}
              showDepartment={false}
              showExpandIndicator={hasChildren}
              isExpanded={expanded}
              onClick={onMemberClick}
              testId={`expandable-card-${member.id}`}
              responsibilityCount={responsibilityCount}
            />
          </div>
        </div>
      </div>

      {/* Nested Children (with animation) */}
      {hasChildren && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[10000px] opacity-100" : "max-h-0 opacity-0"} `}
        >
          <div className="mt-3 space-y-3">
            {renderChildren
              ? renderChildren(directReports, depth + 1)
              : directReports.map((child) => (
                  <div key={child.id} className="text-kcvv-gray text-sm">
                    {child.members[0]?.name ?? child.title}
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}
