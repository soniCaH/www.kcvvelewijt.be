/**
 * Shared chrome for the 8s1 "hard-shadow search field".
 *
 * Lives in a plain (non-`"use client"`) module so both the interactive
 * `<SearchForm>` (client) and the server-rendered `<SearchMastheadSkeleton>`
 * render a pixel-identical field shell without the field markup drifting between
 * the two — mirroring the `button-styles.ts` split. Importing a value from a
 * `"use client"` module into a server component would yield a client reference,
 * not the string, so the constant cannot live in `SearchForm.tsx`.
 *
 * Cream input surface, 2px ink border, sharp (square) corners — matching the
 * design-system field/button convention (`fieldChrome` "sharp corners",
 * `Button`/`FilterTabs` `rounded-none`) — with a `5px` offset paper shadow.
 * (The 8s1 mockup's 8px radius is not carried over; the shipped system is
 * square-cornered.)
 */
export const searchFieldShellClasses =
  "border-ink bg-cream flex w-full max-w-[680px] items-stretch overflow-hidden rounded-none border-2 shadow-[5px_5px_0_0_var(--color-ink)]";
