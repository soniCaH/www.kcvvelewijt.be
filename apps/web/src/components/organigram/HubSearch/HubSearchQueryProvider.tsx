"use client";

import { useMemo, useState, type ReactNode } from "react";
import { HubSearchQueryContext } from "./useHubSearchQuery";

/**
 * `<HubSearchQueryProvider>` — the one query the hub's two `<HubSearch>`
 * instances share (#3043).
 *
 * `/hulp` mounts the search twice: once in `<OrganigramHero>`, and once in
 * `<OrganigramSectionNav>`, which reveals its copy only after the hero (and
 * its search) has scrolled behind the sticky chrome. Before this provider each
 * instance held its own `value` / `isFocused`, so scrolling past the hero left
 * the hero's dropdown open above an empty nav field — a live listbox attached
 * to no visible input, painting over the header.
 *
 * Both the query **and** the popup's open state live here, so the instance
 * that is on screen is the one carrying what the visitor typed.
 *
 * **Focus deliberately does not hand over** (owner call, #3043): moving the
 * caret would raise the software keyboard on a phone, which scrolls the page
 * again — the very gesture that started the handoff. The instance that loses
 * the screen releases focus instead of passing it on.
 *
 * `useHubSearchQuery()` falls back to per-instance state when no provider is
 * above it (Storybook, tests, any single-instance host), so `<HubSearch>`
 * stays usable on its own.
 */
export interface HubSearchQueryProviderProps {
  children: ReactNode;
}

export const HubSearchQueryProvider = ({
  children,
}: HubSearchQueryProviderProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [topInset, setTopInset] = useState(0);

  const value = useMemo(
    () => ({ query, setQuery, open, setOpen, topInset, setTopInset }),
    [query, open, topInset],
  );

  return (
    <HubSearchQueryContext.Provider value={value}>
      {children}
    </HubSearchQueryContext.Provider>
  );
};
