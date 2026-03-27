"use client";

/**
 * UnifiedSearchBar Component
 *
 * Unified search bar that searches across both organigram members
 * and responsibility paths, providing a single search experience.
 *
 * Features:
 * - Search members by name, title, position, email
 * - Search responsibility paths by question, keywords, summary
 * - Combined autocomplete dropdown
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Visual distinction between member and responsibility results
 * - Click to navigate to member details or responsibility view
 */

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { Search, X, User, CircleHelp } from "@/lib/icons";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import { getCategoryInfo } from "@/lib/responsibility-utils";

export interface UnifiedSearchBarProps {
  /** Current search value */
  value: string;

  /** Change handler */
  onChange: (value: string) => void;

  /** Available members to search */
  members: OrgChartNode[];

  /** Available responsibility paths to search */
  responsibilityPaths: ResponsibilityPath[];

  /** Placeholder text */
  placeholder?: string;

  /** Show autocomplete dropdown */
  showAutocomplete?: boolean;

  /** Max autocomplete results per category */
  maxResults?: number;

  /** Debounce delay in milliseconds (default: 200, set to 0 to disable) */
  debounceMs?: number;

  /** Select handler for member */
  onSelectMember?: (member: OrgChartNode) => void;

  /** Select handler for responsibility */
  onSelectResponsibility?: (path: ResponsibilityPath) => void;

  /** Optional CSS class name */
  className?: string;
}

interface MemberResult {
  type: "member";
  member: OrgChartNode;
  score: number;
  matchedFields: string[];
}

interface ResponsibilityResult {
  type: "responsibility";
  path: ResponsibilityPath;
  score: number;
  matchedFields: string[];
}

type SearchResult = MemberResult | ResponsibilityResult;

/**
 * Finds and ranks members that match a search query across common member fields.
 *
 * Performs case-insensitive substring matching against member `name` (highest priority), `title`,
 * `roleCode`, `email`, and `department`. For each matching member it builds a relevance
 * score and a list of human-readable matched field labels, then returns the top matches.
 *
 * @param query - The search string to match against member fields
 * @param members - The list of members to search
 * @param maxResults - Maximum number of results to return
 * @returns An array of `MemberResult` objects containing the matched member, a relevance `score` (higher is better), and `matchedFields` labels, sorted by descending score and limited to `maxResults`
 */
