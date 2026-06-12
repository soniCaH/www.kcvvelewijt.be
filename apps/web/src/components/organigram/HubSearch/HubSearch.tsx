"use client";

/**
 * <HubSearch> — the unified front-door search for the `/hulp` hub.
 *
 * One search box spanning BOTH intents (decision 7o2c / finding-model I):
 * - a name / function → a **person** (Structuur)
 * - a problem / question → an **answer** (Hulp)
 *
 * Results are ranked by keyword (`searchHub`) and interleaved (person, answer,
 * …) in a single dropdown. It replaces both the organigram `<UnifiedSearchBar>`
 * and the finder's `<HulpSearchInput>` on the hub.
 *
 * Tracer behaviour (Phase 1, #2052): selecting a result smooth-scrolls to the
 * relevant hub section (`#structuur` for a person, `#hulp` for an answer). The
 * person side-panel (#2055) and the answer accordion (#2056) become the richer
 * selection targets in their phases; the search spine is proven here. Semantic
 * question search (#2057) augments `searchHub` later — people stay keyword.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { MagnifyingGlass, Question, User, X } from "@/lib/icons.redesign";
import { trackEvent } from "@/lib/analytics/track-event";
import { getCategoryInfo } from "@/lib/responsibility-utils";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import { searchHub, type HubSearchResult } from "./hub-search";

export type HubSearchVariant = "hero" | "nav";

export interface HubSearchProps {
  /** Members (organigram nodes) to search for people. */
  members: OrgChartNode[];
  /** Responsibility paths to search for answers. */
  responsibilityPaths: ResponsibilityPath[];
  /**
   * `"hero"` — the prominent cream, ink-bordered box inside the dark hero band.
   * `"nav"` — the compact instance repeated in the sticky `<OrganigramSectionNav>`.
   */
  variant?: HubSearchVariant;
  placeholder?: string;
  /** Max results per category (people / answers) before interleaving. */
  maxResults?: number;
  /** Extra classes on the root (e.g. `max-w-[480px]`). */
  className?: string;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function HubSearch({
  members,
  responsibilityPaths,
  variant = "hero",
  placeholder = "Zoek een naam, functie of vraag…",
  maxResults = 5,
  className = "",
}: HubSearchProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debouncedValue, setDebouncedValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Debounce the query for ranking (200ms — matches the legacy search feel).
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), 200);
    return () => clearTimeout(id);
  }, [value]);

  const results = useMemo(
    () => searchHub(debouncedValue, members, responsibilityPaths, maxResults),
    [debouncedValue, members, responsibilityPaths, maxResults],
  );

  const showResults = isFocused && value.trim().length > 0;

  // Dismiss the dropdown on an outside click.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !dropdownRef.current?.contains(target) &&
        !inputRef.current?.contains(target)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const select = (result: HubSearchResult) => {
    // `organigram_search_used` — length only, no query content (PRD §6, matches
    // the `responsibility_search` privacy convention).
    trackEvent("organigram_search_used", { query_length: value.length });

    if (typeof window !== "undefined") {
      // A person scrolls to the directory (`#structuur`); an answer deep-links
      // the finder accordion by its slug, which `<HulpFinder>` opens + scrolls
      // to on `hashchange` (#2056).
      window.location.hash =
        result.type === "member" ? "structuur" : result.path.id;
    }
    setValue(
      result.type === "member"
        ? (result.member.members[0]?.name ?? result.member.title)
        : result.path.question,
    );
    setSelectedIndex(-1);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!showResults) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          select(results[selectedIndex]);
        }
        break;
      case "Escape":
        event.preventDefault();
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  const isHero = variant === "hero";
  const boxShadow = isHero
    ? "shadow-[4px_4px_0_0_var(--color-ink)]"
    : "shadow-[2px_2px_0_0_var(--color-ink)]";
  const iconSize = isHero ? 20 : 16;
  // The hero input is wide enough for the dropdown to match it; the compact nav
  // input is not — give its dropdown a comfortable reading width, right-aligned
  // to the input and capped to the viewport on small screens.
  const dropdownWidth = isHero
    ? "w-full"
    : "right-0 w-[24rem] max-w-[calc(100vw-1.5rem)]";

  return (
    <div className={`relative ${className}`}>
      <div
        className={`border-ink bg-cream flex items-center gap-2 border-2 ${boxShadow} ${
          isHero ? "px-3 py-3" : "px-2.5 py-2"
        }`}
      >
        <span className="text-jersey-deep flex-shrink-0">
          <MagnifyingGlass size={iconSize} aria-hidden />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-label="Zoek een persoon of hulpvraag"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls={showResults ? listboxId : undefined}
          aria-activedescendant={
            selectedIndex >= 0 && selectedIndex < results.length
              ? `${listboxId}-opt-${selectedIndex}`
              : undefined
          }
          className={`text-ink placeholder:text-ink-muted w-full bg-transparent focus:outline-none ${
            isHero ? "text-[15px]" : "text-[13px]"
          }`}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
            aria-label="Wissen"
            className="text-ink-muted hover:text-ink flex-shrink-0 transition-colors"
          >
            <X size={iconSize} aria-hidden />
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          aria-label="Zoekresultaten"
          className={`border-ink bg-cream absolute z-50 mt-2 max-h-96 ${dropdownWidth} overflow-y-auto border-2 shadow-[4px_4px_0_0_var(--color-ink)]`}
        >
          {results.map((result, index) => {
            const isSelected = index === selectedIndex;
            const rowClass = `flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
              isSelected ? "bg-jersey-deep/10" : "hover:bg-cream-soft"
            } border-paper-edge border-b last:border-b-0`;

            if (result.type === "member") {
              const person = result.member.members[0];
              const name = person?.name ?? result.member.title;
              return (
                <button
                  key={`member-${result.member.id}`}
                  type="button"
                  id={`${listboxId}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => select(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={rowClass}
                >
                  <span className="border-ink bg-cream-soft text-jersey-deep flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2">
                    {person?.imageUrl ? (
                      <Image
                        src={person.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : name ? (
                      <span className="font-display text-sm font-black">
                        {initials(name)}
                      </span>
                    ) : (
                      <User size={18} aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-display text-ink block truncate font-semibold">
                      {name}
                    </span>
                    <span className="text-ink-muted block truncate font-mono text-[11px] tracking-wide uppercase">
                      {result.member.title}
                      {result.extraPositions > 0 &&
                        ` · +${result.extraPositions} ${
                          result.extraPositions === 1 ? "functie" : "functies"
                        }`}
                    </span>
                  </span>
                </button>
              );
            }

            const category = getCategoryInfo(result.path.category);
            return (
              <button
                key={`answer-${result.path.id}`}
                type="button"
                id={`${listboxId}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => select(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`${rowClass} items-start`}
              >
                <span className="text-jersey-deep mt-0.5 flex-shrink-0">
                  <Question size={20} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-jersey-deep mb-0.5 block font-mono text-[10px] font-semibold tracking-[0.08em] uppercase">
                    {category.label}
                  </span>
                  <span className="text-ink block text-sm font-medium">
                    {result.path.question}
                  </span>
                  <span className="text-ink-muted mt-0.5 line-clamp-1 block text-xs">
                    {result.path.summary}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showResults && results.length === 0 && (
        <div
          ref={dropdownRef}
          className={`border-ink bg-cream absolute z-50 mt-2 ${dropdownWidth} border-2 px-4 py-6 text-center shadow-[4px_4px_0_0_var(--color-ink)]`}
        >
          <p className="text-ink text-sm">
            Geen resultaten voor &ldquo;{value}&rdquo;
          </p>
          <p className="text-ink-muted mt-1 text-xs">
            Probeer een andere zoekterm.
          </p>
        </div>
      )}
    </div>
  );
}
