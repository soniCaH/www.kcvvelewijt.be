"use client";

import { ServerErrorState } from "./server-error-state";

/**
 * 500 error boundary for a crash inside a page (Phase 8.4). Renders the shared
 * `<ServerErrorState>` (locked 500 copy, `8e2-copy-locked.md`) with the
 * `retry()` callback wired to the primary "Probeer opnieuw" action (#3298).
 * A crash in the root layout itself lands in `global-error.tsx` instead.
 *
 * No `metadata`/`noindex` export is possible here — error boundaries are Client
 * Components — but the response carries the non-indexable 500 status, so a
 * crawler never indexes it.
 */
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ServerErrorState retry={retry} />;
}
