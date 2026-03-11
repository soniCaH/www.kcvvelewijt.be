"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface SemanticSearchResult {
  id: string;
  slug: string;
  type: "responsibilityPath" | "article" | "page";
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
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  clear: () => void;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.kcvvelewijt.be";

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
 *   - `error` — error message string when a request fails, or `null`.
 *   - `search` — function that initiates a debounced search for a given query string.
 *   - `clear` — function that clears `results` and `error`.
 */
export function useSemanticSearch(
  options: UseSemanticSearchOptions = {},
): UseSemanticSearchReturn {
  const { type, limit = 5, debounceMs = 300 } = options;
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    (query: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      if (!query.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      timerRef.current = setTimeout(async () => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
          const res = await fetch(`${API_BASE}/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, type, limit }),
            signal: abortRef.current.signal,
          });

          if (!res.ok) throw new Error(`Search failed: ${res.status}`);
          const data = (await res.json()) as {
            results: SemanticSearchResult[];
          };
          setResults(data.results);
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          setError((err as Error).message);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    },
    [type, limit, debounceMs],
  );

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return { results, loading, error, search, clear };
}
