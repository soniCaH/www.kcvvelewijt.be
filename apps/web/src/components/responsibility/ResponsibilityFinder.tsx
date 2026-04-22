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
  Contact,
  ResponsibilityPath,
  AutocompleteSuggestion,
} from "@/types/responsibility";
import { ROLE_OPTIONS } from "@/types/responsibility";
import type { YouthTeamForContactVM } from "@/lib/repositories/team.repository";
import {
  hasTeamRoleContact,
  resolveTeamRoleContact,
  mapAgeToJcGroup,
} from "@/lib/team-role-resolution";
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
  /** Youth teams for dynamic team-role contact resolution */
  youthTeams?: YouthTeamForContactVM[];
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

const DEPARTMENT_LABELS: Record<string, string> = {
  hoofdbestuur: "Hoofdbestuur",
  jeugdbestuur: "Jeugdbestuur",
  algemeen: "Algemeen",
};

function getContactLabel(contact: Contact): string {
  switch (contact.contactType) {
    case "position":
      return contact.position ?? "—";
    case "team-role":
      return contact.teamRole === "trainer" ? "Trainer" : "Afgevaardigde";
    case "manual":
      return (
        contact.role ??
        (contact.department
          ? (DEPARTMENT_LABELS[contact.department] ?? contact.department)
          : "—")
      );
    default:
      return "—";
  }
}

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
  youthTeams = [],
}: ResponsibilityFinderProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [questionText, setQuestionText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedResult, setSelectedResult] =
    useState<ResponsibilityPath | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [activeDescendantIdx, setActiveDescendantIdx] = useState(-1);
  const [selectedVectorId, setSelectedVectorId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
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
    setSelectedTeamId("");
    setShowSuggestions(true);
  };

  // Handle "Opnieuw beginnen" — full reset
  const handleReset = () => {
    setSelectedRole("");
    setSelectedResult(null);
    setSelectedVectorId(null);
    setSelectedTeamId("");
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
        <div className="text-kcvv-gray-blue mb-8 flex flex-wrap items-center gap-3 text-2xl font-bold md:text-4xl">
          <span
            style={{
              fontFamily: "var(--font-family-title)",
            }}
          >
            Ik ben
          </span>

          {/* Role Dropdown */}
          <div className="role-dropdown-container relative inline-block">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="text-kcvv-gray-blue focus-visible:ring-kcvv-green inline-flex min-h-11 min-w-11 items-center gap-2 rounded border-b-4 px-4 py-2 font-bold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
                className={`h-5 w-5 transition-transform ${showRoleDropdown ? "rotate-180" : ""}`}
                strokeWidth={2}
              />
            </button>

            {showRoleDropdown && (
              <div
                ref={dropdownRef}
                className="animate-fadeIn absolute top-full left-0 z-50 mt-2 min-w-[200px] rounded-lg border-2 border-gray-200 bg-white shadow-xl"
              >
                {ROLE_OPTIONS.map((role, idx) => {
                  const isSelected = selectedRole === role.value;
                  return (
                    <button
                      key={role.value}
                      onClick={() => handleRoleSelect(role.value)}
                      className={`focus-visible:ring-kcvv-green flex min-h-11 w-full items-center justify-between px-4 py-3 text-left text-lg font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset ${isSelected ? "" : "hover:bg-gray-50"} ${idx === ROLE_OPTIONS.length - 1 ? "rounded-b-lg" : ""} ${idx === 0 ? "rounded-t-lg" : ""} `}
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
                        <Check className="h-5 w-5 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <span
            style={{
              fontFamily: "var(--font-family-title)",
            }}
          >
            en ik
          </span>
        </div>

        {/* Onboarding Hints — shown before role selection */}
        {showOnboardingHints && resolvedHints.length > 0 && (
          <div className="mb-8">
            <p className="text-kcvv-gray mb-3 text-sm">
              Of klik op een veelgestelde vraag:
            </p>
            <div className="flex flex-wrap gap-3">
              {resolvedHints.map((hint) => (
                <button
                  key={hint.slug}
                  onClick={() => handleHintClick(hint.path)}
                  className="hover:border-kcvv-green hover:text-kcvv-green focus-visible:ring-kcvv-green min-h-11 rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
            <div className="group relative">
              <div className="text-kcvv-gray group-focus-within:text-kcvv-green pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 transition-colors">
                <svg
                  className="h-6 w-6"
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
                className="border-kcvv-gray-light focus:border-kcvv-green focus:ring-kcvv-green/20 placeholder:text-kcvv-gray w-full rounded-lg border-2 bg-white py-4 pr-14 pl-14 text-xl font-medium shadow-sm transition-all duration-300 placeholder:font-normal hover:shadow-md focus:ring-2 focus:outline-none md:text-2xl"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              />

              {questionText && (
                <button
                  onClick={() => {
                    setQuestionText("");
                    setActiveDescendantIdx(-1);
                    inputRef.current?.focus();
                  }}
                  className="text-kcvv-gray focus-visible:ring-kcvv-green absolute top-1/2 right-3 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:bg-red-500 hover:text-white focus-visible:ring-2 focus-visible:outline-none"
                  aria-label="Clear search"
                >
                  <X size={20} />
                </button>
              )}

              {/* Loading State */}
              {showSuggestions && questionText && semanticLoading && (
                <div className="animate-fadeIn absolute z-50 mt-3 w-full rounded-xl border-2 border-gray-200 bg-white p-4 text-center shadow-xl">
                  <p className="text-kcvv-gray text-sm">Zoeken...</p>
                </div>
              )}

              {/* Empty State */}
              {showSuggestions &&
                questionText &&
                !semanticLoading &&
                suggestions.length === 0 && (
                  <div className="animate-fadeIn absolute z-50 mt-3 w-full rounded-xl border-2 border-gray-200 bg-white p-6 text-center shadow-xl">
                    <div className="mb-3 text-5xl">🔍</div>
                    <h3 className="text-kcvv-gray-blue mb-1 text-lg font-bold">
                      Geen resultaten gevonden
                    </h3>
                    <p className="text-kcvv-gray text-sm">
                      Probeer een andere zoekterm of selecteer een andere rol
                    </p>
                  </div>
                )}

              {/* AI Answer Card */}
              {showSuggestions &&
                semanticAnswer &&
                !semanticLoading &&
                !selectedResult && (
                  <div className="bg-kcvv-success/10 border-kcvv-success/25 mt-3 mb-1 rounded-xl border p-5">
                    <div className="text-kcvv-green-dark mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                      <Sparkles className="h-3 w-3" />
                      AI-antwoord
                    </div>
                    <p className="text-kcvv-gray-blue text-sm leading-relaxed">
                      {semanticAnswer}
                    </p>
                    <p className="text-kcvv-gray mt-3 text-xs">
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
                  className="animate-fadeIn absolute z-50 mt-3 max-h-96 w-full overflow-y-auto rounded-xl border-2 border-gray-200 bg-white shadow-2xl"
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
                        className={`min-h-11 w-full cursor-pointer px-5 py-4 text-left transition-all duration-200 ${idx !== 0 ? "border-t border-gray-100" : ""} ${isActive ? "bg-gray-100" : "hover:bg-gray-50"} group relative overflow-hidden ${idx === 0 ? "rounded-t-xl" : ""} ${idx === suggestions.length - 1 ? "rounded-b-xl" : ""} `}
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
                        <div className="ml-1 flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {suggestion.path.icon &&
                              (() => {
                                const IconComponent = getIcon(
                                  suggestion.path.icon,
                                );
                                return (
                                  <div className="flex h-10 w-10 items-center justify-center">
                                    <IconComponent
                                      size={24}
                                      className={colors.text}
                                      strokeWidth={1.5}
                                    />
                                  </div>
                                );
                              })()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-semibold text-gray-900">
                              {suggestion.path.question}
                            </div>
                            <div className="mt-1 line-clamp-2 text-sm text-gray-600">
                              {suggestion.path.summary}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span
                                className={`border px-2 py-0.5 text-xs ${colors.text} rounded-md font-medium tracking-wide uppercase`}
                                style={{ borderColor: colors.accent }}
                              >
                                {suggestion.path.category}
                              </span>
                              <span className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                <User size={12} />
                                {getContactLabel(
                                  suggestion.path.primaryContact,
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
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
          <div className="animate-fadeIn mt-8">
            {/* Navigation Buttons */}
            <div className="mb-4 flex gap-3">
              <button
                onClick={handleBack}
                className="focus-visible:ring-kcvv-green inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <ArrowLeft size={16} />
                Terug
              </button>
              <button
                onClick={handleReset}
                className="focus-visible:ring-kcvv-green inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <RotateCcw size={16} />
                Opnieuw beginnen
              </button>
            </div>

            {/* Team Selector — shown when result has team-role contacts */}
            {hasTeamRoleContact(selectedResult) && youthTeams.length > 0 && (
              <TeamSelector
                teams={youthTeams}
                selectedTeamId={selectedTeamId}
                onTeamSelect={setSelectedTeamId}
              />
            )}

            <ResultCard
              path={selectedResult}
              onMemberSelect={onMemberSelect}
              analytics={analytics}
              selectedTeam={youthTeams.find((t) => t.id === selectedTeamId)}
            />

            <FeedbackWidget
              pathSlug={selectedResult.id}
              pathTitle={selectedResult.question}
            />

            {selectedVectorId && <RelatedPaths sanityId={selectedVectorId} />}

            {/* Fallback Contact Block */}
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
              <h4 className="mb-3 font-bold text-gray-900">
                Staat jouw vraag er niet bij?
              </h4>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/club/contact"
                  className="text-kcvv-green hover:text-kcvv-green-hover focus-visible:ring-kcvv-green inline-flex min-h-11 items-center gap-2 rounded px-4 py-2 text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  Neem contact op
                </Link>
                <Link
                  href="/club/organigram"
                  className="text-kcvv-green hover:text-kcvv-green-hover focus-visible:ring-kcvv-green inline-flex min-h-11 items-center gap-2 rounded px-4 py-2 text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
 * Renders contact information based on contactType discriminator.
 * Supports position (organigramNode), team-role (placeholder), and manual (inline) contacts.
 */
function ContactDisplay({
  contact,
  pathId,
  analytics,
  onMemberSelect,
  compact,
  selectedTeam,
}: {
  contact: Contact;
  pathId: string;
  analytics: ReturnType<typeof useResponsibilityAnalytics>;
  onMemberSelect?: (memberId: string) => void;
  compact?: boolean;
  selectedTeam?: YouthTeamForContactVM;
}) {
  const titleClass = compact
    ? "font-semibold text-gray-700 mb-1"
    : "font-bold text-kcvv-gray-blue";
  const iconSize = compact ? "w-3 h-3" : "w-4 h-4";

  switch (contact.contactType) {
    case "position":
      return (
        <div className="space-y-2">
          {contact.position && (
            <div className={titleClass}>{contact.position}</div>
          )}
          {contact.members?.map((member) => (
            <div key={`details-${member.id}`} className="space-y-1">
              <div className="text-gray-600">{member.name}</div>
              {member.email && (
                <div>
                  <a
                    href={`mailto:${member.email}`}
                    onClick={() =>
                      analytics.trackContactClicked(pathId, "email")
                    }
                    className="text-kcvv-green hover:text-kcvv-green-hover inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    <svg
                      className={iconSize}
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
                    {member.email}
                  </a>
                </div>
              )}
              {member.phone && (
                <div>
                  <a
                    href={`tel:${member.phone}`}
                    onClick={() =>
                      analytics.trackContactClicked(pathId, "phone")
                    }
                    className="text-kcvv-green hover:text-kcvv-green-hover inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    <svg
                      className={iconSize}
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
                    {member.phone}
                  </a>
                </div>
              )}
            </div>
          ))}
          {onMemberSelect &&
            contact.members
              ?.filter((m) => m.id)
              .map((member) => (
                <div key={`org-${member.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      analytics.trackOrganigramLink(pathId, member.id);
                      onMemberSelect(member.id);
                    }}
                    className="text-kcvv-green hover:text-kcvv-green-hover inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    <svg
                      className={iconSize}
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
                    {(contact.members?.length ?? 0) > 1
                      ? `${member.name} in organigram`
                      : "Bekijk in organigram"}
                  </button>
                </div>
              ))}
        </div>
      );

    case "team-role": {
      if (selectedTeam && contact.teamRole) {
        const resolved =
          resolveTeamRoleContact(selectedTeam.staff, contact.teamRole) ??
          (contact.teamRoleFallback
            ? resolveTeamRoleContact(
                selectedTeam.staff,
                contact.teamRoleFallback,
              )
            : null);
        if (resolved) {
          return (
            <ContactDisplay
              contact={resolved}
              pathId={pathId}
              analytics={analytics}
              onMemberSelect={onMemberSelect}
              compact={compact}
            />
          );
        }
        // Fallback: no matching role on the selected team
        const roleLabel =
          contact.teamRole === "trainer" ? "trainer" : "afgevaardigde";
        return (
          <div className="space-y-2">
            <div className={titleClass}>
              {contact.teamRole === "trainer"
                ? "Trainer van je ploeg"
                : "Afgevaardigde van je ploeg"}
            </div>
            <p className="text-sm text-amber-600">
              Er is nog geen {roleLabel} toegewezen aan {selectedTeam.name}.
              Neem contact op via de volgende stap in het escalatiepad.
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-2">
          <div className={titleClass}>
            {contact.teamRole === "trainer"
              ? "Trainer van je ploeg"
              : "Afgevaardigde van je ploeg"}
          </div>
          <p className="text-sm text-gray-500 italic">
            Selecteer je ploeg om de contactpersoon te zien
          </p>
        </div>
      );
    }

    case "manual":
      return (
        <div className="space-y-2">
          {(contact.role || contact.department) && (
            <div className={titleClass}>
              {contact.role ??
                (contact.department
                  ? (DEPARTMENT_LABELS[contact.department] ??
                    contact.department)
                  : undefined)}
            </div>
          )}
          {contact.email && (
            <div>
              <a
                href={`mailto:${contact.email}`}
                onClick={() => analytics.trackContactClicked(pathId, "email")}
                className="text-kcvv-green hover:text-kcvv-green-hover inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                <svg
                  className={iconSize}
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
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div>
              <a
                href={`tel:${contact.phone}`}
                onClick={() => analytics.trackContactClicked(pathId, "phone")}
                className="text-kcvv-green hover:text-kcvv-green-hover inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                <svg
                  className={iconSize}
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
                {contact.phone}
              </a>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

/**
 * Display a formatted card for a ResponsibilityPath, showing its header (icon, question, category, summary), the primary contact panel, and an ordered list of steps.
 *
 * @param path - The responsibility path to display
 * @param onMemberSelect - Optional callback invoked with a staffMember ID when the "Bekijk in organigram" action is triggered
 * @returns A React element rendering the styled result card for the provided `path`
 */
function ResultCard({
  path,
  onMemberSelect,
  analytics,
  selectedTeam,
}: {
  path: ResponsibilityPath;
  onMemberSelect?: (memberId: string) => void;
  analytics: ReturnType<typeof useResponsibilityAnalytics>;
  selectedTeam?: YouthTeamForContactVM;
}) {
  const colors =
    categoryColors[path.category as keyof typeof categoryColors] ??
    categoryColors.algemeen;

  // Compute JC group from selected team's age for step highlighting
  const jcGroup = selectedTeam ? mapAgeToJcGroup(selectedTeam.age) : null;

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
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4 border-b border-gray-100 pb-6">
          {path.icon &&
            (() => {
              const IconComponent = getIcon(path.icon);
              return (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
                  <IconComponent
                    size={32}
                    className={colors.text}
                    strokeWidth={1.5}
                  />
                </div>
              );
            })()}
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3
                className="text-2xl font-bold text-gray-900"
                style={{
                  fontFamily: "var(--font-family-title)",
                }}
              >
                {path.question}
              </h3>
              <span
                className={`border px-2 py-0.5 text-xs ${colors.text} rounded-md font-medium tracking-wide uppercase`}
                style={{ borderColor: colors.accent }}
              >
                {path.category}
              </span>
            </div>
            <p className="text-base text-gray-600">{path.summary}</p>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <h4 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100">
              <User size={16} className="text-gray-600" />
            </div>
            Contactpersoon
          </h4>
          <ContactDisplay
            contact={path.primaryContact}
            pathId={path.id}
            analytics={analytics}
            onMemberSelect={onMemberSelect}
            selectedTeam={selectedTeam}
          />
        </div>

        {/* Steps */}
        <div>
          <h4 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100">
              <Clipboard size={16} className="text-gray-600" />
            </div>
            Wat moet je doen?
          </h4>
          <ol className="space-y-3">
            {path.steps.map((step, stepIdx) => {
              const safeStepLink = toSafeHref(step.link);
              const isHighlightedJc =
                jcGroup !== null &&
                step.contact?.nodeId === `organigramNode-jc-${jcGroup}`;
              return (
                <li
                  key={stepIdx}
                  className={`group flex gap-3 ${isHighlightedJc ? "bg-kcvv-green/5 ring-kcvv-green/20 -mx-2 rounded-lg px-2 py-1 ring-1" : ""}`}
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-bold text-white shadow-md transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: isHighlightedJc
                        ? "var(--color-kcvv-green)"
                        : colors.accent,
                    }}
                  >
                    {stepIdx + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm leading-relaxed text-gray-700">
                      {step.description}
                    </p>
                    {safeStepLink && (
                      <a
                        href={safeStepLink}
                        onClick={() =>
                          analytics.trackStepLinkClicked(path.id, stepIdx)
                        }
                        className="text-kcvv-green hover:text-kcvv-green-hover mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                      >
                        <svg
                          className="h-4 w-4"
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
                      <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                        <ContactDisplay
                          contact={step.contact}
                          pathId={path.id}
                          analytics={analytics}
                          onMemberSelect={onMemberSelect}
                          compact
                          selectedTeam={selectedTeam}
                        />
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

/**
 * Team selection dropdown for dynamic team-role contact resolution.
 * Shown when the selected responsibility has a team-role contact.
 */
function TeamSelector({
  teams,
  selectedTeamId,
  onTeamSelect,
}: {
  teams: YouthTeamForContactVM[];
  selectedTeamId: string;
  onTeamSelect: (teamId: string) => void;
}) {
  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5">
      <label
        htmlFor="team-selector"
        className="mb-2 block font-bold text-gray-900"
      >
        Selecteer je ploeg
      </label>
      <p className="mb-3 text-sm text-gray-600">
        Om de juiste contactpersoon te tonen, moeten we weten bij welke ploeg je
        hoort.
      </p>
      <select
        id="team-selector"
        value={selectedTeamId}
        onChange={(e) => onTeamSelect(e.target.value)}
        className="focus:border-kcvv-green focus:ring-kcvv-green/20 min-h-11 w-full max-w-sm rounded-lg border-2 border-gray-300 bg-white px-4 py-2 font-medium text-gray-900 focus:ring-2 focus:outline-none"
      >
        <option value="">Kies een ploeg...</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}
