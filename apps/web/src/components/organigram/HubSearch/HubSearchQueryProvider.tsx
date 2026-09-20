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
 * again — the very gesture that started the handoff. The instance that loses
 * the screen releases focus instead of passing it on.
 *
 * `useHubSearchQuery()` falls back to per-instance state when no provider is
 * above it (Storybook, tests, any single-instance host), so `<HubSearch>`
 * stays usable on its own.
 */
interface HubSearchQueryContextValue {
  query: string;
  setQuery: (next: string) => void;
  /** Whether the results popup is open, shared so the handoff carries it. */
  open: boolean;
  setOpen: (next: boolean) => void;
  /**
   * Height of the pinned strip above the content — the global header plus any
   * sticky section bar — published by whichever section nav is on the page.
   *
   * A `<HubSearch>` needs it to know when its own box has tucked behind that
   * strip, which is not the same moment as leaving the viewport. It lives here
   * rather than being re-derived per instance because the section nav already
   * measures it (`useSectionNav`'s `topInset`) and re-measures it on resize;
   * reading the published `scroll-padding-top` back instead would snapshot the
   * `0`-seeded first paint. `0` on a page with no sticky chrome, which is the
   * safe default: nothing is ever suppressed early.
   */
  topInset: number;
  setTopInset: (next: number) => void;
}

const HubSearchQueryContext = createContext<HubSearchQueryContextValue | null>(
  null,
);

export interface HubSearchQuery {
  query: string;
  setQuery: (next: string) => void;
  open: boolean;
  setOpen: (next: boolean) => void;
  topInset: number;
}

/**
 * The hub's shared search query — or this instance's own, when there is no
 * `<HubSearchQueryProvider>` above it. Both `useState` calls below run
 * unconditionally; only which pair is returned is a branch, so the hook order
 * is stable either way.
 *
 * Unlike its peer `useHubMemberPanel`, this never returns `null`: a lone
 * `<HubSearch>` is a working search box, not a degraded one.
 */
export function useHubSearchQuery(): HubSearchQuery {
  const shared = useContext(HubSearchQueryContext);
  const [localQuery, setLocalQuery] = useState("");
  const [localOpen, setLocalOpen] = useState(false);

  return shared
    ? {
        query: shared.query,
        setQuery: shared.setQuery,
        open: shared.open,
        setOpen: shared.setOpen,
        topInset: shared.topInset,
      }
    : {
        query: localQuery,
        setQuery: setLocalQuery,
        open: localOpen,
        setOpen: setLocalOpen,
        topInset: 0,
      };
}

/**
 * Publishes the pinned strip's height for the hub's searches. Called by the
 * section nav, which is the only component that measures its own bar. No-op
 * outside a provider.
 */
export function useHubSearchTopInsetPublisher(): (next: number) => void {
  const shared = useContext(HubSearchQueryContext);
  return shared?.setTopInset ?? noop;
}

function noop() {}

export interface HubSearchQueryProviderProps {
  children: ReactNode;
}

export function HubSearchQueryProvider({
  children,
}: HubSearchQueryProviderProps) {
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
}
