"use client";

/**
 * Responsibility Finder Component
 *
 * Interactive question builder with smart autocomplete
 * "Ik ben [ROLE] en ik [QUESTION]"
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { useResponsibilityAnalytics } from "@/hooks/useResponsibilityAnalytics";
import { FeedbackWidget } from "./FeedbackWidget";
import { RelatedPaths } from "./RelatedPaths";
import type {
  UserRole,
  ResponsibilityPath,
  AutocompleteSuggestion,
} from "@/types/responsibility";
import { ROLE_OPTIONS } from "@/types/responsibility";
import {
  X,
  User,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Clipboard,
  ChevronDown,
  Check,
  Sparkles,
} from "lucide-react";
import { getIcon } from "@/lib/icons";

const ALLOWED_HREF_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

/**
 * Returns `url` only when it is a relative path or uses an allowed scheme;
 * returns `null` for any other value (including `javascript:` and unknown protocols).
 */
function toSafeHref(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("?"))
    return url;
  try {
    const { protocol } = new URL(url);
    return ALLOWED_HREF_SCHEMES.includes(protocol) ? url : null;
  } catch {
    return null;
  }
}

interface ResponsibilityFinderProps {
  paths?: ResponsibilityPath[];
  onResultSelect?: (path: ResponsibilityPath) => void;
  onMemberSelect?: (memberId: string) => void;
  compact?: boolean;
  /** Responsibility path ID to pre-select and display */
  initialPathId?: string;
  /** Responsibility path object to pre-select and display */
  initialPath?: ResponsibilityPath;
}

// Category color palette - professional and subtle
const categoryColors = {
  commercieel: {
    text: "text-blue-600",
    accent: "#3b82f6",
    accentLight: "rgba(59, 130, 246, 0.1)",
  },
  medisch: {
    text: "text-red-600",
    accent: "#ef4444",
    accentLight: "rgba(239, 68, 68, 0.1)",
  },
  administratief: {
    text: "text-purple-600",
    accent: "#a855f7",
    accentLight: "rgba(168, 85, 247, 0.1)",
  },
  gedrag: {
    text: "text-orange-600",
    accent: "#f97316",
    accentLight: "rgba(249, 115, 22, 0.1)",
  },
  algemeen: {
    text: "text-gray-600",
    accent: "#6b7280",
    accentLight: "rgba(107, 114, 128, 0.1)",
  },
  sportief: {
    text: "text-green-600",
    accent: "#16a34a",
    accentLight: "rgba(22, 163, 74, 0.1)",
  },
} as const;

const ONBOARDING_HINT_SLUGS = [
  "inschrijving-nieuw-lid",
  "ongeval-speler-training",
  "mutualiteit-attest",
  "wedstrijden-zoeken",
] as const;

/**
 * Render a UI for selecting a user role, composing a contextual question, viewing semantic autocomplete suggestions, and inspecting a selected responsibility path.
 *
 * @param paths - Array of available responsibility paths used to produce suggestions and display details.
 * @param onResultSelect - Optional callback invoked with the chosen ResponsibilityPath when the user picks a suggestion.
 * @param onMemberSelect - Optional callback invoked with a member ID when the user requests to view a contact in the organigram.
 * @param compact - When true, apply a more compact layout and typography.
 * @param initialPathId - Optional responsibility path ID to pre-select and display on mount (used when `initialPath` is not provided).
 * @param initialPath - Optional responsibility path object to pre-select and display on mount; takes precedence over `initialPathId`.
 * @returns A React element rendering the ResponsibilityFinder UI (role selection, question input, suggestions, and result display).
 */
