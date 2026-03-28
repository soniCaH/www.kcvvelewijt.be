"use client";

/**
 * MobileNavigationDrawer Component (Option C: Enhanced d3)
 *
 * Bottom drawer for mobile navigation in d3-org-chart.
 * Provides search, filter, and member list for quick navigation.
 *
 * Features:
 * - Slide-up bottom drawer (off-canvas)
 * - Search with autocomplete (reuses SearchBar)
 * - Department filtering (reuses DepartmentFilter)
 * - Scrollable member list
 * - Click member to center/zoom in org chart
 * - Close button
 * - Touch-friendly interactions
 * - Backdrop overlay
 */

import { useState, useMemo } from "react";
import Image from "next/image";
import { X } from "@/lib/icons";
import { SearchBar } from "../shared/SearchBar";
import { DepartmentFilter } from "../shared/DepartmentFilter";
import type { OrgChartNode } from "@/types/organigram";

export interface MobileNavigationDrawerProps {
  members: OrgChartNode[];
  isOpen: boolean;
  onClose: () => void;
  onMemberSelect: (member: OrgChartNode) => void;
  className?: string;
}

/**
 * Render a mobile bottom-sheet drawer for navigating and selecting organization members.
 *
 * Includes a search input, department filter, and a scrollable list of members; selecting a member invokes `onMemberSelect` and closes the drawer.
 *
 * @param members - All organization members to display and filter
 * @param isOpen - Whether the drawer is visible
 * @param onClose - Callback invoked to close the drawer
 * @param onMemberSelect - Callback invoked with the selected member (should center/zoom to that member)
 * @param className - Optional additional CSS classes applied to the drawer container
 */
export function MobileNavigationDrawer({
  members,
  isOpen,
  onClose,
  onMemberSelect,
  className = "",
}: MobileNavigationDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDepartment, setActiveDepartment] = useState<
    "all" | "hoofdbestuur" | "jeugdbestuur"
  >("all");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Filter by department
  const departmentFilteredMembers = useMemo(() => {
    if (activeDepartment === "all") {
      return members;
    }

    return members.filter((member) => {
      if (activeDepartment === "hoofdbestuur") {
        return (
          member.department === "hoofdbestuur" ||
          member.department === "algemeen"
        );
      }
      return member.department === activeDepartment;
    });
  }, [members, activeDepartment]);

  // Search filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return departmentFilteredMembers;
    }

    const query = searchQuery.toLowerCase();
    return departmentFilteredMembers.filter((member) => {
      return (
        member.members.some((m) => m.name.toLowerCase().includes(query)) ||
        member.title.toLowerCase().includes(query) ||
        member.roleCode?.toLowerCase().includes(query) ||
        member.members.some((m) => m.email?.toLowerCase().includes(query)) ||
        member.department?.toLowerCase().includes(query)
      );
    });
  }, [departmentFilteredMembers, searchQuery]);

  // Handle member selection
  const handleMemberClick = (member: OrgChartNode) => {
    onMemberSelect(member);
    onClose(); // Close drawer after selection
  };

  // Handle search selection (from autocomplete)
  const handleSearchSelect = (member: OrgChartNode) => {
    handleMemberClick(member);
  };

  return (
    <>
      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white
          rounded-t-2xl
          shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-y-0" : "translate-y-full"}
          lg:hidden
          ${className}
        `}
        style={{
          maxHeight: "85vh",
        }}
      >
        {/* Drawer Handle */}
        <div className="flex justify-center pt-3 pb-2" aria-hidden="true">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-kcvv-gray-blue font-heading">
            Navigatie
          </h2>
          <button
            onClick={onClose}
            className="
              w-8 h-8
              flex items-center justify-center
              text-kcvv-gray-dark hover:text-kcvv-gray-blue
              hover:bg-gray-100
              rounded-full
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2
            "
            aria-label="Sluiten"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ height: "calc(85vh - 80px)" }}
        >
          {/* Filters (Fixed) */}
          <div className="flex-shrink-0 px-4 pt-4 pb-3 space-y-3 border-b border-gray-100">
            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              members={members}
              placeholder="Zoek persoon..."
              showAutocomplete={true}
              maxResults={5}
              onSelect={handleSearchSelect}
            />

            {/* Department Filter */}
            <DepartmentFilter
              value={activeDepartment}
              onChange={setActiveDepartment}
              members={members}
              showCounts={true}
              variant="pills"
            />
          </div>

          {/* Member List (Scrollable) */}
          <div className="flex-1 overflow-y-auto">
            {searchResults.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl text-kcvv-gray">🔍</span>
                </div>
                <p className="text-base font-semibold text-kcvv-gray-blue mb-1">
                  Geen resultaten
                </p>
                <p className="text-sm text-kcvv-gray">
                  Probeer een andere zoekopdracht
                </p>
              </div>
            ) : (
              /* Member List */
              <div className="py-2">
                {searchResults.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleMemberClick(member)}
                    className="
                      w-full px-4 py-3
                      flex items-center gap-3
                      hover:bg-gray-50
                      active:bg-gray-100
                      transition-colors
                      text-left
                      border-b border-gray-100 last:border-0
                      focus:outline-none focus:bg-gray-50
                    "
                  >
                    {/* Profile Image */}
                    <div className="flex-shrink-0">
                      <Image
                        src={
                          imageErrors[member.id]
                            ? "/images/logo-flat.png"
                            : member.members[0]?.imageUrl ||
                              "/images/logo-flat.png"
                        }
                        alt={member.members[0]?.name ?? member.title}
                        width={48}
                        height={48}
                        className="rounded-full object-cover border-2 border-kcvv-green"
                        onError={() =>
                          setImageErrors((prev) => ({
                            ...prev,
                            [member.id]: true,
                          }))
                        }
                      />
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      {/* Name */}
                      <p className="font-semibold text-kcvv-gray-blue text-sm truncate">
                        {member.members[0]?.name ?? member.title}
                      </p>

                      {/* Title */}
                      <p className="text-xs text-kcvv-gray truncate">
                        {member.title}
                      </p>

                      {/* Position Badge */}
                      {member.roleCode && (
                        <span
                          className="
                            inline-block mt-1
                            px-2 py-0.5
                            bg-kcvv-green/10
                            text-kcvv-green
                            rounded
                            text-xs font-semibold font-mono
                            leading-tight
                          "
                        >
                          {member.roleCode}
                        </span>
                      )}
                    </div>

                    {/* Chevron */}
                    <div className="flex-shrink-0 text-gray-300">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results Count Footer */}
          {searchResults.length > 0 && (
            <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-kcvv-gray text-center">
                {searchResults.length === 1
                  ? "1 lid gevonden"
                  : `${searchResults.length} leden gevonden`}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