function searchMembers(
  query: string,
  members: OrgChartNode[],
  maxResults: number,
): MemberResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results: MemberResult[] = [];

  for (const member of members) {
    let score = 0;
    const matchedFields: string[] = [];

    // Name match (highest priority)
    if (member.name.toLowerCase().includes(lowerQuery)) {
      score += 50;
      matchedFields.push("Naam");
    }

    // Title match
    if (member.title.toLowerCase().includes(lowerQuery)) {
      score += 30;
      matchedFields.push("Functie");
    }

    // Position short match
    if (member.roleCode?.toLowerCase().includes(lowerQuery)) {
      score += 20;
      matchedFields.push("Positie");
    }

    // Email match
    if (member.email?.toLowerCase().includes(lowerQuery)) {
      score += 15;
      matchedFields.push("Email");
    }

    // Department match
    if (member.department?.toLowerCase().includes(lowerQuery)) {
      score += 10;
      matchedFields.push("Afdeling");
    }

    if (score > 0) {
      results.push({ type: "member", member, score, matchedFields });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/**
 * Finds and ranks responsibility paths that match a search query.
 *
 * Matches against the path's question, summary, and keywords, and also scores
 * individual query words (skipping words shorter than 3 characters). Results
 * include which path fields matched and are ordered by descending relevance.
 *
 * @param query - The search text to match against responsibility paths.
 * @param paths - The list of responsibility paths to search.
 * @param maxResults - Maximum number of results to return.
 * @returns An array of responsibility results sorted by descending score; each
 * result contains the matched `path`, a numeric `score`, and `matchedFields`
 * describing which path fields contributed to the match.
 */
function searchResponsibilities(
  query: string,
  paths: ResponsibilityPath[],
  maxResults: number,
): ResponsibilityResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length > 0);
  const results: ResponsibilityResult[] = [];

  for (const path of paths) {
    let score = 0;
    const matchedFields: string[] = [];

    // Question match (highest priority)
    if (path.question.toLowerCase().includes(lowerQuery)) {
      score += 50;
      matchedFields.push("Vraag");
    }

    // Summary match
    if (path.summary.toLowerCase().includes(lowerQuery)) {
      score += 30;
      matchedFields.push("Samenvatting");
    }

    // Keyword match
    const matchedKeywords = path.keywords.filter((keyword) =>
      keyword.toLowerCase().includes(lowerQuery),
    );
    if (matchedKeywords.length > 0) {
      score += matchedKeywords.length * 20;
      matchedFields.push("Trefwoorden");
    }

    // Word-by-word matching
    for (const word of queryWords) {
      if (word.length < 3) continue; // Skip short words

      if (path.question.toLowerCase().includes(word)) {
        score += 5;
      }
      if (path.summary.toLowerCase().includes(word)) {
        score += 3;
      }
    }

    if (score > 0) {
      results.push({ type: "responsibility", path, score, matchedFields });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/**
 * Search input component that queries both organization members and responsibility paths and displays an interleaved autocomplete list.
 *
 * Renders a text input with optional clear button and a dropdown of mixed member and responsibility results, supports keyboard navigation, mouse selection, and outside-click dismissal.
 *
 * @param value - Current search string displayed in the input
 * @param onChange - Callback invoked with the new search string when the input changes
 * @param members - Array of organization members to search
 * @param responsibilityPaths - Array of responsibility paths to search
 * @param placeholder - Placeholder text shown in the input when empty
 * @param showAutocomplete - Whether to show the autocomplete dropdown when the input is focused and non-empty
 * @param maxResults - Maximum number of results to fetch per category (members and responsibilities) before interleaving
 * @param onSelectMember - Optional callback invoked with the selected member when a member result is chosen
 * @param onSelectResponsibility - Optional callback invoked with the selected responsibility path when a responsibility result is chosen
 * @param className - Optional additional CSS class applied to the root container
 * @returns The component's rendered JSX element
 */
export function UnifiedSearchBar({
  value,
  onChange,
  members,
  responsibilityPaths,
  placeholder = "Zoek een persoon of hulpvraag...",
  showAutocomplete = true,
  maxResults = 5,
  debounceMs = 200,
  onSelectMember,
  onSelectResponsibility,
  className = "",
}: UnifiedSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search value for performance with larger datasets
  useEffect(() => {
    if (debounceMs === 0) {
      return; // No debouncing needed
    }

    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, debounceMs]);

  // Use immediate value when debouncing is disabled, otherwise use debounced value
  const effectiveSearchValue = debounceMs === 0 ? value : debouncedValue;

  // Search both members and responsibilities
  const searchResults = useMemo(() => {
    const memberResults = searchMembers(
      effectiveSearchValue,
      members,
      maxResults,
    );
    const responsibilityResults = searchResponsibilities(
      effectiveSearchValue,
      responsibilityPaths,
      maxResults,
    );

    // Interleave results for better UX
    const combined: SearchResult[] = [];
    const maxLength = Math.max(
      memberResults.length,
      responsibilityResults.length,
    );

    for (let i = 0; i < maxLength; i++) {
      if (i < memberResults.length) {
        combined.push(memberResults[i]);
      }
      if (i < responsibilityResults.length) {
        combined.push(responsibilityResults[i]);
      }
    }

    return combined;
  }, [effectiveSearchValue, members, responsibilityPaths, maxResults]);

  const showResults = showAutocomplete && isFocused && value.trim().length > 0;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => {
          // Clamp to valid range if prev is out of bounds
          const clamped = prev >= searchResults.length ? -1 : prev;
          return clamped < searchResults.length - 1 ? clamped + 1 : 0;
        });
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => {
          // Clamp to valid range if prev is out of bounds
          const clamped = prev >= searchResults.length ? -1 : prev;
          return clamped > 0 ? clamped - 1 : searchResults.length - 1;
        });
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelect(searchResults[selectedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle selection
  const handleSelect = (result: SearchResult) => {
    if (result.type === "member") {
      onSelectMember?.(result.member);
      onChange(result.member.name);
    } else {
      onSelectResponsibility?.(result.path);
      onChange(result.path.question);
    }
    setIsFocused(false);
    inputRef.current?.blur();
  };

  // Handle input change and reset selection
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setSelectedIndex(-1); // Reset selection when search changes
  };

  // Clear search
  const handleClear = () => {
    onChange("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-kcvv-gray">
          <Search size={20} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-10 py-3
            bg-white border-2 border-gray-200 rounded-lg
            text-kcvv-gray-blue placeholder-kcvv-gray
            focus:outline-none focus:border-kcvv-green
            transition-colors duration-200
          "
          aria-label="Zoeken"
          aria-autocomplete="list"
          aria-controls={showResults ? "search-results" : undefined}
          aria-activedescendant={
            selectedIndex >= 0 && selectedIndex < searchResults.length
              ? `search-result-${selectedIndex}`
              : undefined
          }
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-kcvv-gray hover:text-kcvv-gray-dark transition-colors"
            aria-label="Wissen"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div
          ref={dropdownRef}
          id="search-results"
          role="listbox"
          className="
            absolute z-50 w-full mt-2
            bg-white border-2 border-gray-200 rounded-lg shadow-lg
            max-h-96 overflow-y-auto
          "
        >
          {searchResults.map((result, index) => {
            const isSelected = index === selectedIndex;

            if (result.type === "member") {
              const { member, matchedFields } = result;
              const imageUrl = member.imageUrl || "/images/logo-flat.png";

              return (
                <button
                  key={`member-${member.id}`}
                  id={`search-result-${index}`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="option"
                  aria-selected={isSelected}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3
                    text-left transition-colors cursor-pointer
                    ${isSelected ? "bg-kcvv-green/10" : "hover:bg-gray-50"}
                    border-b border-gray-100 last:border-b-0
                  `}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-kcvv-green overflow-hidden bg-white">
                    <Image
                      src={imageUrl}
                      alt={member.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/logo-flat.png";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User
                        size={14}
                        className="text-kcvv-green flex-shrink-0"
                      />
                      <span className="font-semibold text-kcvv-gray-blue">
                        {member.name}
                      </span>
                    </div>
                    <p className="text-sm text-kcvv-gray truncate">
                      {member.title}
                    </p>
                    {matchedFields.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {matchedFields.map((field) => (
                          <span
                            key={field}
                            className="text-xs px-1.5 py-0.5 bg-kcvv-green/10 text-kcvv-green rounded"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            } else {
              const { path, matchedFields } = result;
              const categoryInfo = getCategoryInfo(path.category);

              return (
                <button
                  key={`responsibility-${path.id}`}
                  id={`search-result-${index}`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="option"
                  aria-selected={isSelected}
                  className={`
                    w-full px-4 py-3 flex items-start gap-3
                    text-left transition-colors cursor-pointer
                    ${isSelected ? "bg-kcvv-green/10" : "hover:bg-gray-50"}
                    border-b border-gray-100 last:border-b-0
                  `}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <CircleHelp size={20} className="text-kcvv-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold ${categoryInfo.colorClass}`}
                      >
                        {categoryInfo.label}
                      </span>
                    </div>
                    <p className="font-medium text-kcvv-gray-blue text-sm">
                      {path.question}
                    </p>
                    <p className="text-xs text-kcvv-gray mt-1 line-clamp-1">
                      {path.summary}
                    </p>
                    {matchedFields.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {matchedFields.map((field) => (
                          <span
                            key={field}
                            className="text-xs px-1.5 py-0.5 bg-kcvv-green/10 text-kcvv-green rounded"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            }
          })}
        </div>
      )}

      {/* No Results */}
      {showResults && value.trim().length > 0 && searchResults.length === 0 && (
        <div
          ref={dropdownRef}
          className="
            absolute z-50 w-full mt-2
            bg-white border-2 border-gray-200 rounded-lg shadow-lg
            px-4 py-6 text-center
          "
        >
          <p className="text-kcvv-gray">
            Geen resultaten gevonden voor &quot;{value}&quot;
          </p>
          <p className="text-sm text-kcvv-gray mt-1">
            Probeer een andere zoekterm
          </p>
        </div>
      )}
    </div>
  );
}