export function ResponsibilityFinder({
  paths = [],
  onResultSelect,
  onMemberSelect,
  compact = false,
  initialPathId,
  initialPath,
}: ResponsibilityFinderProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [questionText, setQuestionText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedResult, setSelectedResult] =
    useState<ResponsibilityPath | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [activeDescendantIdx, setActiveDescendantIdx] = useState(-1);
  const [selectedVectorId, setSelectedVectorId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    results: semanticResults,
    answer: semanticAnswer,
    loading: semanticLoading,
    search: semanticSearch,
  } = useSemanticSearch({ type: "responsibility", limit: 5 });

  const analytics = useResponsibilityAnalytics();
  const userInitiatedQuestionRef = useRef(false);

  useEffect(() => {
    semanticSearch(questionText);
  }, [questionText, semanticSearch]);

  const suggestions: AutocompleteSuggestion[] = questionText?.trim()
    ? semanticResults
        .map((r) => {
          const path = paths.find((p) => p.id === r.slug);
          return path ? { path, score: Math.round(r.score * 100) } : null;
        })
        .filter((s): s is AutocompleteSuggestion => s !== null)
    : selectedRole
      ? paths
          .filter((p) => p.role.includes(selectedRole as UserRole))
          .slice(0, 5)
          .map((p) => ({ path: p, score: 100 }))
      : [];

  // Track search events when results arrive (only for user-initiated searches)
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (
      prevLoadingRef.current &&
      !semanticLoading &&
      questionText?.trim() &&
      userInitiatedQuestionRef.current
    ) {
      userInitiatedQuestionRef.current = false;
      analytics.trackSearch(
        questionText,
        selectedRole || "",
        suggestions.length,
      );
      if (suggestions.length === 0) {
        analytics.trackNoResults(questionText.length, selectedRole || "");
      }
    }
    prevLoadingRef.current = semanticLoading;
  }, [
    semanticLoading,
    questionText,
    selectedRole,
    suggestions.length,
    analytics,
  ]);

  // Handle role selection
  const handleRoleSelect = (role: string) => {
    analytics.resetSession();
    setSelectedRole(role as UserRole);
    setSelectedResult(null);
    setShowRoleDropdown(false);
    setShowSuggestions(true);
    setQuestionText("");
    analytics.trackRoleSelected(role);

    // Clear any existing timeout
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }

    // Schedule focus with cleanup tracking
    focusTimeoutRef.current = setTimeout(() => {
      inputRef.current?.focus();
      focusTimeoutRef.current = null;
    }, 100);
  };

  // Handle onboarding hint click — sets role + result in one go
  const handleHintClick = (path: ResponsibilityPath) => {
    if (path.role.length > 0) {
      setSelectedRole(path.role[0] as UserRole);
    }
    setSelectedResult(path);
    setQuestionText(path.question);
    setShowSuggestions(false);
    setShowRoleDropdown(false);
    if (onResultSelect) {
      onResultSelect(path);
    }
  };

  // Handle "Terug" — back to suggestion list
  const handleBack = () => {
    setSelectedResult(null);
    setSelectedVectorId(null);
    setShowSuggestions(true);
  };

  // Handle "Opnieuw beginnen" — full reset
  const handleReset = () => {
    setSelectedRole("");
    setSelectedResult(null);
    setSelectedVectorId(null);
    setQuestionText("");
    setShowSuggestions(false);
    setShowRoleDropdown(false);
    setActiveDescendantIdx(-1);
    analytics.resetSession();
  };

  // Handle keyboard navigation in suggestion list
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveDescendantIdx((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveDescendantIdx((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && activeDescendantIdx >= 0) {
      e.preventDefault();
      handleSuggestionClick(
        suggestions[activeDescendantIdx].path,
        activeDescendantIdx,
      );
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveDescendantIdx(-1);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (path: ResponsibilityPath, index: number) => {
    const semanticResult = semanticResults.find((r) => r.slug === path.id);
    setSelectedVectorId(semanticResult?.id ?? null);
    setQuestionText(path.question);
    setSelectedResult(path);
    setShowSuggestions(false);
    setActiveDescendantIdx(-1);
    analytics.trackSuggestionClicked(path.id, path.category, index);
    if (onResultSelect) {
      onResultSelect(path);
    }
  };

  // Close suggestions and dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".suggestions-container")) {
        setShowSuggestions(false);
        setActiveDescendantIdx(-1);
      }
      if (
        dropdownRef.current &&
        !(e.target as Element).closest(".role-dropdown-container")
      ) {
        setShowRoleDropdown(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Cleanup focus timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  // Handle initial path selection (for deep linking / pre-filling)
  useEffect(() => {
    // initialPath takes precedence over initialPathId
    if (initialPath) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional one-time initialization from props on mount
      setSelectedResult(initialPath);
      setQuestionText(initialPath.question);
      // Set role if it matches one of the path's roles
      if (initialPath.role.length > 0) {
        setSelectedRole(initialPath.role[0]);
      }
      setShowSuggestions(false);
      return;
    }

    // Fallback to initialPathId
    if (initialPathId) {
      const path = paths.find((p) => p.id === initialPathId);
      if (path) {
        setSelectedResult(path);
        setQuestionText(path.question);
        // Set role if it matches one of the path's roles
        if (path.role.length > 0) {
          setSelectedRole(path.role[0]);
        }
        setShowSuggestions(false);
      }
    }
  }, [initialPath, initialPathId, paths]);

  // Resolve onboarding hints against available paths — derive display text from path data
  const resolvedHints = ONBOARDING_HINT_SLUGS.map((slug) => ({
    slug,
    path: paths.find((p) => p.id === slug),
  })).filter(
    (h): h is typeof h & { path: ResponsibilityPath } => h.path != null,
  );

  const showOnboardingHints =
    !selectedRole && !selectedResult && !initialPath && !initialPathId;

  return (
    <div className={`responsibility-finder ${compact ? "compact" : ""}`}>
      {/* Question Builder - Inline Sentence */}
      <div className="question-builder">
        <div className="flex flex-wrap items-center gap-3 text-2xl md:text-4xl font-bold text-kcvv-gray-blue mb-8">
          <span
            style={{
              fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
            }}
          >
            Ik ben
          </span>

          {/* Role Dropdown */}
          <div className="role-dropdown-container relative inline-block">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="min-h-11 min-w-11 px-4 py-2 border-b-4 text-kcvv-gray-blue transition-all inline-flex items-center gap-2 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kcvv-green focus-visible:ring-offset-2 rounded"
              style={{
                fontFamily: "Montserrat, sans-serif",
                borderBottomColor: "var(--color-kcvv-green-bright)",
              }}
            >
              {selectedRole
                ? (ROLE_OPTIONS.find(
                    (r) => r.value === selectedRole,
                  )?.label.toLowerCase() ?? selectedRole)
                : "een..."}
              <ChevronDown
                className={`w-5 h-5 transition-transform ${showRoleDropdown ? "rotate-180" : ""}`}
                strokeWidth={2}
              />
            </button>

            {showRoleDropdown && (
              <div
                ref={dropdownRef}
                className="absolute z-50 top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl min-w-[200px] animate-fadeIn"
              >
                {ROLE_OPTIONS.map((role, idx) => {
                  const isSelected = selectedRole === role.value;
                  return (
                    <button
                      key={role.value}
                      onClick={() => handleRoleSelect(role.value)}
                      className={`
                        w-full text-left px-4 min-h-11 py-3 text-lg font-medium transition-colors
                        flex items-center justify-between
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kcvv-green focus-visible:ring-inset
                        ${isSelected ? "" : "hover:bg-gray-50"}
                        ${idx === ROLE_OPTIONS.length - 1 ? "rounded-b-lg" : ""}
                        ${idx === 0 ? "rounded-t-lg" : ""}
                      `}
                      style={{
                        fontFamily: "Montserrat, sans-serif",
                        color: isSelected ? "#ffffff" : "#374151",
                        backgroundColor: isSelected
                          ? "var(--color-kcvv-green-bright)"
                          : "transparent",
                      }}
                    >
                      <span>{role.label}</span>
                      {isSelected && (
                        <Check className="w-5 h-5 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <span
            style={{
              fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
            }}
          >
            en ik
          </span>
        </div>

        {/* Onboarding Hints — shown before role selection */}
        {showOnboardingHints && resolvedHints.length > 0 && (
          <div className="mb-8">
            <p className="text-sm text-kcvv-gray mb-3">
              Of klik op een veelgestelde vraag:
            </p>
            <div className="flex flex-wrap gap-3">
              {resolvedHints.map((hint) => (
                <button
                  key={hint.slug}
                  onClick={() => handleHintClick(hint.path)}
                  className="min-h-11 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-kcvv-green hover:text-kcvv-green transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kcvv-green focus-visible:ring-offset-2"
                >
                  {hint.path.question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Question Input */}
        {selectedRole && (
          <div className="question-input suggestions-container relative">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-kcvv-gray group-focus-within:text-kcvv-green transition-colors pointer-events-none">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-controls="suggestion-listbox"
                aria-activedescendant={
                  activeDescendantIdx >= 0
                    ? `suggestion-${activeDescendantIdx}`
                    : undefined
                }
                value={questionText}
                onChange={(e) => {
                  userInitiatedQuestionRef.current = true;
                  setQuestionText(e.target.value);
                  setShowSuggestions(true);
                  setSelectedResult(null);
                  setActiveDescendantIdx(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleInputKeyDown}
                placeholder="typ je vraag..."
                className="w-full text-xl md:text-2xl font-medium pl-14 py-4 pr-14 border-2 border-kcvv-gray-light rounded-lg focus:outline-none focus:border-kcvv-green focus:ring-2 focus:ring-kcvv-green/20 placeholder:text-kcvv-gray placeholder:font-normal transition-all duration-300 shadow-sm hover:shadow-md bg-white"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              />

              {questionText && (
                <button
                  onClick={() => {
                    setQuestionText("");
                    setActiveDescendantIdx(-1);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 min-h-11 min-w-11 flex items-center justify-center text-kcvv-gray hover:text-white hover:bg-red-500 transition-all duration-200 rounded-full hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kcvv-green"
                  aria-label="Clear search"
                >
                  <X size={20} />
                </button>
              )}

              {/* Loading State */}
              {showSuggestions && questionText && semanticLoading && (
                <div className="absolute z-50 w-full mt-3 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-4 text-center animate-fadeIn">
                  <p className="text-sm text-kcvv-gray">Zoeken...</p>
                </div>
              )}

              {/* Empty State */}
              {showSuggestions &&
                questionText &&
                !semanticLoading &&
                suggestions.length === 0 && (
                  <div className="absolute z-50 w-full mt-3 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-6 text-center animate-fadeIn">
                    <div className="text-5xl mb-3">🔍</div>
                    <h3 className="text-lg font-bold text-kcvv-gray-blue mb-1">
                      Geen resultaten gevonden
                    </h3>
                    <p className="text-sm text-kcvv-gray">
                      Probeer een andere zoekterm of selecteer een andere rol
                    </p>
                  </div>
                )}

              {/* AI Answer Card */}
              {showSuggestions &&
                semanticAnswer &&
                !semanticLoading &&
                !selectedResult && (
                  <div className="bg-kcvv-success/10 border border-kcvv-success/25 rounded-xl p-5 mt-3 mb-1">
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-kcvv-green-dark uppercase tracking-wide">
                      <Sparkles className="w-3 h-3" />
                      AI-antwoord
                    </div>
                    <p className="text-kcvv-gray-blue text-sm leading-relaxed">
                      {semanticAnswer}
                    </p>
                    <p className="text-xs text-kcvv-gray mt-3">
                      Gegenereerd door AI · Controleer altijd bij de
                      contactpersoon
                    </p>
                  </div>
                )}

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  id="suggestion-listbox"
                  role="listbox"
                  className="absolute z-50 w-full mt-3 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto animate-fadeIn"
                >
                  {suggestions.map((suggestion, idx) => {
                    const colors =
                      categoryColors[
                        suggestion.path.category as keyof typeof categoryColors
                      ] ?? categoryColors.algemeen;
                    const isActive = idx === activeDescendantIdx;
                    return (
                      <div
                        key={suggestion.path.id}
                        id={`suggestion-${idx}`}
                        role="option"
                        aria-selected={isActive}
                        onClick={() =>
                          handleSuggestionClick(suggestion.path, idx)
                        }
                        className={`
                          w-full text-left px-5 min-h-11 py-4 transition-all duration-200 cursor-pointer
                          ${idx !== 0 ? "border-t border-gray-100" : ""}
                          ${isActive ? "bg-gray-100" : "hover:bg-gray-50"} group relative overflow-hidden
                          ${idx === 0 ? "rounded-t-xl" : ""} ${idx === suggestions.length - 1 ? "rounded-b-xl" : ""}
                        `}
                        style={{
                          borderLeft: `3px solid ${isActive ? colors.accent : "transparent"}`,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderLeftColor =
                              colors.accent;
                            e.currentTarget.style.backgroundColor =
                              colors.accentLight;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderLeftColor =
                              "transparent";
                            e.currentTarget.style.backgroundColor = "";
                          }
                        }}
                      >
                        <div className="flex items-start gap-4 ml-1">
                          <div className="flex-shrink-0">
                            {suggestion.path.icon &&
                              (() => {
                                const IconComponent = getIcon(
                                  suggestion.path.icon,
                                );
                                return (
                                  <div className="w-10 h-10 flex items-center justify-center">
                                    <IconComponent
                                      size={24}
                                      className={colors.text}
                                      strokeWidth={1.5}
                                    />
                                  </div>
                                );
                              })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold text-gray-900">
                              {suggestion.path.question}
                            </div>
                            <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {suggestion.path.summary}
                            </div>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <span
                                className={`text-xs px-2 py-0.5 border ${colors.text} rounded-md font-medium uppercase tracking-wide`}
                                style={{ borderColor: colors.accent }}
                              >
                                {suggestion.path.category}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md flex items-center gap-1">
                                <User size={12} />
                                {suggestion.path.primaryContact.role}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight size={20} className="text-gray-400" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Result with aria-live */}
      <div aria-live="polite">
        {selectedResult && (
          <div className="mt-8 animate-fadeIn">
            {/* Navigation Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleBack}
                className="min-h-11 px-4 py-2 inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kcvv-green focus-visible:ring-offset-2"
              >
                <ArrowLeft size={16} />
                Terug
              </button>
              <button
                onClick={handleReset}
                className="min-h-11 px-4 py-2 inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kcvv-green focus-visible:ring-offset-2"
              >
                <RotateCcw size={16} />
                Opnieuw beginnen
              </button>
            </div>

            <ResultCard
              path={selectedResult}
              onMemberSelect={onMemberSelect}
              analytics={analytics}
            />

            <FeedbackWidget
              pathSlug={selectedResult.id}
              pathTitle={selectedResult.question}
            />

            {selectedVectorId && <RelatedPaths sanityId={selectedVectorId} />}

            {/* Fallback Contact Block */}
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-5">
              <h4 className="font-bold text-gray-900 mb-3">
                Staat jouw vraag er niet bij?
              </h4>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/club/contact"
                  className="min-h-11 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-kcvv-green hover:text-kcvv-green-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kcvv-green focus-visible:ring-offset-2 rounded"
                >
                  Neem contact op
                </Link>
                <Link
                  href="/club/organigram"
                  className="min-h-11 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-kcvv-green hover:text-kcvv-green-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kcvv-green focus-visible:ring-offset-2 rounded"
                >
                  Bekijk het organigram
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Display a formatted card for a ResponsibilityPath, showing its header (icon, question, category, summary), the primary contact panel, and an ordered list of steps.
 *
 * @param path - The responsibility path to display
 * @param onMemberSelect - Optional callback invoked with a memberId when the "Bekijk in organigram" action is triggered
 * @returns A React element rendering the styled result card for the provided `path`
 */
function ResultCard({
  path,
  onMemberSelect,
  analytics,
}: {
  path: ResponsibilityPath;
  onMemberSelect?: (memberId: string) => void;
  analytics: ReturnType<typeof useResponsibilityAnalytics>;
}) {
  const colors =
    categoryColors[path.category as keyof typeof categoryColors] ??
    categoryColors.algemeen;
  const safeOrgLink = toSafeHref(path.primaryContact.orgLink);

  // Dwell-time tracking — destructure stable callbacks to avoid effect restart
  // when the analytics object reference changes on parent re-renders
  const { startDwell, stopDwell } = analytics;
  useEffect(() => {
    startDwell(path.id, path.category);
    return () => {
      stopDwell();
    };
  }, [path.id, path.category, startDwell, stopDwell]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
          {path.icon &&
            (() => {
              const IconComponent = getIcon(path.icon);
              return (
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  <IconComponent
                    size={32}
                    className={colors.text}
                    strokeWidth={1.5}
                  />
                </div>
              );
            })()}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3
                className="text-2xl font-bold text-gray-900"
                style={{
                  fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
                }}
              >
                {path.question}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 border ${colors.text} rounded-md font-medium uppercase tracking-wide`}
                style={{ borderColor: colors.accent }}
              >
                {path.category}
              </span>
            </div>
            <p className="text-base text-gray-600">{path.summary}</p>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <User size={16} className="text-gray-600" />
            </div>
            Contactpersoon
          </h4>
          <div className="space-y-2">
            <div className="font-bold text-kcvv-gray-blue">
              {path.primaryContact.role}
            </div>
            {path.primaryContact.name && (
              <div className="text-gray-600">{path.primaryContact.name}</div>
            )}
            {path.primaryContact.email && (
              <div>
                <a
                  href={`mailto:${path.primaryContact.email}`}
                  onClick={() =>
                    analytics.trackContactClicked(path.id, "email")
                  }
                  className="text-kcvv-green hover:text-kcvv-green-hover hover:underline inline-flex items-center gap-1 text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {path.primaryContact.email}
                </a>
              </div>
            )}
            {path.primaryContact.phone && (
              <div>
                <a
                  href={`tel:${path.primaryContact.phone}`}
                  onClick={() =>
                    analytics.trackContactClicked(path.id, "phone")
                  }
                  className="text-kcvv-green hover:text-kcvv-green-hover hover:underline inline-flex items-center gap-1 text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {path.primaryContact.phone}
                </a>
              </div>
            )}
            {(path.primaryContact.memberId || safeOrgLink) && (
              <div>
                {path.primaryContact.memberId && onMemberSelect ? (
                  <button
                    type="button"
                    onClick={() => {
                      analytics.trackOrganigramLink(
                        path.id,
                        path.primaryContact.memberId!,
                      );
                      onMemberSelect(path.primaryContact.memberId!);
                    }}
                    className="text-kcvv-green hover:text-kcvv-green-hover hover:underline inline-flex items-center gap-1 text-sm font-medium"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Bekijk in organigram
                  </button>
                ) : safeOrgLink ? (
                  <a
                    href={safeOrgLink}
                    onClick={() => {
                      if (path.primaryContact.memberId) {
                        analytics.trackOrganigramLink(
                          path.id,
                          path.primaryContact.memberId,
                        );
                        onMemberSelect?.(path.primaryContact.memberId);
                      }
                    }}
                    className="text-kcvv-green hover:text-kcvv-green-hover hover:underline inline-flex items-center gap-1 text-sm font-medium"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Bekijk in organigram
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Steps */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <Clipboard size={16} className="text-gray-600" />
            </div>
            Wat moet je doen?
          </h4>
          <ol className="space-y-3">
            {path.steps.map((step, stepIdx) => {
              const safeStepLink = toSafeHref(step.link);
              return (
                <li key={stepIdx} className="flex gap-3 group">
                  <div
                    className="flex-shrink-0 w-8 h-8 text-white rounded-lg flex items-center justify-center font-bold shadow-md transition-transform group-hover:scale-110"
                    style={{ backgroundColor: colors.accent }}
                  >
                    {stepIdx + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {step.description}
                    </p>
                    {safeStepLink && (
                      <a
                        href={safeStepLink}
                        onClick={() =>
                          analytics.trackStepLinkClicked(path.id, stepIdx)
                        }
                        className="text-kcvv-green hover:text-kcvv-green-hover hover:underline text-sm inline-flex items-center gap-1 mt-2 font-medium"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Meer info
                      </a>
                    )}
                    {step.contact && (
                      <div className="mt-2 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="font-semibold text-gray-700 mb-1">
                          {step.contact.role}
                        </div>
                        {step.contact.email && (
                          <a
                            href={`mailto:${step.contact.email}`}
                            className="text-kcvv-green hover:text-kcvv-green-hover hover:underline inline-flex items-center gap-1"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            {step.contact.email}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
