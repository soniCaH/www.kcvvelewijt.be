"use client";

/**
 * SearchForm Component
 *
 * 8s1 "hard-shadow" search field: a cream input + warm-gold magnifier-icon
 * submit cell inside a 2px-ink border with an offset paper shadow. Designed to
 * sit on the `<SearchMasthead>` dark band (the input surface stays cream so it
 * reads on any ground). No "ZOEK" word — the magnifier carries the action.
 */

import { useEffect, useState, FormEvent } from "react";
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
  placeholder = "Zoek nieuws, spelers, ploegen…",
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

  // ZOEK-2: debounced auto-search (typeahead). Fires 350ms after typing stops
  // once there are 2+ chars; submit (Enter / magnifier) stays the instant path.
  // Skips the value already reflected in the URL so mount + result-driven
  // `initialValue` syncs don't re-fire.
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === initialValue.trim()) return;
    if (trimmed.length === 1) return;
    const id = setTimeout(() => onSearch(trimmed), 350);
    return () => clearTimeout(id);
  }, [value, initialValue, onSearch]);

  const canSubmit = value.trim().length >= 2 && !isLoading;

  return (
    <form
      onSubmit={handleSubmit}
      // Stable selector hook for VR determinism only (#3033) — never read
      // by application code. Lets a Storybook decorator find this exact
      // element without depending on it being the page's only <form>. See
      // search-form-vr-focus.ts for what sets `data-vr-force-ring` on it.
      data-search-form
      className={cn(
        searchFieldShellClasses,
        "focus-within:ring-warm transition-shadow focus-within:ring-2",
        // VR determinism (#3033): Chromium only paints `:focus-within`
        // when the frame rendering the page is itself focused/active, not
        // merely when `document.activeElement` is set inside it — an
        // environment property of whichever headless VR worker renders a
        // given story, not something a story can force with a script
        // `.focus()` call (React already performs that call for
        // `autoFocus` on mount; it never relies on the native `autofocus`
        // HTML attribute). `data-vr-force-ring` is never rendered by this
        // component; a Storybook decorator sets it directly on this
        // element for VR-tagged stories only, painting the ring from a
        // state the story chooses instead of one dependent on the
        // runner's frame focus. A real visitor's `/zoeken` never gets
        // this attribute, so `focus-within:` above is untouched there.
        "data-[vr-force-ring=true]:ring-warm data-[vr-force-ring=true]:ring-2",
      )}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Zoekterm"
        className="text-ink placeholder:text-ink-muted bg-cream text-body-lg min-w-0 flex-1 px-4 py-4 outline-none focus:outline-hidden md:px-5"
        // ZOEK-2: never disable the field — auto-search sets `isLoading` mid-type,
        // and disabling the input blurs it (the typeahead would lose focus on
        // every keystroke). In-flight requests are aborted in <SearchInterface>.
        autoFocus
      />

      {/* Clear — ghost cell blended into the cream input, left of the warm
          magnifier cell. Always enabled (resets even while a fetch is in
          flight and the input is disabled). */}
      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="text-ink-muted hover:text-ink bg-cream flex min-w-[44px] items-center justify-center px-2 transition-colors"
          aria-label="Wis zoekopdracht"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      )}

      {/* Submit — warm-gold accent cell; magnifier replaces the "ZOEK" word. */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="bg-warm text-ink border-ink flex min-w-[44px] items-center justify-center border-l-2 px-5 transition-[filter] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Zoeken"
      >
        <MagnifyingGlass className="h-[23px] w-[23px]" aria-hidden />
      </button>
    </form>
  );
};
