/**
 * SearchInputShell — Non-interactive visual mimic of HulpSearchInput.
 *
 * Used in Suspense fallbacks and route-level loading skeletons so the
 * search area appears immediately while data loads. Server component —
 * no "use client" needed.
 */

import { Search } from "@/lib/icons";

export function SearchInputShell() {
  return (
    <div>
      <div className="relative mx-auto w-full max-w-2xl">
        <div className="text-kcvv-gray pointer-events-none absolute inset-y-0 left-5 flex items-center">
          <Search className="h-6 w-6" aria-hidden="true" />
        </div>
        <div
          className="w-full rounded-sm border border-gray-200 bg-white py-5 pr-5 pl-14 shadow-md"
          style={{ height: "60px" }}
          aria-hidden="true"
        />
      </div>
      <p className="text-kcvv-gray mt-3 text-center text-xs">
        Tip: probeer trefwoorden zoals <em>inschrijving</em>,{" "}
        <em>sportongeval</em>, of <em>transfer</em>.
      </p>
    </div>
  );
}
