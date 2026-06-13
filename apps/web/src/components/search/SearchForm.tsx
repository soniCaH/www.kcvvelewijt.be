"use client";

/**
 * SearchForm Component
 *
 * 8s1 "hard-shadow" search field: a cream input + warm-gold magnifier-icon
 * submit cell inside a 2px-ink border with an offset paper shadow. Designed to
 * sit on the `<SearchMasthead>` dark band (the input surface stays cream so it
 * reads on any ground). No "ZOEK" word — the magnifier carries the action.
 */

import { useState, FormEvent } from "react";
import { MagnifyingGlass, X } from "@/lib/icons.redesign";
import { cn } from "@/lib/utils/cn";
import { searchFieldShellClasses } from "./search-field-styles";

export interface SearchFormProps {
  /**
   * Initial search value
   */
  initialValue?: string;
  /**
   * Callback when search is submitted
   */
  onSearch: (query: string) => void;
  /**
   * Loading state
   */
  isLoading?: boolean;
  /**
   * Placeholder text
   */
  placeholder?: string;
}

/**
 * Search form with input and magnifier submit button
 */
export const SearchForm = ({
  initialValue = "",
  onSearch,
  isLoading = false,
  placeholder = "Zoek nieuws, spelers, teams...",
}: SearchFormProps) => {
  const [value, setValue] = useState(initialValue);
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);

  if (prevInitialValue !== initialValue) {
    setPrevInitialValue(initialValue);
    setValue(initialValue);
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedValue = value.trim();
    if (trimmedValue.length >= 2) {
      onSearch(trimmedValue);
    }
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  const canSubmit = value.trim().length >= 2 && !isLoading;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        searchFieldShellClasses,
        "focus-within:ring-warm transition-shadow focus-within:ring-2",
      )}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Zoekterm"
        className="text-ink placeholder:text-ink-muted bg-cream min-w-0 flex-1 px-4 py-4 text-[length:var(--text-body-lg)] outline-none focus:outline-hidden disabled:opacity-60 md:px-5"
        disabled={isLoading}
        autoFocus
      />

      {/* Clear — ghost cell blended into the cream input, left of the warm
          magnifier cell. Always enabled (resets even while a fetch is in
          flight and the input is disabled). */}
      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="text-ink-muted hover:text-ink bg-cream flex items-center px-2 transition-colors"
          aria-label="Wis zoekopdracht"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      )}

      {/* Submit — warm-gold accent cell; magnifier replaces the "ZOEK" word. */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="bg-warm text-ink border-ink flex items-center border-l-2 px-5 transition-[filter] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Zoeken"
      >
        <MagnifyingGlass className="h-[23px] w-[23px]" aria-hidden />
      </button>
    </form>
  );
};
