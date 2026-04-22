"use client";

/**
 * SearchForm Component
 * Search input field with submit button
 */

import { useState, FormEvent, useEffect } from "react";
import { Icon } from "@/components/design-system";
import { Search, X } from "lucide-react";

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
 * Search form with input and submit button
 */
export const SearchForm = ({
  initialValue = "",
  onSearch,
  isLoading = false,
  placeholder = "Zoek nieuws, spelers, teams...",
}: SearchFormProps) => {
  const [value, setValue] = useState(initialValue);

  // Sync with initialValue changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

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

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute top-1/2 left-5 -translate-y-1/2 text-gray-400">
          <Icon icon={Search} size="md" />
        </div>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="focus:border-green-main focus:ring-green-main/20 w-full rounded-lg border-2 border-gray-200 py-5 pr-28 pl-14 text-xl transition-colors focus:ring-2 focus:outline-none"
          disabled={isLoading}
          autoFocus
        />

        {/* Clear Button */}
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1/2 right-24 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Wis zoekopdracht"
          >
            <Icon icon={X} size="md" />
          </button>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || value.trim().length < 2}
          className="bg-green-main hover:bg-green-hover absolute top-1/2 right-2 -translate-y-1/2 rounded-md px-5 py-3 text-base font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Zoek
        </button>
      </div>

      {/* Hint Text */}
      {value.trim().length > 0 && value.trim().length < 2 && (
        <p className="mt-2 text-sm text-gray-500">
          Typ minimaal 2 karakters om te zoeken
        </p>
      )}
    </form>
  );
};
