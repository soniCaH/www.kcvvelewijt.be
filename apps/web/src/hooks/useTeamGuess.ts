"use client";

import { useEffect, useState } from "react";
import { SEMANTIC_SEARCH_DEBOUNCE_MS } from "./useSemanticSearch";

export interface TeamGuess {
  /** The query the BFF answered — compare it with the current one before use. */
  query: string;
  /** One of the allowed ages. */
  age: string;
}

/**
 * The `/hulp` team card's AI fallback (#3559): asks `POST
 * /api/search/team-guess` which of `ages` a query means, after the same
 * debounce as the semantic search. Pass `null` to ask nothing; each new query
 * cancels the pending one and aborts the one in flight.
 * Any failure, a 429 or a "none" leaves no guess — the card simply stays away.
 */
export function useTeamGuess(
  query: string | null,
  ages: readonly string[],
): TeamGuess | null {
  const [guess, setGuess] = useState<TeamGuess | null>(null);
  const agesKey = ages.join(",");

  useEffect(() => {
    if (!query || !agesKey) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch("/api/search/team-guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, ages: agesKey.split(",") }),
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { age?: string | null } | null) => {
          if (data?.age) setGuess({ query, age: data.age });
        })
        .catch((err: unknown) => {
          if ((err as Error).name !== "AbortError")
            console.warn("[useTeamGuess] team guess failed:", err);
        });
    }, SEMANTIC_SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, agesKey]);

  return guess;
}
