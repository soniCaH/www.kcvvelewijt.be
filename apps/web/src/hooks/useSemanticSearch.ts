"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface SemanticSearchResult {
  id: string;
  slug: string;
  type: "responsibility" | "article" | "page";
  score: number;
  title: string;
  excerpt: string;
}

interface UseSemanticSearchOptions {
  type?: "responsibility" | "article" | "general";
  limit?: number;
  debounceMs?: number;
}

export interface UseSemanticSearchReturn {
  results: SemanticSearchResult[];
  answer: string | undefined;
  loading: boolean;
  /**
   * Whether the last settled fetch failed. A flag, not the raw error
   * message: neither of today's two consumers (`HubSearch`'s keyword
   * fallback, `useSemanticAugment`'s silent degrade) renders error text —
   * they only branch on presence/absence — so storing `err.message` was a
   * dead field carrying a raw technical string nobody read (#2580). The
   * caught error itself goes to `console.warn` only — both consumers treat
   * this as routine, silent degradation: a missing `KCVV_API_URL` in
   * local/preview makes `/api/search` 503 on every debounced keystroke,
   * which is normal there, not an error.
   */
  error: boolean;
  /**
   * The query that produced the current `results`/`error` state.
   * Updated only when a fetch settles (success or error), so consumers
   * can distinguish "results we're showing" from "query the user is
   * still typing". Empty string when no search has settled.
   */
  executedQuery: string;
  search: (query: string) => void;
  clear: () => void;
}

/**
 * Provides a debounced, abortable semantic search hook that queries the application API.
 *
 * @param options - Optional configuration:
 *   - `type` — filter for the search scope (`"responsibility" | "article" | "general"`).
 *   - `limit` — maximum number of results to return (default: `5`).
 *   - `debounceMs` — debounce delay in milliseconds before performing the request (default: `300`).
 * @returns An object with:
 *   - `results` — array of `SemanticSearchResult` matched by the query.
 *   - `loading` — `true` while a request is in flight, `false` otherwise.
 *   - `error` — `true` when the last settled fetch failed, `false` otherwise.
 *   - `search` — function that initiates a debounced search for a given query string.
 *   - `clear` — function that clears `results` and `error`.
 */
export function useSemanticSearch(
  options: UseSemanticSearchOptions = {},
): UseSemanticSearchReturn {
  const { type, limit = 5, debounceMs = 300 } = options;
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [answer, setAnswer] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [executedQuery, setExecutedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    (query: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      if (!query.trim()) {
        abortRef.current?.abort();
        abortRef.current = null;
        setResults([]);
        setAnswer(undefined);
        setError(false);
        setLoading(false);
        setExecutedQuery("");
        return;
      }

      timerRef.current = setTimeout(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(false);

        try {
          const res = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, type, limit }),
            signal: controller.signal,
          });

          if (!res.ok) throw new Error(`Search failed: ${res.status}`);
          const data = (await res.json()) as {
            results: SemanticSearchResult[];
            answer?: string;
          };
          if (abortRef.current === controller) {
            setResults(data.results);
            setAnswer(data.answer);
            setExecutedQuery(query);
          }
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          console.warn("[useSemanticSearch] semantic search failed:", err);
          setError(true);
          setResults([]);
          setAnswer(undefined);
          setExecutedQuery(query);
        } finally {
          if (abortRef.current === controller) {
            setLoading(false);
          }
        }
      }, debounceMs);
    },
    [type, limit, debounceMs],
  );

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
    abortRef.current = null;
    setResults([]);
    setAnswer(undefined);
    setError(false);
    setLoading(false);
    setExecutedQuery("");
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
      abortRef.current = null; // ensures the finally guard fails after unmount
    };
  }, []);

  return { results, answer, loading, error, executedQuery, search, clear };
}
