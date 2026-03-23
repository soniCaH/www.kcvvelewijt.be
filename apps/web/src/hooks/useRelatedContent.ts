"use client";

import { useState, useEffect, useCallback } from "react";
import type { SemanticSearchResult } from "./useSemanticSearch";

export function useRelatedContent(sanityId: string | null, limit = 3) {
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRelated = useCallback(
    (id: string, signal: AbortSignal) => {
      setLoading(true);
      fetch(`/api/related?id=${encodeURIComponent(id)}&limit=${limit}`, {
        signal,
      })
        .then((r) => r.json())
        .then((data: SemanticSearchResult[]) => {
          setResults(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          setResults([]);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [limit],
  );

  useEffect(() => {
    if (!sanityId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset state when input becomes null
      setResults([]);
      return;
    }

    const controller = new AbortController();
    fetchRelated(sanityId, controller.signal);

    return () => controller.abort();
  }, [sanityId, fetchRelated]);

  return { results, loading };
}
