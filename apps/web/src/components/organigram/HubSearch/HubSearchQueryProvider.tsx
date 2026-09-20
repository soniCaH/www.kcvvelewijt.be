"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
 * again — the very gesture that started the handoff.
 *
 * `<HubSearch>` falls back to its own local state when no provider is above it
 * (Storybook, tests, any single-instance host), so the component stays usable
 * on its own.
 */
interface HubSearchQueryContextValue {
  query: string;
  setQuery: (next: string) => void;
  /** Whether the results popup is open, shared so the handoff carries it. */
  open: boolean;
  setOpen: (next: boolean) => void;
}

const HubSearchQueryContext = createContext<HubSearchQueryContextValue | null>(
  null,
);

/** The shared hub query — `null` outside a `<HubSearchQueryProvider>`. */
export function useHubSearchQueryContext(): HubSearchQueryContextValue | null {
  return useContext(HubSearchQueryContext);
}

export interface HubSearchQueryProviderProps {
  children: ReactNode;
}

export function HubSearchQueryProvider({
  children,
}: HubSearchQueryProviderProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({ query, setQuery, open, setOpen }),
    [query, open],
  );

  return (
    <HubSearchQueryContext.Provider value={value}>
      {children}
    </HubSearchQueryContext.Provider>
  );
}
