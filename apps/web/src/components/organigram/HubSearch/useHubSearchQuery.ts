import { createContext, useContext, useState } from "react";

// The context and both hooks live here, not in the 'use client' provider file: a hook
// exported from a client component file reaches a Server Component as a client reference.
export interface HubSearchQueryContextValue {
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

export const HubSearchQueryContext =
  createContext<HubSearchQueryContextValue | null>(null);

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
 * This never returns `null`: a lone `<HubSearch>` is a working search box,
 * not a degraded one.
 */
export const useHubSearchQuery = (): HubSearchQuery => {
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
};

const noop = () => {};

/**
 * Publishes the pinned strip's height for the hub's searches. Called by the
 * section nav, which is the only component that measures its own bar. No-op
 * outside a provider.
 */
export const useHubSearchTopInsetPublisher = (): ((next: number) => void) => {
  const shared = useContext(HubSearchQueryContext);
  return shared?.setTopInset ?? noop;
};
