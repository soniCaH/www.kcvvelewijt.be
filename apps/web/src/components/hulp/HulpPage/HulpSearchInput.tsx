"use client";

/**
 * HulpSearchInput — Controlled search input for the Hulp page
 *
 * A simple controlled input with a leading Search icon and the visual
 * styling from the prototype. State management is left to the parent.
 */

import { Search } from "@/lib/icons";

export interface HulpSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible label for the input — defaults to "Zoek hulp" */
  ariaLabel?: string;
}

export function HulpSearchInput({
  value,
  onChange,
  placeholder = "Waar ben je naar op zoek?",
  ariaLabel = "Zoek hulp",
}: HulpSearchInputProps) {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="text-kcvv-gray pointer-events-none absolute inset-y-0 left-5 flex items-center">
        <Search className="h-6 w-6" />
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="text-kcvv-black placeholder:text-kcvv-gray focus:border-kcvv-green-bright focus:ring-kcvv-green-bright/30 w-full rounded-sm border border-gray-200 bg-white py-5 pr-5 pl-14 text-base shadow-md focus:ring-2 focus:outline-none"
      />
    </div>
  );
}
