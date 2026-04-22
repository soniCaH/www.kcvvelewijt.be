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
        member.members[0]?.name?.toLowerCase().includes(query) ||
        member.title.toLowerCase().includes(query) ||
        member.roleCode?.toLowerCase().includes(query) ||
        member.members[0]?.email?.toLowerCase().includes(query) ||
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
          className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 bottom-0 left-0 z-50 rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-y-0" : "translate-y-full"} lg:hidden ${className} `}
        style={{
          maxHeight: "85vh",
        }}
      >
        {/* Drawer Handle */}
        <div className="flex justify-center pt-3 pb-2" aria-hidden="true">
          <div className="h-1 w-12 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-kcvv-gray-blue font-heading text-lg font-bold">
            Navigatie
          </h2>
          <button
            onClick={onClose}
            className="text-kcvv-gray-dark hover:text-kcvv-gray-blue focus:ring-kcvv-green flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:outline-none"
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
          <div className="flex-shrink-0 space-y-3 border-b border-gray-100 px-4 pt-4 pb-3">
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
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <span className="text-kcvv-gray text-3xl">🔍</span>
                </div>
                <p className="text-kcvv-gray-blue mb-1 text-base font-semibold">
                  Geen resultaten
                </p>
                <p className="text-kcvv-gray text-sm">
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
                    className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none active:bg-gray-100"
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
                        className="border-kcvv-green rounded-full border-2 object-cover"
                        onError={() =>
                          setImageErrors((prev) => ({
                            ...prev,
                            [member.id]: true,
                          }))
                        }
                      />
                    </div>

                    {/* Member Info */}
                    <div className="min-w-0 flex-1">
                      {/* Name */}
                      <p className="text-kcvv-gray-blue truncate text-sm font-semibold">
                        {member.members[0]?.name ?? member.title}
                      </p>

                      {/* Title */}
                      <p className="text-kcvv-gray truncate text-xs">
                        {member.title}
                      </p>

                      {/* Position Badge */}
                      {member.roleCode && (
                        <span className="bg-kcvv-green/10 text-kcvv-green mt-1 inline-block rounded px-2 py-0.5 font-mono text-xs leading-tight font-semibold">
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
            <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-kcvv-gray text-center text-xs">
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
