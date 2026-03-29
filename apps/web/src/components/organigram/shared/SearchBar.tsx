"use client";

/**
 * SearchBar Component
 *
 * Unified search component with fuzzy search and autocomplete.
 * Inspired by ResponsibilityFinder's search pattern.
 *
 * Features:
 * - Fuzzy search by name, title, position, email
 * - Autocomplete dropdown with keyboard navigation
 * - Scoring algorithm for relevance
 * - Clear button
 * - Keyboard shortcuts (Escape to clear, Arrow keys to navigate)
 * - Click-outside to close dropdown
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X } from "@/lib/icons";
import type { OrgChartNode } from "@/types/organigram";
import type { SearchBarProps, SearchResult } from "./types";

/**
 * Render a searchable input with an optional autocomplete dropdown for selecting org chart members.
 *
 * Performs a fuzzy search over the provided members and displays scored results with keyboard and mouse navigation.
 *
 * @param value - Current text in the search input
 * @param onChange - Called when the input value changes
 * @param members - Array of members to search through
 * @param placeholder - Input placeholder text (default: "Zoek persoon of functie...")
 * @param showAutocomplete - Whether to show the autocomplete dropdown (default: true)
 * @param maxResults - Maximum number of results to display in the dropdown (default: 6)
 * @param onSelect - Called with the selected member when a result is chosen
 * @param className - Additional CSS class names applied to the component container
 * @returns The SearchBar UI element ready to be rendered in a React tree
 */
export function SearchBar({
  value,
  onChange,
  members,
  placeholder = "Zoek persoon of functie...",
  showAutocomplete = true,
  maxResults = 6,
  onSelect,
  className = "",
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fuzzy search with scoring
  const searchResults = useMemo(() => {
    if (!value.trim()) return [];

    const query = value.toLowerCase();
    const results: SearchResult[] = [];

    members.forEach((member) => {
      let score = 0;
      const matchedFields: string[] = [];

      // Search in member names
      const primaryName = member.members[0]?.name ?? "";
      if (primaryName.toLowerCase().includes(query)) {
        score += 10;
        matchedFields.push("name");
        if (primaryName.toLowerCase().startsWith(query)) {
          score += 5;
        }
      }

      // Search in title
      if (member.title.toLowerCase().includes(query)) {
        score += 8;
        matchedFields.push("title");
      }

      // Search in position short
      if (member.roleCode?.toLowerCase().includes(query)) {
        score += 7;
        matchedFields.push("position");
      }

      // Search in member emails
      if (member.members[0]?.email?.toLowerCase().includes(query)) {
        score += 5;
        matchedFields.push("email");
      }

      // Search in department
      if (member.department?.toLowerCase().includes(query)) {
        score += 3;
        matchedFields.push("department");
      }

      if (score > 0) {
        results.push({ member, score, matchedFields });
      }
    });

    // Sort by score (highest first) and limit results
    return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
  }, [value, members, maxResults]);

  // Show dropdown if focused, has value, and has results
  const showDropdown =
    isFocused && value.trim() && searchResults.length > 0 && showAutocomplete;

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      // Escape clears the input
      if (e.key === "Escape" && value) {
        onChange("");
        setSelectedIndex(-1);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev,
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelect(searchResults[selectedIndex].member);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsFocused(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle selection
  const handleSelect = (member: OrgChartNode) => {
    onSelect?.(member);
    onChange(""); // Clear search after selection
    setIsFocused(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Clear handler
  const handleClear = () => {
    onChange("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-kcvv-gray pointer-events-none">
          <Search size={20} />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-12 pr-12 py-3
            border-2 border-gray-200
            rounded-lg
            focus:border-kcvv-green focus:outline-none focus:ring-2 focus:ring-kcvv-green/20
            transition-all duration-200
            text-kcvv-gray-blue placeholder-kcvv-gray
          "
          aria-label="Zoek in organigram"
          aria-autocomplete="list"
          aria-controls={showDropdown ? "search-results" : undefined}
        />

        {/* Clear Button */}
        {value && (
          <button
            onClick={handleClear}
            className="
              absolute right-4 top-1/2 -translate-y-1/2
              text-kcvv-gray hover:text-kcvv-gray-dark
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-kcvv-green rounded-full
            "
            aria-label="Wis zoekopdracht"
            type="button"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="search-results"
          role="listbox"
          className="
            absolute top-full left-0 right-0 mt-2
            bg-white rounded-lg border-2 border-gray-200
            shadow-lg
            max-h-80 overflow-y-auto
            z-50
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          {searchResults.map((result, index) => (
            <button
              key={result.member.id}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(result.member)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                w-full px-4 py-3 text-left
                flex items-center gap-3
                border-b border-gray-100 last:border-b-0
                transition-colors
                ${
                  index === selectedIndex
                    ? "bg-kcvv-green/10 border-l-4 border-l-kcvv-green"
                    : "hover:bg-gray-50"
                }
              `}
            >
              {/* Profile Image or Initials */}
              <div className="w-10 h-10 rounded-full bg-kcvv-green/20 flex items-center justify-center text-kcvv-green font-semibold text-sm flex-shrink-0">
                {(result.member.members[0]?.name ?? result.member.title)
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-kcvv-gray-blue text-sm truncate">
                  {result.member.members[0]?.name ?? result.member.title}
                </div>
                <div className="text-xs text-kcvv-gray-dark truncate">
                  {result.member.title}
                </div>
              </div>

              {/* Match Badges */}
              <div className="flex gap-1 flex-shrink-0">
                {result.matchedFields.includes("name") && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-kcvv-green/20 text-kcvv-green rounded">
                    naam
                  </span>
                )}
                {result.matchedFields.includes("title") && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-600 rounded">
                    functie
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isFocused &&
        value.trim() &&
        searchResults.length === 0 &&
        showAutocomplete && (
          <div
            className="
            absolute top-full left-0 right-0 mt-2
            bg-white rounded-lg border-2 border-gray-200
            shadow-lg p-4
            text-center text-kcvv-gray
            z-50
          "
          >
            Geen resultaten voor &quot;{value}&quot;
          </div>
        )}
    </div>
  );
}
